import express from 'express';
import { detectCategory } from '../classifiers/index.js';
import { retrieveRelevantContext } from '../retrieval/index.js';
import { buildPrompt } from '../prompt/builder.js';
import { getProvider } from '../aiProviders/index.js';
import { assembleMemory } from '../memory/assemble.js';
import { CONTEXT_BUDGET } from '../prompt/budget.js';
import {
  ownerMemoryEnabled,
  requestOwner,
  OWNER_MUTATION_DISABLED_MESSAGE,
  OWNER_INSPECT_DISABLED_MESSAGE,
} from '../memory/access.js';
import { parseMemoryCommand } from '../memory/commands.js';
import { executeMemoryCommand } from '../memory/service.js';
import { analyzeQuestion, SCOPE_REFUSAL } from '../prompt/scope.js';
import {
  newConversationId,
  isConversationId,
  loadConversation,
  getRecentTurns,
  appendExchange,
} from '../memory/conversation.js';

const router = express.Router();
const REQUEST_TIMEOUT_MS = 60_000; // temporarily extended for connectivity debugging
const CONTROL_RE = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;

function safeJson(res, status, data) {
  if (res.headersSent) return;
  try { res.status(status).json(data); } catch { /* ignore */ }
}

function toErrorPayload(statusCode, message, requestId) {
  return { success: false, status: statusCode, message, requestId };
}

export function normalizeHistory(history, question = '') {
  if (!Array.isArray(history)) return [];
  let items = history
    .filter(m => m && typeof m === 'object')
    .map(m => ({
      role: ['system', 'user', 'assistant'].includes(m.role) ? m.role : 'user',
      content: String(m.content ?? m.text ?? '').replace(CONTROL_RE, ' ').trim(),
    }))
    .filter(m => m.content.length > 0);

  // Defense-in-depth: the client may include the current turn in history while
  // also sending it as `question`; drop a trailing duplicate so the model does
  // not see the same user message twice.
  const qTrim = String(question || '').trim();
  const last = items[items.length - 1];
  if (qTrim && last && last.role === 'user' && last.content === qTrim) items = items.slice(0, -1);

  // Bound both the number of turns and their total size.
  items = items.slice(-CONTEXT_BUDGET.historyMessages);
  const bounded = [];
  let total = 0;
  for (let i = items.length - 1; i >= 0; i--) {
    const content = items[i].content.slice(0, CONTEXT_BUDGET.historyMessageChars);
    if (total + content.length > CONTEXT_BUDGET.historyTotalChars) break;
    bounded.unshift({ role: items[i].role, content });
    total += content.length;
  }
  return bounded;
}

function errorStatus(err) {
  if (!err) return 500;
  if (err.statusCode) return err.statusCode;
  const msg = err.message || '';
  if (/(408|timed ?out|timeout|abort)/i.test(msg)) return 504;
  if (/(429|rate limit|busy)/i.test(msg)) return 429;
  return 500;
}

router.post('/chat', async (req, res) => {
  const logMeta = { ts: new Date().toISOString(), id: Math.random().toString(36).slice(2, 8) };
  const requestStart = Date.now();

  // per-request controller so client disconnects can cancel provider calls
  const controller = new AbortController();
  const reqId = req.body?.requestId || Math.random().toString(36).slice(2, 10);

  const timeoutHandle = setTimeout(() => {
    if (!res.headersSent) safeJson(res, 504, toErrorPayload(504, 'The request timed out. Please try again.', reqId));
    try { controller.abort(); } catch {}
  }, REQUEST_TIMEOUT_MS);

  // NOTE: temporarily DISABLED client disconnect abort propagation to debug local connectivity issues
  // req.on('close', () => {
  //   console.log(JSON.stringify({ event: 'client_disconnected', id: logMeta.id, requestId: reqId }));
  //   try { controller.abort(); } catch {}
  // });

  try {
    const { question, history } = req.body || {};
    if (!question || typeof question !== 'string' || !question.trim()) {
      clearTimeout(timeoutHandle);
      return safeJson(res, 400, toErrorPayload(400, 'Please provide a question.', reqId));
    }

    /*
     * Explicit memory commands are handled deterministically and NEVER reach the
     * model, so the model can neither mutate memory nor fabricate a write. Owner
     * memory is owner-only and this app has no authentication, so for public
     * traffic we explain that we won't read/write it rather than doing so. A
     * trusted deployment (opt-in + verified owner identity) has commands run
     * through the internal service.
     */
    const memoryCommand = parseMemoryCommand(question);
    if (memoryCommand) {
      const ownerNamespace = ownerMemoryEnabled() ? requestOwner(req) : null;
      if (!ownerNamespace) {
        clearTimeout(timeoutHandle);
        const answer = memoryCommand.type === 'inspect'
          ? OWNER_INSPECT_DISABLED_MESSAGE
          : OWNER_MUTATION_DISABLED_MESSAGE;
        console.log(JSON.stringify({ event: 'memory_command_refused', id: logMeta.id, requestId: reqId, action: memoryCommand.type }));
        return safeJson(res, 200, { success: true, command: true, answer, requestId: reqId });
      }
      const outcome = await executeMemoryCommand(ownerNamespace, memoryCommand);
      clearTimeout(timeoutHandle);
      console.log(JSON.stringify({
        event: 'memory_command', id: logMeta.id, requestId: reqId,
        action: memoryCommand.type, ok: outcome.ok, code: outcome.code || null,
      }));
      return safeJson(res, 200, { success: true, command: true, answer: outcome.message, requestId: reqId });
    }

    /*
     * Scope + language intent (P5). Deterministic, no model call. A clearly
     * unrelated general-knowledge request is declined here (so it never reaches
     * the provider); everything else proceeds and the model receives the
     * behavior directives plus a short per-question language directive.
     */
    const analysis = analyzeQuestion(question);
    if (analysis.scope === 'out_of_scope') {
      clearTimeout(timeoutHandle);
      console.log(JSON.stringify({ event: 'chat_scope_refusal', id: logMeta.id, requestId: reqId }));
      return safeJson(res, 200, { success: true, answer: SCOPE_REFUSAL, declined: true, requestId: reqId });
    }

    /*
     * Conversation continuity (P4). This app has no authentication, so a
     * conversation is only read/persisted for a VERIFIED owner identity
     * (requestOwner, set by trusted middleware in a secured deployment). A
     * client-supplied conversationId is a locator, never proof of ownership, so
     * anonymous traffic never reads or writes owner conversations.
     */
    const ownerNs = requestOwner(req);
    let conversationId = null;
    let persistedConversation = null;
    let conversationStorageDown = false;
    if (ownerNs) {
      const requested = req.body && req.body.conversationId;
      conversationId = isConversationId(requested) ? requested : newConversationId();
      const loaded = await loadConversation(ownerNs, conversationId);
      if (loaded.ok) persistedConversation = loaded.conversation;
      else conversationStorageDown = true;
    }

    let provider;
    try {
      provider = getProvider();
    } catch (providerErr) {
      console.error(JSON.stringify({ event: 'provider_init_failed', msg: String(providerErr?.message || 'unknown').slice(0, 300) }));
      clearTimeout(timeoutHandle);
      return safeJson(res, 502, toErrorPayload(502, 'AI provider unavailable.', reqId));
    }

    let category;
    try {
      category = detectCategory(question);
    } catch {
      clearTimeout(timeoutHandle);
      return safeJson(res, 500, toErrorPayload(500, 'AI assistant is temporarily unavailable.', reqId));
    }

    let ctx;
    const retrievalStart = Date.now();
    try {
      ctx = await retrieveRelevantContext({ category, query: question });
    } catch {
      clearTimeout(timeoutHandle);
      return safeJson(res, 500, toErrorPayload(500, 'AI assistant is temporarily unavailable.', reqId));
    }
    const retrievalMs = Date.now() - retrievalStart;

    const contextStr = (ctx && ctx.context) || '';

    // Persistent memory is OWNER-ONLY. It is assembled only for a request that
    // carries a verified owner identity (trusted middleware -> requestOwner).
    // Anonymous requests never receive owner profile facts, project-memory
    // records, or stored conversations; they still get the static portfolio
    // context from retrieval above. projectId from the client is a
    // shape-validated hint only, never authentication. Any failure degrades to
    // no memory.
    let memory = { block: '', hasMemory: false, degraded: false, project: null, projectMatch: null };
    if (ownerNs) {
      try {
        memory = await assembleMemory({
          namespace: ownerNs,
          question,
          category,
          projectId: req.body?.projectId,
          conversationId,
        });
      } catch (memErr) {
        console.error(JSON.stringify({
          event: 'memory_assemble_failed', requestId: reqId,
          msg: String(memErr?.message || 'unknown').slice(0, 200),
        }));
        memory = { block: '', hasMemory: false, degraded: true, project: null, projectMatch: null };
      }
    }

    const promptBuildStart = Date.now();
    const systemPrompt = buildPrompt(contextStr, memory.block || '', analysis.directive || '');
    const promptBuildMs = Date.now() - promptBuildStart;

    // Recent turns for the provider. For a verified owner with a persisted
    // conversation, the stored turns are authoritative (they survive refresh and
    // already exclude the current question); otherwise use the bounded client
    // history, which is the only context anonymous visitors have.
    const normalizedHistory = (ownerNs && persistedConversation)
      ? getRecentTurns(persistedConversation)
      : normalizeHistory(history, question);

    // Debug log: sizes and flags only. Never log the user's question text,
    // memory, conversation, or prompt contents.
    console.log(JSON.stringify({
      event: 'chat_request', id: logMeta.id, requestId: reqId,
      category, contextSize: contextStr.length,
      systemPromptSize: systemPrompt.length,
      historyLen: normalizedHistory.length,
      questionChars: question.length,
      memory: {
        owner: !!ownerNs,
        hasMemory: memory.hasMemory === true,
        degraded: memory.degraded === true,
        memoryChars: (memory.block || '').length,
        projectMatch: memory.projectMatch || null,
      },
      conversation: {
        owner: !!ownerNs,
        idSet: !!conversationId,
        hasPersisted: !!persistedConversation,
        storageDown: conversationStorageDown,
      },
    }));

    try {
      // NOTE: do NOT pass request lifecycle signal during connectivity debugging
      const result = await provider.sendPrompt({
        systemPrompt,
        history: normalizedHistory,
        question,
        temperature: 0.05,
        maxTokens: 512,
        // signal: controller.signal, // disabled for debugging
        requestId: reqId,
      });

      const answer = result?.text?.trim?.() ?? '';
      clearTimeout(timeoutHandle);

      if (!answer) {
        return safeJson(res, 200, {
          success: true, message: 'I received your question but generated an empty response. Please try rephrasing.',
          requestId: reqId,
          ...(conversationId ? { conversationId } : {}),
        });
      }

      // Persist the exchange ONLY now that the reply succeeded. This keeps retry
      // behaviour from double-writing (failed attempts store nothing) and never
      // duplicates the current user message. Best-effort: a persistence failure
      // never fails the response, and is reported truthfully via `conversation`.
      let conversation = conversationId ? { id: conversationId, persisted: false } : null;
      if (ownerNs && conversationId && !conversationStorageDown) {
        try {
          const saved = await appendExchange(ownerNs, conversationId, {
            userText: question,
            assistantText: answer,
            projectId: (persistedConversation && persistedConversation.projectId) || req.body?.projectId,
          });
          if (saved.ok) {
            conversation = {
              id: conversationId,
              persisted: true,
              // Honest durability: true only when the durable backend stored it.
              // When Upstash was unavailable and the store fell back to ephemeral
              // memory, `durable` is false (and `degraded` is set).
              durable: saved.durable === true,
              ...(saved.degraded ? { degraded: true } : {}),
              turns: saved.turns,
              folded: saved.folded || 0,
              summaryVia: saved.via || 'none',
            };
          } else {
            console.error(JSON.stringify({ event: 'conversation_persist_failed', id: logMeta.id, requestId: reqId, error: saved.error || 'unknown' }));
          }
        } catch (persistErr) {
          console.error(JSON.stringify({ event: 'conversation_persist_error', id: logMeta.id, requestId: reqId, msg: String(persistErr?.message || 'unknown').slice(0, 200) }));
        }
      }

      const providerLatency = result?.latencyMs || 0;
      const totalMs = Date.now() - requestStart;
      console.log(JSON.stringify({
        event: 'chat_response', id: logMeta.id, requestId: reqId,
        answerLen: answer.length, provider_latency_ms: providerLatency,
        retrieval_latency_ms: retrievalMs, prompt_build_ms: promptBuildMs,
        total_request_ms: totalMs,
        conversation: conversation ? { persisted: conversation.persisted === true, durable: conversation.durable === true, folded: conversation.folded || 0 } : null,
      }));

      // lightweight performance metric event
      console.log(JSON.stringify({ event: 'metric', provider_latency_ms: providerLatency, retrieval_latency_ms: retrievalMs, total_request_ms: totalMs }));

      safeJson(res, 200, { success: true, answer, requestId: reqId, ...(conversation ? { conversationId, conversation } : {}) });
    } catch (err) {
      clearTimeout(timeoutHandle);
      if (res.headersSent) return;
      const statusCode = errorStatus(err);
      const errMsg = err?.message || 'AI assistant is temporarily unavailable.';
      const totalMs = Date.now() - requestStart;
      console.error(JSON.stringify({
        event: 'provider_error', id: logMeta.id, requestId: reqId, statusCode,
        msg: String(errMsg).slice(0, 300), retrieval_latency_ms: retrievalMs ?? null,
        prompt_build_ms: promptBuildMs ?? null, total_request_ms: totalMs,
        stack: String(err?.stack || '').slice(0, 500) || null,
      }));
      safeJson(res, statusCode, toErrorPayload(statusCode, errMsg, reqId));
    }
  } catch (err) {
    clearTimeout(timeoutHandle);
    if (res.headersSent) return;
    const fatalMsg = err?.message || 'AI assistant is temporarily unavailable.';
    console.error(JSON.stringify({
      event: 'chat_fatal', id: logMeta.id, requestId: reqId,
      msg: String(fatalMsg).slice(0, 300),
      stack: String(err?.stack || '').slice(0, 500) || null,
    }));
    safeJson(res, 500, toErrorPayload(500, 'AI assistant is temporarily unavailable.', reqId));
  }
});

router.get('/status', (req, res) => {
  safeJson(res, 200, {
    ok: true,
    uptime: Math.floor(process.uptime()),
    providerConfigured: !!process.env.GROQ_API_KEY || !!process.env.GEMINI_API_KEY,
  });
});

export default router;
