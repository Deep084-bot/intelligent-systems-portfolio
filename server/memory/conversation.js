/*
 * memory/conversation.js - persisted conversation continuity for the assistant.
 *
 * Reuses the P1 store layer (getConversation / upsertConversation) and its schema
 * (validateConversationInput / coerceConversationRecord); it does NOT introduce a
 * second persistence layer.
 *
 * Ownership: a conversation lives inside a namespace. The caller must supply a
 * TRUSTED namespace. There is no authentication in this app, so a client-supplied
 * conversation id is a locator, never proof of ownership; the chat route only
 * reads/writes conversations for a verified owner (see access.js).
 *
 * Rolling summaries: once a conversation retains >= trigger turns, the oldest
 * turns (down to `keep`) are folded into `summary` by memory/summarize.js and
 * removed from the verbatim list, so they are never summarized twice.
 * `summarizedUpTo` is a monotonic count of turns folded so far.
 *
 * Ordering: turns are always appended chronologically. Malformed/missing/
 * unsupported records are treated as an empty conversation (never fabricated).
 */

import { randomUUID } from 'node:crypto';
import { getConversation, upsertConversation } from './store.js';
import { validateUserId, validateRecordId, validateProjectId, LIMITS } from './schema.js';
import { CONTEXT_BUDGET } from '../prompt/budget.js';
import { summarizeTurns } from './summarize.js';

function intEnv(name, fallback) {
  const n = parseInt(process.env[name] || '', 10);
  return Number.isInteger(n) ? n : fallback;
}

// Trigger/keep thresholds, clamped so `keep + 2 <= trigger <= maxTurns`.
export function conversationThresholds() {
  const maxTurns = LIMITS.maxTurns;
  let keep = Math.min(Math.max(intEnv('MEMORY_SUMMARY_KEEP_RECENT', 8), 2), maxTurns - 2);
  let trigger = Math.min(Math.max(intEnv('MEMORY_SUMMARY_TRIGGER', 14), keep + 2), maxTurns);
  return { trigger, keep };
}

export function newConversationId() {
  return randomUUID();
}

export function isConversationId(value) {
  return validateRecordId(value);
}

const CONTROL_RE = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;

function normalizeTurnText(text) {
  if (typeof text !== 'string') return '';
  return text
    .replace(CONTROL_RE, ' ')
    .trim()
    .slice(0, LIMITS.maxTurnText);
}

// Load one conversation within a trusted namespace.
export async function loadConversation(namespace, conversationId) {
  if (!validateUserId(namespace)) return { ok: false, error: 'invalid_user' };
  if (!validateRecordId(conversationId)) return { ok: false, error: 'invalid_record' };
  const res = await getConversation(namespace, conversationId);
  if (!res.ok) return { ok: false, error: res.error };
  if (res.degraded) return { ok: false, error: 'storage_unavailable' };
  return { ok: true, conversation: res.conversation || null, empty: !!res.empty };
}

// Recent verbatim turns as provider-history messages, newest-last, bounded by
// count and total characters. The current question is never included (it is
// persisted only after a successful reply).
export function getRecentTurns(
  conversation,
  limit = CONTEXT_BUDGET.conversationRecentTurns,
  maxChars = CONTEXT_BUDGET.historyTotalChars,
) {
  const turns = conversation && Array.isArray(conversation.turns) ? conversation.turns : [];
  const out = [];
  let total = 0;
  for (let i = turns.length - 1; i >= 0 && out.length < limit; i--) {
    const t = turns[i];
    if (!t || (t.role !== 'user' && t.role !== 'assistant')) continue;
    const content = String(t.text || '').slice(0, CONTEXT_BUDGET.historyMessageChars);
    if (!content) continue;
    if (total + content.length > maxChars) break;
    out.unshift({ role: t.role, content });
    total += content.length;
  }
  return out;
}

/*
 * appendExchange(namespace, conversationId, { userText, assistantText, projectId })
 * Appends one successful user+assistant exchange, folds older turns into a
 * rolling summary when the threshold is reached, and persists the record.
 *
 * Returns { ok, id, created, duplicate?, folded?, via?, trimmed? }.
 * On storage failure returns { ok:false, error } so the caller can keep the
 * response but report that persistence was unavailable.
 */
export async function appendExchange(namespace, conversationId, { userText, assistantText, projectId } = {}) {
  if (!validateUserId(namespace)) return { ok: false, error: 'invalid_user' };
  if (!validateRecordId(conversationId)) return { ok: false, error: 'invalid_record' };

  const user = normalizeTurnText(userText);
  const assistant = normalizeTurnText(assistantText);
  if (!user || !assistant) return { ok: false, error: 'invalid_record' };

  const loaded = await loadConversation(namespace, conversationId);
  if (!loaded.ok) return { ok: false, error: loaded.error };

  const existing = loaded.conversation;
  let turns = existing && Array.isArray(existing.turns)
    ? existing.turns.map((t) => ({ role: t.role, text: t.text, at: t.at }))
    : [];
  let summary = existing && typeof existing.summary === 'string' ? existing.summary : '';
  let summarizedUpTo = existing && Number.isInteger(existing.summarizedUpTo) ? existing.summarizedUpTo : 0;
  const projId = validateProjectId(projectId) ? projectId : (existing && existing.projectId) || null;

  // Idempotency: the exact same trailing exchange is already stored (double
  // submit / identical retry) -> no duplicate write.
  const n = turns.length;
  if (n >= 2 && turns[n - 2].role === 'user' && turns[n - 2].text === user
    && turns[n - 1].role === 'assistant' && turns[n - 1].text === assistant) {
    return { ok: true, id: conversationId, created: false, duplicate: true, turns: n, summarizedUpTo, summaryChars: summary.length, folded: 0, via: 'none' };
  }

  const at = new Date().toISOString();
  const last = turns[turns.length - 1];
  if (!(last && last.role === 'user' && last.text === user)) {
    turns.push({ role: 'user', text: user, at });
  }
  turns.push({ role: 'assistant', text: assistant, at });

  const { trigger, keep } = conversationThresholds();
  let folded = 0;
  let via = 'none';

  if (turns.length >= trigger) {
    const overflow = Math.max(0, turns.length - keep);
    const toFold = turns.slice(0, overflow);
    // If we are over the schema cap we MUST shrink, so a content-preserving
    // fallback is allowed; otherwise defer when no provider is available.
    const force = turns.length > LIMITS.maxTurns;
    const res = await summarizeTurns({ existingSummary: summary, turns: toFold, allowFallback: force });
    if (res.ok && res.changed && toFold.length > 0) {
      summary = res.summary;
      summarizedUpTo += toFold.length;
      turns = turns.slice(overflow);
      folded = toFold.length;
      via = res.via;
    }
  }

  // Hard safety: stay within the schema turn cap even if summarization was not
  // possible. Dropping the oldest turns here is a last resort; the normal path
  // always summarizes first.
  let trimmed = 0;
  if (turns.length > LIMITS.maxTurns) {
    trimmed = turns.length - LIMITS.maxTurns;
    turns = turns.slice(trimmed);
  }

  const res = await upsertConversation(namespace, {
    id: conversationId,
    projectId: projId,
    turns,
    summary,
    summarizedUpTo,
  });
  if (!res.ok) return { ok: false, error: res.error };

  return {
    ok: true,
    id: conversationId,
    created: !existing,
    turns: res.value.turns.length,
    summarizedUpTo,
    summaryChars: summary.length,
    folded,
    via,
    trimmed,
    // Durability of the write (false when the durable backend was unavailable
    // and the store fell back to ephemeral memory).
    durable: res.durable === true,
    ...(res.degraded ? { degraded: true } : {}),
  };
}

export default { newConversationId, isConversationId, loadConversation, getRecentTurns, appendExchange, conversationThresholds };
