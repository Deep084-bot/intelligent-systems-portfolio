/*
 * server/memory/store.js - namespaced, versioned memory store for the
 * standalone portfolio assistant.
 *
 * Persistence is delegated to the existing server/cache.js abstraction
 * (Upstash Redis REST when configured, otherwise an in-process Map). No
 * database, vector store, or embedding pipeline is introduced.
 *
 * Isolation model:
 *   Every operation is explicitly scoped to a user namespace (`userId`). A
 *   `userId` is an opaque namespace label, NOT authentication. The store never
 *   validates ownership; callers must supply a trusted namespace. Because there
 *   is currently no authentication on the portfolio app, no HTTP endpoint may
 *   accept a client-supplied userId to read/write another namespace (see
 *   server/routes/memory.js).
 *
 * Storage layout (one small document per concern, per namespace):
 *   mem:v1:<uid>:profile        -> { schemaVersion, facts: Fact[] }
 *   mem:v1:<uid>:projects       -> { schemaVersion, records: { [id]: Project } }
 *   mem:v1:<uid>:conversations  -> { schemaVersion, records: { [id]: Conversation } }
 *
 * A cache miss returns an empty state; malformed or unsupported-version
 * documents are treated as empty on reads and refused (not clobbered) on writes.
 */

import { randomUUID } from 'node:crypto';
import cache, { getBackendInfo } from '../cache.js';
import {
  SCHEMA_VERSION,
  LIMITS,
  validateUserId,
  validateFactInput,
  makeFact,
  validateProfileDoc,
  validateProjectInput,
  makeProject,
  validateProjectsDoc,
  validateConversationInput,
  makeConversation,
  validateConversationsDoc,
  validateProjectId,
  validateRecordId,
  withinDocLimit,
} from './schema.js';

const PREFIX = 'mem:v1';

/*
 * Explicit retention policy for persistent memory.
 *
 * Memory must not inherit the generic 12-hour cache TTL. By default records are
 * stored with NO expiry (0) so they persist until explicitly overwritten or
 * deleted. `MEMORY_RETENTION_SECONDS` can set a positive finite retention when a
 * bounded lifetime is desired. This is an explicit, documented policy.
 */
function memoryRetentionSeconds() {
  const raw = process.env.MEMORY_RETENTION_SECONDS;
  if (raw === undefined || raw === '') return 0;
  const n = Number(raw);
  return Number.isInteger(n) && n >= 0 ? n : 0;
}

function key(uid, kind) {
  return `${PREFIX}:${uid}:${kind}`;
}

function nowIso() {
  return new Date().toISOString();
}

// --- per-namespace mutation serialization -----------------------------------
// In-process only. This makes concurrent read-modify-write cycles within one
// server instance deterministic. Across instances (serverless) the last write
// wins unless the backing store offers atomic ops; documented as a limitation.
const locks = new Map();

function withLock(uid, fn) {
  const prev = locks.get(uid) || Promise.resolve();
  const run = prev.then(fn, fn); // run regardless of the previous outcome
  locks.set(uid, run.then(() => {}, () => {}));
  return run;
}

// --- low-level document I/O -------------------------------------------------

async function loadDoc(docKey, validator) {
  let raw;
  try {
    raw = await cache.get(docKey);
  } catch {
    return { ok: false, error: 'storage_unavailable' };
  }
  if (raw === null || raw === undefined) return { ok: true, empty: true, value: null };
  if (typeof raw !== 'object' || Array.isArray(raw)) return { ok: true, malformed: true, value: null };
  if (raw.schemaVersion !== SCHEMA_VERSION) {
    return { ok: true, unsupported: true, version: raw.schemaVersion ?? null, value: null };
  }
  const validated = validator(raw);
  if (!validated.ok) return { ok: true, malformed: true, value: null };
  return { ok: true, value: validated.value };
}

async function writeDoc(docKey, doc) {
  if (!withinDocLimit(doc)) return { ok: false, error: 'limit_exceeded' };
  let res;
  try {
    res = await cache.set(docKey, doc, memoryRetentionSeconds());
  } catch {
    return { ok: false, error: 'storage_unavailable' };
  }
  if (res && res.ok === false) return { ok: false, error: 'storage_unavailable' };
  // `durable` is true only when the durable backend actually stored the record.
  // A fallback-to-memory write is still readable, but is honestly NOT durable.
  return { ok: true, durable: !!(res && res.durable === true), degraded: !!(res && res.degraded === true) };
}

// Merge write durability into a successful result so callers can tell a durable
// save from an ephemeral fallback.
function withWriteMeta(result, w) {
  return { ...result, durable: w.durable === true, ...(w.degraded ? { degraded: true } : {}) };
}

function emptyProfile() { return { facts: [] }; }
function emptyProjects() { return { records: {} }; }
function emptyConversations() { return { records: {} }; }

// A write must never silently destroy data it could not parse/version.
function guardWritable(load) {
  if (!load.ok) return 'storage_unavailable';
  if (load.unsupported) return 'unsupported_schema';
  if (load.malformed) return 'corrupt_record';
  return null;
}

// --- profile facts ----------------------------------------------------------

export async function getProfile(uid) {
  if (!validateUserId(uid)) return { ok: false, error: 'invalid_user' };
  const load = await loadDoc(key(uid, 'profile'), validateProfileDoc);
  if (!load.ok) return { ok: true, facts: [], degraded: true, storageError: load.error };
  if (load.empty || load.malformed || load.unsupported) return { ok: true, facts: [], empty: true };
  return { ok: true, facts: load.value.facts };
}

export function addFact(uid, input) {
  if (!validateUserId(uid)) return Promise.resolve({ ok: false, error: 'invalid_user' });
  const v = validateFactInput(input);
  if (!v.ok) return Promise.resolve({ ok: false, error: 'invalid_record', errors: v.errors });

  return withLock(uid, async () => {
    const load = await loadDoc(key(uid, 'profile'), validateProfileDoc);
    const guard = guardWritable(load);
    if (guard) return { ok: false, error: guard };

    const doc = load.value || emptyProfile();
    const facts = doc.facts;
    const activeIdx = facts.findIndex((f) => f.key === v.value.key && !f.supersededBy);

    if (activeIdx >= 0 && facts[activeIdx].value === v.value.value) {
      return { ok: true, value: facts[activeIdx], duplicate: true, durable: getBackendInfo().durable };
    }
    const activeCount = facts.filter((f) => !f.supersededBy).length;
    if (activeCount >= LIMITS.maxFacts) return { ok: false, error: 'limit_exceeded' };

    const now = nowIso();
    const record = makeFact(v.value, now, randomUUID());
    let supersededId = null;
    if (activeIdx >= 0) {
      supersededId = facts[activeIdx].id;
      facts[activeIdx] = { ...facts[activeIdx], supersededBy: record.id, updatedAt: now };
    }
    facts.push(record);

    const w = await writeDoc(key(uid, 'profile'), { schemaVersion: SCHEMA_VERSION, facts });
    if (!w.ok) return { ok: false, error: w.error };
    return withWriteMeta({ ok: true, value: record, superseded: supersededId }, w);
  });
}

export function updateFact(uid, factId, patch) {
  if (!validateUserId(uid)) return Promise.resolve({ ok: false, error: 'invalid_user' });
  if (!validateRecordId(factId)) return Promise.resolve({ ok: false, error: 'invalid_record', errors: ['invalid fact id'] });
  if (patch !== undefined && (typeof patch !== 'object' || patch === null || Array.isArray(patch))) {
    return Promise.resolve({ ok: false, error: 'invalid_record', errors: ['patch must be an object'] });
  }

  return withLock(uid, async () => {
    const load = await loadDoc(key(uid, 'profile'), validateProfileDoc);
    const guard = guardWritable(load);
    if (guard) return { ok: false, error: guard };

    const doc = load.value || emptyProfile();
    const idx = doc.facts.findIndex((f) => f.id === factId);
    if (idx < 0) return { ok: false, error: 'not_found' };

    const current = doc.facts[idx];
    const merged = {
      key: current.key,
      value: patch.value !== undefined ? patch.value : current.value,
      tags: patch.tags !== undefined ? patch.tags : current.tags,
      pinned: patch.pinned !== undefined ? patch.pinned : current.pinned,
      source: current.source,
    };
    const v = validateFactInput(merged);
    if (!v.ok) return { ok: false, error: 'invalid_record', errors: v.errors };

    const updated = { ...current, value: v.value.value, tags: v.value.tags, pinned: v.value.pinned, updatedAt: nowIso() };
    doc.facts[idx] = updated;

    const w = await writeDoc(key(uid, 'profile'), { schemaVersion: SCHEMA_VERSION, facts: doc.facts });
    if (!w.ok) return { ok: false, error: w.error };
    return withWriteMeta({ ok: true, value: updated }, w);
  });
}

export function deleteFact(uid, factId) {
  if (!validateUserId(uid)) return Promise.resolve({ ok: false, error: 'invalid_user' });
  if (!validateRecordId(factId)) return Promise.resolve({ ok: false, error: 'invalid_record', errors: ['invalid fact id'] });

  return withLock(uid, async () => {
    const load = await loadDoc(key(uid, 'profile'), validateProfileDoc);
    const guard = guardWritable(load);
    if (guard) return { ok: false, error: guard };

    const doc = load.value || emptyProfile();
    const before = doc.facts.length;
    const facts = doc.facts.filter((f) => f.id !== factId);
    if (facts.length === before) return { ok: false, error: 'not_found' };

    const w = await writeDoc(key(uid, 'profile'), { schemaVersion: SCHEMA_VERSION, facts });
    if (!w.ok) return { ok: false, error: w.error };
    return withWriteMeta({ ok: true, removed: before - facts.length }, w);
  });
}

// --- projects ---------------------------------------------------------------

export async function listProjects(uid) {
  if (!validateUserId(uid)) return { ok: false, error: 'invalid_user' };
  const load = await loadDoc(key(uid, 'projects'), validateProjectsDoc);
  if (!load.ok) return { ok: true, projects: [], degraded: true, storageError: load.error };
  if (load.empty || load.malformed || load.unsupported) return { ok: true, projects: [], empty: true };
  const projects = Object.values(load.value.records).map((p) => ({
    id: p.id, name: p.name, aliases: p.aliases, status: p.status, updatedAt: p.updatedAt,
  }));
  return { ok: true, projects };
}

export async function getProject(uid, projectId) {
  if (!validateUserId(uid)) return { ok: false, error: 'invalid_user' };
  if (!validateProjectId(projectId)) return { ok: false, error: 'invalid_record', errors: ['invalid project id'] };
  const load = await loadDoc(key(uid, 'projects'), validateProjectsDoc);
  if (!load.ok) return { ok: true, project: null, degraded: true, storageError: load.error };
  if (load.empty || load.malformed || load.unsupported) return { ok: true, project: null, empty: true };
  return { ok: true, project: load.value.records[projectId] || null };
}

export function upsertProject(uid, input) {
  if (!validateUserId(uid)) return Promise.resolve({ ok: false, error: 'invalid_user' });
  const v = validateProjectInput(input);
  if (!v.ok) return Promise.resolve({ ok: false, error: 'invalid_record', errors: v.errors });

  return withLock(uid, async () => {
    const load = await loadDoc(key(uid, 'projects'), validateProjectsDoc);
    const guard = guardWritable(load);
    if (guard) return { ok: false, error: guard };

    const doc = load.value || emptyProjects();
    const records = doc.records;
    const existing = records[v.value.id];
    const isNew = !existing;
    if (isNew && Object.keys(records).length >= LIMITS.maxProjects) {
      return { ok: false, error: 'limit_exceeded' };
    }

    const now = nowIso();
    const built = makeProject(v.value, now, randomUUID);
    const record = existing
      ? { ...built, createdAt: existing.createdAt || now }
      : built;
    records[v.value.id] = record;

    const w = await writeDoc(key(uid, 'projects'), { schemaVersion: SCHEMA_VERSION, records });
    if (!w.ok) return { ok: false, error: w.error };
    return withWriteMeta({ ok: true, value: record, created: isNew }, w);
  });
}

export function deleteProject(uid, projectId) {
  if (!validateUserId(uid)) return Promise.resolve({ ok: false, error: 'invalid_user' });
  if (!validateProjectId(projectId)) return Promise.resolve({ ok: false, error: 'invalid_record', errors: ['invalid project id'] });

  return withLock(uid, async () => {
    const load = await loadDoc(key(uid, 'projects'), validateProjectsDoc);
    const guard = guardWritable(load);
    if (guard) return { ok: false, error: guard };

    const doc = load.value || emptyProjects();
    if (!doc.records[projectId]) return { ok: false, error: 'not_found' };
    delete doc.records[projectId];

    const w = await writeDoc(key(uid, 'projects'), { schemaVersion: SCHEMA_VERSION, records: doc.records });
    if (!w.ok) return { ok: false, error: w.error };
    return withWriteMeta({ ok: true, removed: 1 }, w);
  });
}

// --- conversations ----------------------------------------------------------
// Schema only for P1: no extraction, summarization, or chat integration yet.

export async function getConversation(uid, conversationId) {
  if (!validateUserId(uid)) return { ok: false, error: 'invalid_user' };
  if (!validateRecordId(conversationId)) return { ok: false, error: 'invalid_record', errors: ['invalid conversation id'] };
  const load = await loadDoc(key(uid, 'conversations'), validateConversationsDoc);
  if (!load.ok) return { ok: true, conversation: null, degraded: true, storageError: load.error };
  if (load.empty || load.malformed || load.unsupported) return { ok: true, conversation: null, empty: true };
  return { ok: true, conversation: load.value.records[conversationId] || null };
}

export async function listConversations(uid) {
  if (!validateUserId(uid)) return { ok: false, error: 'invalid_user' };
  const load = await loadDoc(key(uid, 'conversations'), validateConversationsDoc);
  if (!load.ok) return { ok: true, conversations: [], degraded: true, storageError: load.error };
  if (load.empty || load.malformed || load.unsupported) return { ok: true, conversations: [], empty: true };
  const conversations = Object.values(load.value.records).map((c) => ({
    id: c.id, projectId: c.projectId, turns: c.turns.length, updatedAt: c.updatedAt,
  }));
  return { ok: true, conversations };
}

export function upsertConversation(uid, input) {
  if (!validateUserId(uid)) return Promise.resolve({ ok: false, error: 'invalid_user' });
  const v = validateConversationInput(input);
  if (!v.ok) return Promise.resolve({ ok: false, error: 'invalid_record', errors: v.errors });

  return withLock(uid, async () => {
    const load = await loadDoc(key(uid, 'conversations'), validateConversationsDoc);
    const guard = guardWritable(load);
    if (guard) return { ok: false, error: guard };

    const doc = load.value || emptyConversations();
    const records = doc.records;
    const id = validateRecordId(input.id) ? input.id : randomUUID();
    const existing = records[id];
    const isNew = !existing;
    if (isNew && Object.keys(records).length >= LIMITS.maxConversations) {
      return { ok: false, error: 'limit_exceeded' };
    }

    const now = nowIso();
    const built = makeConversation(v.value, now, id);
    const record = existing ? { ...built, createdAt: existing.createdAt || now } : built;
    records[id] = record;

    const w = await writeDoc(key(uid, 'conversations'), { schemaVersion: SCHEMA_VERSION, records });
    if (!w.ok) return { ok: false, error: w.error };
    return withWriteMeta({ ok: true, value: record, created: isNew }, w);
  });
}

export function deleteConversation(uid, conversationId) {
  if (!validateUserId(uid)) return Promise.resolve({ ok: false, error: 'invalid_user' });
  if (!validateRecordId(conversationId)) return Promise.resolve({ ok: false, error: 'invalid_record', errors: ['invalid conversation id'] });

  return withLock(uid, async () => {
    const load = await loadDoc(key(uid, 'conversations'), validateConversationsDoc);
    const guard = guardWritable(load);
    if (guard) return { ok: false, error: guard };

    const doc = load.value || emptyConversations();
    if (!doc.records[conversationId]) return { ok: false, error: 'not_found' };
    delete doc.records[conversationId];

    const w = await writeDoc(key(uid, 'conversations'), { schemaVersion: SCHEMA_VERSION, records: doc.records });
    if (!w.ok) return { ok: false, error: w.error };
    return withWriteMeta({ ok: true, removed: 1 }, w);
  });
}

// --- lifecycle --------------------------------------------------------------

export function wipeUser(uid) {
  if (!validateUserId(uid)) return Promise.resolve({ ok: false, error: 'invalid_user' });
  return withLock(uid, async () => {
    const kinds = ['profile', 'projects', 'conversations'];
    const removed = [];
    for (const kind of kinds) {
      try {
        await cache.del(key(uid, kind));
        removed.push(kind);
      } catch {
        return { ok: false, error: 'storage_unavailable' };
      }
    }
    return { ok: true, removed };
  });
}

// --- status / introspection -------------------------------------------------

export async function ping() {
  try {
    if (typeof cache.probe === 'function') {
      const probe = await cache.probe();
      return probe.reachable === true;
    }
    // Fallback for older/ephemeral cache stubs without a probe method.
    await cache.get(`${PREFIX}:__ping__`);
    return true;
  } catch {
    return false;
  }
}

export async function getStatus(uid) {
  if (!validateUserId(uid)) return { ok: false, error: 'invalid_user' };
  const [profile, projects, conversations] = await Promise.all([
    loadDoc(key(uid, 'profile'), validateProfileDoc),
    loadDoc(key(uid, 'projects'), validateProjectsDoc),
    loadDoc(key(uid, 'conversations'), validateConversationsDoc),
  ]);

  if (!profile.ok || !projects.ok || !conversations.ok) {
    return { ok: false, error: 'storage_unavailable' };
  }

  const facts = profile.value ? profile.value.facts : [];
  const activeFacts = facts.filter((f) => !f.supersededBy).length;
  const projRecords = projects.value ? projects.value.records : {};
  const convRecords = conversations.value ? conversations.value.records : {};

  return {
    ok: true,
    counts: {
      facts: facts.length,
      activeFacts,
      supersededFacts: facts.length - activeFacts,
      projects: Object.keys(projRecords).length,
      conversations: Object.keys(convRecords).length,
      turns: Object.values(convRecords).reduce((sum, c) => sum + (Array.isArray(c.turns) ? c.turns.length : 0), 0),
    },
    state: {
      profile: profile.value ? 'present' : (profile.unsupported ? 'unsupported' : profile.malformed ? 'malformed' : 'empty'),
      projects: projects.value ? 'present' : (projects.unsupported ? 'unsupported' : projects.malformed ? 'malformed' : 'empty'),
      conversations: conversations.value ? 'present' : (conversations.unsupported ? 'unsupported' : conversations.malformed ? 'malformed' : 'empty'),
    },
  };
}

export function getBackend() {
  return getBackendInfo();
}

export { validateUserId };

export default {
  getBackendInfo,
  getBackend,
  ping,
  getStatus,
  getProfile,
  addFact,
  updateFact,
  deleteFact,
  listProjects,
  getProject,
  upsertProject,
  deleteProject,
  getConversation,
  listConversations,
  upsertConversation,
  deleteConversation,
  wipeUser,
  validateUserId,
};
