/*
 * server/memory/schema.js - versioned schema + validation for the standalone
 * portfolio assistant's memory records.
 *
 * Pure module: no I/O, no cache, no HTTP. It owns record shape, allowed keys,
 * and size limits. Persistence lives in server/memory/store.js; transport lives
 * in server/routes/memory.js.
 *
 * Design notes:
 *  - Every stored document carries `schemaVersion`. Unknown/newer versions are
 *    reported as "unsupported" by the store rather than silently coerced.
 *  - Validators return { ok, value } or { ok:false, errors }. Stored reads
 *    coerce + drop unknown fields; malformed records are treated as a cache miss
 *    (never fabricated).
 *  - Profile facts use an allow-list of keys so callers cannot invent arbitrary
 *    memory dimensions.
 */

export const SCHEMA_VERSION = 1;

export const LIMITS = Object.freeze({
  maxFacts: 100,
  maxProjects: 50,
  maxConversations: 20,
  maxTurns: 40,
  maxDecisions: 100,
  maxAliases: 20,
  maxArrayItems: 200,
  maxString: 500,
  maxTag: 80,
  maxTurnText: 2000,
  maxSummary: 2000,
  maxDocBytes: 256 * 1024, // 256 KB per stored document
});

export const PROFILE_FACT_KEYS = new Set([
  'identity.role',
  'identity.education',
  'identity.career_goal',
  'dsa.default_language',
  'learning.explanation_style',
  'preference.response_style',
  'constraint.recurring',
]);

export const ALLOWED_LANGUAGES = new Set([
  'Java', 'Python', 'C', 'C++', 'C#', 'JavaScript', 'TypeScript',
  'Go', 'Rust', 'Kotlin', 'Swift', 'SQL',
]);

export const PROJECT_STATUSES = new Set([
  'planning', 'active', 'paused', 'blocked', 'completed', 'archived',
]);

export const CONVERSATION_ROLES = new Set(['user', 'assistant']);

const USER_RE = /^[A-Za-z0-9_-]{8,64}$/;
const PROJECT_ID_RE = /^[a-z0-9][a-z0-9-]{0,63}$/;
const RECORD_ID_RE = /^[A-Za-z0-9_-]{6,64}$/;

// --- primitive guards -------------------------------------------------------

export function isPlainObject(v) {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

export function validateUserId(v) {
  return typeof v === 'string' && USER_RE.test(v);
}

export function validateProjectId(v) {
  return typeof v === 'string' && PROJECT_ID_RE.test(v);
}

export function validateRecordId(v) {
  return typeof v === 'string' && RECORD_ID_RE.test(v);
}

function cleanString(v, max) {
  if (typeof v !== 'string') return '';
  // strip control chars except tab/newline/carriage return, then trim + clamp
  return v
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .trim()
    .slice(0, max);
}

function cleanStringArray(v, maxItems, maxLen) {
  if (!Array.isArray(v)) return [];
  const out = [];
  for (const item of v) {
    if (typeof item !== 'string') continue;
    const s = cleanString(item, maxLen);
    if (s) out.push(s);
    if (out.length >= maxItems) break;
  }
  return out;
}

export function docBytes(v) {
  try {
    return Buffer.byteLength(JSON.stringify(v), 'utf8');
  } catch {
    return Infinity;
  }
}

export function withinDocLimit(v) {
  return docBytes(v) <= LIMITS.maxDocBytes;
}

function ok(value) {
  return { ok: true, value };
}

function fail(...errors) {
  return { ok: false, errors: errors.filter(Boolean) };
}

function slugify(name) {
  return cleanString(name, LIMITS.maxString)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 63);
}

// --- profile facts ----------------------------------------------------------

export function validateFactInput(input) {
  if (!isPlainObject(input)) return fail('fact must be an object');
  const errors = [];

  const key = input.key;
  if (typeof key !== 'string' || !PROFILE_FACT_KEYS.has(key)) {
    errors.push('unknown fact key');
  }

  let value = '';
  if (typeof input.value !== 'string' || input.value.trim().length === 0) {
    errors.push('value must be a non-empty string');
  } else {
    value = cleanString(input.value, LIMITS.maxString);
    if (value.length === 0) errors.push('value is empty after sanitization');
    if (key === 'dsa.default_language' && !ALLOWED_LANGUAGES.has(value)) {
      errors.push('unsupported default language');
    }
  }

  if (input.tags !== undefined && !Array.isArray(input.tags)) {
    errors.push('tags must be an array');
  } else if (Array.isArray(input.tags) && input.tags.length > LIMITS.maxArrayItems) {
    errors.push('too many tags');
  }
  if (input.pinned !== undefined && typeof input.pinned !== 'boolean') {
    errors.push('pinned must be a boolean');
  }

  if (errors.length) return fail(...errors);

  return ok({
    key,
    value,
    tags: cleanStringArray(input.tags, LIMITS.maxArrayItems, LIMITS.maxTag),
    pinned: input.pinned === true,
    source: input.source === 'system' ? 'system' : 'user',
  });
}

export function makeFact(normalized, now, id) {
  return {
    id,
    key: normalized.key,
    value: normalized.value,
    scope: 'profile',
    tags: normalized.tags,
    pinned: normalized.pinned,
    source: normalized.source,
    createdAt: now,
    updatedAt: now,
    supersededBy: null,
  };
}

export function coerceFactRecord(rec) {
  if (!isPlainObject(rec)) return fail('fact is not an object');
  if (!validateRecordId(rec.id)) return fail('invalid fact id');
  if (typeof rec.key !== 'string' || !PROFILE_FACT_KEYS.has(rec.key)) {
    return fail('invalid fact key');
  }
  if (typeof rec.value !== 'string' || rec.value.length === 0 || rec.value.length > LIMITS.maxString) {
    return fail('invalid fact value');
  }
  if (rec.key === 'dsa.default_language' && !ALLOWED_LANGUAGES.has(rec.value)) {
    return fail('invalid default language');
  }
  if (rec.tags !== undefined && rec.tags !== null && !Array.isArray(rec.tags)) {
    return fail('invalid fact tags');
  }
  if (rec.supersededBy !== undefined && rec.supersededBy !== null && !validateRecordId(rec.supersededBy)) {
    return fail('invalid supersededBy');
  }
  return ok({
    id: rec.id,
    key: rec.key,
    value: rec.value,
    scope: 'profile',
    tags: Array.isArray(rec.tags) ? cleanStringArray(rec.tags, LIMITS.maxArrayItems, LIMITS.maxTag) : [],
    pinned: rec.pinned === true,
    source: rec.source === 'system' ? 'system' : 'user',
    createdAt: typeof rec.createdAt === 'string' ? rec.createdAt : null,
    updatedAt: typeof rec.updatedAt === 'string' ? rec.updatedAt : null,
    supersededBy: rec.supersededBy || null,
  });
}

// --- project records --------------------------------------------------------

function validateDecisionInput(input) {
  if (!isPlainObject(input)) return fail('decision must be an object');
  const text = cleanString(input.text, LIMITS.maxString);
  if (!text) return fail('decision text is required');
  if (input.rationale !== undefined && input.rationale !== null && typeof input.rationale !== 'string') {
    return fail('decision rationale must be a string');
  }
  return ok({
    id: validateRecordId(input.id) ? input.id : null, // null => assigned by store
    text,
    rationale: input.rationale ? cleanString(input.rationale, LIMITS.maxString) : '',
    at: typeof input.at === 'string' ? input.at : null,
    confirmed: input.confirmed === true,
  });
}

export function validateProjectInput(input) {
  if (!isPlainObject(input)) return fail('project must be an object');
  const errors = [];

  const name = cleanString(input.name, LIMITS.maxString);
  if (!name) errors.push('project name is required');

  let id = null;
  if (input.id !== undefined && input.id !== null) {
    if (!validateProjectId(input.id)) errors.push('invalid project id');
    else id = input.id;
  } else if (name) {
    id = slugify(name);
    if (!validateProjectId(id)) errors.push('project name cannot be slugified to a valid id');
  }

  let status = 'active';
  if (input.status !== undefined && input.status !== null) {
    if (!PROJECT_STATUSES.has(input.status)) errors.push('invalid project status');
    else status = input.status;
  }

  if (input.aliases !== undefined && !Array.isArray(input.aliases)) {
    errors.push('aliases must be an array');
  }

  let decisions = [];
  if (input.decisions !== undefined && input.decisions !== null) {
    if (!Array.isArray(input.decisions)) errors.push('decisions must be an array');
    else if (input.decisions.length > LIMITS.maxDecisions) errors.push('too many decisions');
    else {
      for (const d of input.decisions) {
        const r = validateDecisionInput(d);
        if (!r.ok) { errors.push('invalid decision: ' + r.errors.join(', ')); break; }
        decisions.push(r.value);
      }
    }
  }

  if (errors.length) return fail(...errors);

  return ok({
    id,
    name,
    aliases: cleanStringArray(input.aliases, LIMITS.maxAliases, LIMITS.maxTag),
    purpose: input.purpose ? cleanString(input.purpose, LIMITS.maxString) : '',
    stack: cleanStringArray(input.stack, LIMITS.maxArrayItems, LIMITS.maxTag),
    status,
    decisions,
    completed: cleanStringArray(input.completed, LIMITS.maxArrayItems, LIMITS.maxString),
    bugs: cleanStringArray(input.bugs, LIMITS.maxArrayItems, LIMITS.maxString),
    failedApproaches: cleanStringArray(input.failedApproaches, LIMITS.maxArrayItems, LIMITS.maxString),
    nextTasks: cleanStringArray(input.nextTasks, LIMITS.maxArrayItems, LIMITS.maxString),
    notes: cleanStringArray(input.notes, LIMITS.maxArrayItems, LIMITS.maxString),
  });
}

export function makeProject(normalized, now, idGen) {
  return {
    id: normalized.id,
    name: normalized.name,
    aliases: normalized.aliases,
    purpose: normalized.purpose,
    stack: normalized.stack,
    status: normalized.status,
    decisions: normalized.decisions.map((d) => ({
      id: d.id || idGen(),
      text: d.text,
      rationale: d.rationale,
      at: d.at || now,
      confirmed: d.confirmed,
    })),
    completed: normalized.completed,
    bugs: normalized.bugs,
    failedApproaches: normalized.failedApproaches,
    nextTasks: normalized.nextTasks,
    notes: normalized.notes,
    createdAt: now,
    updatedAt: now,
  };
}

export function coerceProjectRecord(rec) {
  if (!isPlainObject(rec)) return fail('project is not an object');
  if (!validateProjectId(rec.id)) return fail('invalid project id');
  if (typeof rec.name !== 'string' || !rec.name.trim()) return fail('invalid project name');
  const status = PROJECT_STATUSES.has(rec.status) ? rec.status : 'active';
  let decisions = [];
  if (Array.isArray(rec.decisions)) {
    if (rec.decisions.length > LIMITS.maxDecisions) return fail('too many decisions');
    for (const d of rec.decisions) {
      const r = validateDecisionInput(d);
      if (!r.ok) return fail('invalid decision record');
      decisions.push({ ...r.value, id: validateRecordId(d.id) ? d.id : null, at: typeof d.at === 'string' ? d.at : null });
    }
  }
  return ok({
    id: rec.id,
    name: cleanString(rec.name, LIMITS.maxString),
    aliases: cleanStringArray(rec.aliases, LIMITS.maxAliases, LIMITS.maxTag),
    purpose: typeof rec.purpose === 'string' ? cleanString(rec.purpose, LIMITS.maxString) : '',
    stack: cleanStringArray(rec.stack, LIMITS.maxArrayItems, LIMITS.maxTag),
    status,
    decisions,
    completed: cleanStringArray(rec.completed, LIMITS.maxArrayItems, LIMITS.maxString),
    bugs: cleanStringArray(rec.bugs, LIMITS.maxArrayItems, LIMITS.maxString),
    failedApproaches: cleanStringArray(rec.failedApproaches, LIMITS.maxArrayItems, LIMITS.maxString),
    nextTasks: cleanStringArray(rec.nextTasks, LIMITS.maxArrayItems, LIMITS.maxString),
    notes: cleanStringArray(rec.notes, LIMITS.maxArrayItems, LIMITS.maxString),
    createdAt: typeof rec.createdAt === 'string' ? rec.createdAt : null,
    updatedAt: typeof rec.updatedAt === 'string' ? rec.updatedAt : null,
  });
}

// --- conversation records ---------------------------------------------------

function cleanTurn(turn) {
  if (!isPlainObject(turn)) return null;
  if (!CONVERSATION_ROLES.has(turn.role)) return null;
  const text = cleanString(turn.text, LIMITS.maxTurnText);
  if (!text) return null;
  return { role: turn.role, text, at: typeof turn.at === 'string' ? turn.at : null };
}

export function validateConversationInput(input) {
  if (!isPlainObject(input)) return fail('conversation must be an object');
  const errors = [];

  if (input.projectId !== undefined && input.projectId !== null && !validateProjectId(input.projectId)) {
    errors.push('invalid projectId');
  }

  let turns = [];
  if (input.turns !== undefined && input.turns !== null) {
    if (!Array.isArray(input.turns)) errors.push('turns must be an array');
    else if (input.turns.length > LIMITS.maxTurns) errors.push('too many turns');
    else {
      for (const t of input.turns) {
        const cleaned = cleanTurn(t);
        if (!cleaned) { errors.push('invalid turn'); break; }
        turns.push(cleaned);
      }
    }
  }

  if (input.summary !== undefined && input.summary !== null && typeof input.summary !== 'string') {
    errors.push('summary must be a string');
  }

  // Count of leading turns already folded into `summary` (monotonic across the
  // record's life). Optional; when absent, makeConversation defaults to the
  // number of turns (preserves the original P1 behavior).
  let summarizedUpTo = null;
  if (input.summarizedUpTo !== undefined && input.summarizedUpTo !== null) {
    if (!Number.isInteger(input.summarizedUpTo) || input.summarizedUpTo < 0) {
      errors.push('summarizedUpTo must be a non-negative integer');
    } else {
      summarizedUpTo = input.summarizedUpTo;
    }
  }

  if (errors.length) return fail(...errors);

  return ok({
    projectId: input.projectId || null,
    turns,
    summary: input.summary ? cleanString(input.summary, LIMITS.maxSummary) : '',
    summarizedUpTo,
  });
}

function estimateTokens(turns, summary) {
  const text = summary + turns.map((t) => t.text).join(' ');
  return Math.ceil(text.length / 4);
}

export function makeConversation(normalized, now, id) {
  return {
    id,
    projectId: normalized.projectId,
    turns: normalized.turns.map((t) => ({ role: t.role, text: t.text, at: t.at || now })),
    summary: normalized.summary,
    summarizedUpTo: Number.isInteger(normalized.summarizedUpTo) ? normalized.summarizedUpTo : normalized.turns.length,
    tokenEstimate: estimateTokens(normalized.turns, normalized.summary),
    createdAt: now,
    updatedAt: now,
  };
}

export function coerceConversationRecord(rec) {
  if (!isPlainObject(rec)) return fail('conversation is not an object');
  if (!validateRecordId(rec.id)) return fail('invalid conversation id');
  if (rec.projectId !== undefined && rec.projectId !== null && !validateProjectId(rec.projectId)) {
    return fail('invalid conversation projectId');
  }
  const turns = [];
  if (rec.turns !== undefined && rec.turns !== null) {
    if (!Array.isArray(rec.turns)) return fail('invalid conversation turns');
    if (rec.turns.length > LIMITS.maxTurns) return fail('too many turns');
    for (const t of rec.turns) {
      const cleaned = cleanTurn(t);
      if (!cleaned) return fail('invalid conversation turn');
      turns.push(cleaned);
    }
  }
  return ok({
    id: rec.id,
    projectId: rec.projectId || null,
    turns,
    summary: typeof rec.summary === 'string' ? cleanString(rec.summary, LIMITS.maxSummary) : '',
    summarizedUpTo: Number.isInteger(rec.summarizedUpTo) ? rec.summarizedUpTo : turns.length,
    tokenEstimate: Number.isInteger(rec.tokenEstimate) ? rec.tokenEstimate : estimateTokens(turns, typeof rec.summary === 'string' ? rec.summary : ''),
    createdAt: typeof rec.createdAt === 'string' ? rec.createdAt : null,
    updatedAt: typeof rec.updatedAt === 'string' ? rec.updatedAt : null,
  });
}

// --- document envelopes -----------------------------------------------------

export function makeProfileDoc(facts) {
  return { schemaVersion: SCHEMA_VERSION, facts };
}

export function makeProjectsDoc(records) {
  return { schemaVersion: SCHEMA_VERSION, records };
}

export function makeConversationsDoc(records) {
  return { schemaVersion: SCHEMA_VERSION, records };
}

export function validateProfileDoc(doc) {
  if (!isPlainObject(doc)) return fail('profile document is not an object');
  if (!Array.isArray(doc.facts)) return fail('profile facts must be an array');
  const facts = [];
  for (const f of doc.facts) {
    const r = coerceFactRecord(f);
    if (!r.ok) return fail('invalid profile fact record');
    facts.push(r.value);
  }
  return ok({ facts });
}

export function validateProjectsDoc(doc) {
  if (!isPlainObject(doc)) return fail('projects document is not an object');
  if (!isPlainObject(doc.records)) return fail('project records must be an object map');
  const entries = Object.entries(doc.records);
  if (entries.length > LIMITS.maxProjects) return fail('too many project records');
  const records = {};
  for (const [id, rec] of entries) {
    if (!validateProjectId(id)) return fail('invalid project map key');
    const r = coerceProjectRecord(rec);
    if (!r.ok) return fail('invalid project record');
    records[id] = r.value;
  }
  return ok({ records });
}

export function validateConversationsDoc(doc) {
  if (!isPlainObject(doc)) return fail('conversations document is not an object');
  if (!isPlainObject(doc.records)) return fail('conversation records must be an object map');
  const entries = Object.entries(doc.records);
  if (entries.length > LIMITS.maxConversations) return fail('too many conversation records');
  const records = {};
  for (const [id, rec] of entries) {
    if (!validateRecordId(id)) return fail('invalid conversation map key');
    const r = coerceConversationRecord(rec);
    if (!r.ok) return fail('invalid conversation record');
    records[id] = r.value;
  }
  return ok({ records });
}
