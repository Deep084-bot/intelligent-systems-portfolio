/*
 * memory/commands.js - deterministic parser for explicit memory commands.
 *
 * Turns a small, documented grammar into a structured intent. This is a pure
 * function: no I/O, no model call. Anything that is not a clear command returns
 * null so ordinary conversation stays on the normal chat path.
 *
 * It NEVER treats casual talk, speculation, or proposals as memory. Only
 * explicit verbs ("remember", "forget", "update", "what do you remember") with a
 * recognizable target produce an intent; unrecognized targets become a
 * `clarify`-worthy intent the service refuses to store.
 *
 * Supported grammar (examples):
 *   "Remember that I prefer Java for DSA."            -> remember fact dsa.default_language
 *   "Remember that Resyntha uses FAISS."              -> remember project decision
 *   "Remember that Resyntha's architecture is X."     -> remember project decision
 *   "Update my Resyntha architecture decision to X."  -> update project decision
 *   "Update my response style to concise."            -> update fact
 *   "Forget my preference for Java."                  -> forget fact
 *   "Forget Resyntha's architecture decision."        -> forget project decision
 *   "Forget everything about me."                     -> wipe
 *   "What do you remember about my projects?"         -> inspect projects
 */

import { ALLOWED_LANGUAGES } from './schema.js';

const MAX_COMMAND_CHARS = 500;

function tidy(value, max = 400) {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/^[\s"'`]+|[\s"'`]+$/g, '')
    .replace(/[\u0000-\u001F\u007F]/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/[.!?;:,\s]+$/g, '')
    .trim()
    .slice(0, max);
}

function tidyRef(value) {
  return tidy(value, 100)
    .replace(/^(?:that|my|the|our|a|an)\s+/i, '')
    .replace(/(?:'s|s')$/i, '')
    .trim();
}

function stripPrefix(text, words) {
  let out = text.trim();
  out = out.replace(/^(?:please|could you|can you|would you|hey|hi)\s+/i, '');
  for (const w of words) {
    const re = new RegExp('^' + w + '\\b[\\s:,-]*', 'i');
    if (re.test(out)) return out.replace(re, '').replace(/^that\s+/i, '').trim();
  }
  return null;
}

function findLanguage(text) {
  for (const lang of ALLOWED_LANGUAGES) {
    const esc = lang.replace(/[+#]/g, (m) => '\\' + m);
    const re = new RegExp(`(^|[^A-Za-z0-9+#])${esc}([^A-Za-z0-9+#]|$)`, 'i');
    if (re.test(text)) return lang;
  }
  return null;
}

// Maps a phrase to an allow-listed profile fact key (+ value when present).
function matchFactPhrase(text) {
  const t = String(text || '').trim();
  if (!t) return null;

  const lang = findLanguage(t);
  if (lang && /\b(dsa|data\s*structures?|algorithm|leetcode|coding|competitive|prefer)/i.test(t)) {
    return { key: 'dsa.default_language', value: lang };
  }

  const tables = [
    [/\b(?:my\s+)?(?:role|job|title|position)\b\s*(?:is|=|:|to)?\s*(.+)/i, 'identity.role'],
    [/\b(?:my\s+)?(?:education|degree|college|university)\b\s*(?:is|=|:|to)?\s*(.+)/i, 'identity.education'],
    [/\b(?:my\s+)?(?:career\s+goals?|aspirations?|ambitions?|goal)\b\s*(?:is|=|:|to)?\s*(.+)/i, 'identity.career_goal'],
    [/\b(?:my\s+)?(?:explanation\s+style|learning\s+style)\b\s*(?:is|=|:|to)?\s*(.+)/i, 'learning.explanation_style'],
    [/\b(?:my\s+)?(?:response\s+style|answer\s+style|communication\s+style)\b\s*(?:is|=|:|to)?\s*(.+)/i, 'preference.response_style'],
    [/\b(?:my\s+)?(?:recurring\s+constraint|recurring\s+issue|constraint)\b\s*(?:is|=|:|to)?\s*(.+)/i, 'constraint.recurring'],
  ];
  for (const [re, key] of tables) {
    const m = t.match(re);
    if (m && m[1]) {
      const value = tidy(m[1]);
      if (value) return { key, value };
    }
  }
  return null;
}

function matchProjectStatement(text) {
  const t = String(text || '').trim();
  let m = t.match(/^(.+?)\s+(?:uses|is using|is built with|is built on|is built using|adopted)\s+(.+)$/i);
  if (m) return { ref: tidyRef(m[1]), decision: tidy(m[2]) };
  m = t.match(/^(.+?)(?:'s|s')\s+(?:architecture|decision|approach|stack|design)\s+is\s+(.+)$/i);
  if (m) return { ref: tidyRef(m[1]), decision: tidy(m[2]) };
  m = t.match(/^(.+?)\s+(?:architecture|decision|approach|stack|design)\s+is\s+(.+)$/i);
  if (m) return { ref: tidyRef(m[1]), decision: tidy(m[2]) };
  return null;
}

function matchProjectUpdate(text) {
  const t = String(text || '').trim();
  let m = t.match(/^(.+?)(?:'s)?\s+(?:architecture\s+)?decision\s+(?:to|is)\s+(.+)$/i);
  if (m) return { ref: tidyRef(m[1]), decision: tidy(m[2]) };
  m = t.match(/^(.+?)(?:'s)?\s+(?:architecture|approach|stack|design)\s+to\s+(.+)$/i);
  if (m) return { ref: tidyRef(m[1]), decision: tidy(m[2]) };
  return null;
}

function isWipe(text) {
  return /\b(?:everything|all\s+my\s+(?:memory|memories|facts)|my\s+(?:entire|whole)\s+memory|clear\s+my\s+memory|wipe\s+(?:my\s+)?memory)\b/i.test(text);
}

// Reject conversational filler ("forget it", "update that") so ordinary chat is
// not hijacked by a command prefix with no real target.
const FILLER_RE = /^(?:about\s+)?(?:it|that|this|them|those|him|her|me|us|you)\b/i;
function isFiller(text) {
  const t = tidy(text);
  if (!t) return true;
  if (FILLER_RE.test(t)) return true;
  return t.split(' ').length < 2;
}

export function parseMemoryCommand(input) {
  if (typeof input !== 'string') return null;
  const raw = input.trim();
  if (!raw || raw.length > MAX_COMMAND_CHARS) return null;
  const text = raw.replace(/\s+/g, ' ');

  // ---- inspect ----
  if (/^(?:what do you (?:remember|know)|what have you (?:stored|remembered|got)|list (?:my|the|all)\s+(?:memor(?:y|ies)|facts)|show (?:my|the)\s+memor(?:y|ies))\b/i.test(text)) {
    let scope = 'all';
    if (/\bprojects?\b/i.test(text)) scope = 'projects';
    else if (/\b(?:facts?|preferences?|profile|about me)\b/i.test(text)) scope = 'profile';
    return { type: 'inspect', scope };
  }

  // ---- remember ----
  const rememberRest = stripPrefix(text, ['remember', 'note', 'store', 'keep in mind']);
  if (rememberRest !== null) {
    const fact = matchFactPhrase(rememberRest);
    if (fact) return { type: 'remember', target: 'fact', key: fact.key, value: fact.value };
    const proj = matchProjectStatement(rememberRest);
    if (proj && proj.ref && proj.decision) {
      return { type: 'remember', target: 'project', ref: proj.ref, decision: proj.decision };
    }
    return { type: 'remember', target: 'unknown', raw: tidy(rememberRest, 200) };
  }

  // ---- update ----
  const updateRest = stripPrefix(text, ['update', 'change', 'correct', 'amend']);
  if (updateRest !== null) {
    const proj = matchProjectUpdate(updateRest);
    if (proj && proj.ref && proj.decision) {
      return { type: 'update', target: 'project', ref: proj.ref, decision: proj.decision };
    }
    const fact = matchFactPhrase(updateRest);
    if (fact) return { type: 'update', target: 'fact', key: fact.key, value: fact.value };
    if (isFiller(updateRest)) return null;
    return { type: 'update', target: 'unknown', raw: tidy(updateRest, 200) };
  }

  // ---- forget / delete (memory-scoped only) ----
  const forgetRest = stripPrefix(text, ['forget', 'remove', 'delete', 'drop']);
  if (forgetRest !== null) {
    const isForgetVerb = /^(?:please\s+)?forget\b/i.test(text);
    const memoryScoped = /\b(?:memory|memories|facts?|preferences?|prefer|remember|stored)\b/i.test(text);
    // "delete"/"remove" only count when clearly about memory to avoid hijacking
    // ordinary requests like "remove the last line".
    if (!isForgetVerb && !memoryScoped) return null;

    if (isWipe(forgetRest)) return { type: 'wipe' };

    const fact = matchFactPhrase(forgetRest);
    if (fact) return { type: 'forget', target: 'fact', key: fact.key, value: fact.value };

    const projDecision = forgetRest.match(/^(.+?)(?:'s|s')?\s+(?:architecture\s+)?decision\b/i);
    if (projDecision) return { type: 'forget', target: 'project', ref: tidyRef(projDecision[1]) };

    if (isFiller(forgetRest)) return null;
    return { type: 'forget', target: 'unknown', raw: tidy(forgetRest, 200) };
  }

  return null;
}

export default parseMemoryCommand;
