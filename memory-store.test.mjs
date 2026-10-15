// Focused tests for the standalone assistant's memory store, schema validation,
// and the read-only status endpoint. Plain Node ESM, no network/DB required:
// the store falls back to server/cache.js's in-memory backend.
import express from 'express';
import cache, { getBackendInfo } from './server/cache.js';
import {
  SCHEMA_VERSION,
  validateUserId,
  validateFactInput,
  validateProjectInput,
  docBytes,
  withinDocLimit,
  LIMITS,
} from './server/memory/schema.js';
import store from './server/memory/store.js';
import memoryRouter from './server/routes/memory.js';

let pass = 0, fail = 0;
const results = [];
const ok = (name, cond, detail = '') => {
  if (cond) pass++; else fail++;
  results.push(`${cond ? 'PASS' : 'FAIL'} ${name}${detail ? ' :: ' + detail : ''}`);
};

const UID = 'user_abcdef1234567890';
const UID2 = 'user_zzzzzzzz00000000';
const pkey = (uid, kind) => `mem:v1:${uid}:${kind}`;

async function main() {
  // ---- 0. backend info / durability reporting ----
  const info = getBackendInfo();
  ok('backend info reports a mode', info.mode === 'upstash' || info.mode === 'memory', info.mode);
  ok('backend durability mirrors upstash mode', info.durable === (info.mode === 'upstash'));
  ok('store.getBackend() exposes backend info', store.getBackend().mode === info.mode);

  // ---- 1. schema validation primitives ----
  ok('SCHEMA_VERSION is 1', SCHEMA_VERSION === 1);
  ok('validateUserId rejects short ids', validateUserId('abc') === false);
  ok('validateUserId rejects illegal chars', validateUserId('has spaces!!') === false);
  ok('validateUserId accepts 8-64 token ids', validateUserId(UID) === true);
  ok('validateFactInput rejects unknown key', validateFactInput({ key: 'nope', value: 'x' }).ok === false);
  ok('validateFactInput rejects empty value', validateFactInput({ key: 'identity.role', value: '  ' }).ok === false);
  ok('validateFactInput rejects bad language', validateFactInput({ key: 'dsa.default_language', value: 'COBOL' }).ok === false);
  ok('validateFactInput accepts allowed language', validateFactInput({ key: 'dsa.default_language', value: 'Java' }).ok === true);
  ok('validateProjectInput requires a name', validateProjectInput({}).ok === false);
  ok('validateProjectInput slugifies a name to an id', validateProjectInput({ name: 'My Cool Project!' }).value?.id === 'my-cool-project');
  ok('validateProjectInput rejects bad status', validateProjectInput({ name: 'x', status: 'wizard' }).ok === false);
  ok('docBytes measures serialized size', docBytes({ a: 1 }) === Buffer.byteLength('{"a":1}'));
  ok('withinDocLimit enforces maxDocBytes', withinDocLimit({ a: 'x'.repeat(LIMITS.maxDocBytes) }) === false);

  // ---- 2. empty store / cache miss -> empty state, no fabrication ----
  const emptyProfile = await store.getProfile(UID);
  ok('cache miss returns empty profile', emptyProfile.ok === true && emptyProfile.facts.length === 0 && emptyProfile.empty === true);
  const emptyProjects = await store.listProjects(UID);
  ok('cache miss returns empty projects', emptyProjects.ok === true && emptyProjects.projects.length === 0 && emptyProjects.empty === true);
  const emptyConvos = await store.listConversations(UID);
  ok('cache miss returns empty conversations', emptyConvos.ok === true && emptyConvos.conversations.length === 0 && emptyConvos.empty === true);
  ok('missing project returns null (not fabricated)', (await store.getProject(UID, 'no-such-project')).project === null);

  // ---- 3. profile fact CRUD round-trips ----
  const add1 = await store.addFact(UID, { key: 'identity.role', value: 'Backend Engineer' });
  ok('addFact returns a stored fact', add1.ok === true && add1.value.key === 'identity.role' && add1.value.value === 'Backend Engineer');
  await store.addFact(UID, { key: 'dsa.default_language', value: 'Java', pinned: true });
  const prof = await store.getProfile(UID);
  ok('profile round-trips two facts', prof.facts.length === 2);
  const lang = prof.facts.find((f) => f.key === 'dsa.default_language');
  ok('pinned flag persisted', lang.pinned === true);
  const dup = await store.addFact(UID, { key: 'identity.role', value: 'Backend Engineer' });
  ok('identical active fact is deduped', dup.ok === true && dup.duplicate === true);
  const upd = await store.updateFact(UID, lang.id, { value: 'Python' });
  ok('updateFact changes value', upd.ok === true && upd.value.value === 'Python');
  const badUpd = await store.updateFact(UID, lang.id, { value: 'COBOL' });
  ok('updateFact rejects invalid value', badUpd.ok === false && badUpd.error === 'invalid_record');
  const del = await store.deleteFact(UID, lang.id);
  ok('deleteFact removes a fact', del.ok === true && del.removed === 1);
  const delAgain = await store.deleteFact(UID, lang.id);
  ok('deleteFact on missing fact is not_found', delAgain.ok === false && delAgain.error === 'not_found');

  // ---- 4. supersession on conflicting key ----
  const a = await store.addFact(UID, { key: 'preference.response_style', value: 'concise' });
  const b = await store.addFact(UID, { key: 'preference.response_style', value: 'detailed' });
  ok('conflicting value supersedes prior fact', b.ok === true && b.superseded === a.value.id);
  const prof2 = await store.getProfile(UID);
  const active = prof2.facts.filter((f) => f.key === 'preference.response_style' && !f.supersededBy);
  ok('only one active fact per key', active.length === 1 && active[0].value === 'detailed');

  // ---- 5. project CRUD round-trips + limits ----
  const proj = await store.upsertProject(UID, { name: 'Atlas API', status: 'active', stack: ['Node', 'Redis'] });
  ok('upsertProject creates a record', proj.ok === true && proj.created === true && proj.value.id === 'atlas-api');
  const fetched = await store.getProject(UID, 'atlas-api');
  ok('getProject round-trips fields', fetched.project.name === 'Atlas API' && fetched.project.stack.includes('Redis'));
  const proj2 = await store.upsertProject(UID, { id: 'atlas-api', name: 'Atlas API', status: 'completed' });
  ok('upsertProject updates in place', proj2.ok === true && proj2.created === false && proj2.value.status === 'completed');
  ok('listProjects returns summaries', (await store.listProjects(UID)).projects.some((p) => p.id === 'atlas-api'));
  ok('deleteProject removes it', (await store.deleteProject(UID, 'atlas-api')).ok === true);
  ok('deleteProject missing is not_found', (await store.deleteProject(UID, 'atlas-api')).error === 'not_found');

  let limitHit = false;
  for (let i = 0; i < LIMITS.maxProjects + 2; i++) {
    const r = await store.upsertProject(UID, { id: `proj-${i}`, name: `Project ${i}` });
    if (!r.ok && r.error === 'limit_exceeded') { limitHit = true; break; }
  }
  ok('project count limit is enforced', limitHit === true);

  // ---- 6. conversation records (schema ready, not wired to chat) ----
  const conv = await store.upsertConversation(UID, {
    projectId: null,
    turns: [{ role: 'user', text: 'hello' }, { role: 'assistant', text: 'hi' }],
    summary: 'intro',
  });
  ok('upsertConversation stores turns', conv.ok === true && conv.value.turns.length === 2);
  ok('getConversation round-trips', (await store.getConversation(UID, conv.value.id)).conversation.summary === 'intro');
  ok('bad conversation turn role is rejected', (await store.upsertConversation(UID, { turns: [{ role: 'system', text: 'x' }] })).error === 'invalid_record');

  // ---- 7. invalid identifiers ----
  ok('invalid user id rejected on write', (await store.addFact('bad', { key: 'identity.role', value: 'x' })).error === 'invalid_user');
  ok('invalid user id rejected on read', (await store.getProfile('bad')).error === 'invalid_user');
  ok('invalid fact id rejected', (await store.deleteFact(UID, 'no!')).error === 'invalid_record');

  // ---- 8. malformed documents -> treated as empty on read, refuse on write ----
  await cache.set(pkey(UID2, 'profile'), { schemaVersion: SCHEMA_VERSION, facts: 'not-an-array' });
  const malRead = await store.getProfile(UID2);
  ok('malformed profile reads as empty', malRead.ok === true && malRead.facts.length === 0 && malRead.empty === true);
  const malWrite = await store.addFact(UID2, { key: 'identity.role', value: 'x' });
  ok('malformed profile refuses mutation', malWrite.ok === false && malWrite.error === 'corrupt_record');

  await cache.set(pkey(UID2, 'projects'), { schemaVersion: SCHEMA_VERSION, records: { 'bad key!!': { id: 'bad key!!', name: 'x' } } });
  ok('malformed project map reads as empty', (await store.listProjects(UID2)).empty === true);
  ok('malformed project map refuses mutation', (await store.upsertProject(UID2, { name: 'ok' })).error === 'corrupt_record');

  // ---- 9. unsupported schema versions ----
  await cache.set(pkey(UID, 'profile'), { schemaVersion: 999, facts: [] });
  const unsupRead = await store.getProfile(UID);
  ok('unsupported version reads as empty', unsupRead.ok === true && unsupRead.empty === true);
  const unsupWrite = await store.addFact(UID, { key: 'identity.role', value: 'x' });
  ok('unsupported version refuses mutation', unsupWrite.ok === false && unsupWrite.error === 'unsupported_schema');
  await store.wipeUser(UID);

  // ---- 10. wipe / lifecycle ----
  await store.addFact(UID2, { key: 'identity.role', value: 'x' });
  await cache.set(pkey(UID2, 'projects'), { schemaVersion: SCHEMA_VERSION, records: {} });
  const wiped = await store.wipeUser(UID2);
  ok('wipeUser removes all three documents', wiped.ok === true && wiped.removed.length === 3);
  ok('post-wipe profile is empty', (await store.getProfile(UID2)).empty === true);
  ok('wipeUser rejects invalid id', (await store.wipeUser('bad')).error === 'invalid_user');

  // ---- 11. concurrency: serialized read-modify-write loses no updates ----
  await store.wipeUser(UID);
  await Promise.all(
    Array.from({ length: 15 }, (_, i) => store.addFact(UID, { key: 'learning.explanation_style', value: `style-${i}` })),
  );
  const conc = await store.getProfile(UID);
  ok('concurrent adds keep all records', conc.facts.length === 15, `got ${conc.facts.length}`);
  ok('concurrent adds leave one active fact', conc.facts.filter((f) => !f.supersededBy).length === 1);

  // ---- 12. status aggregation ----
  const status = await store.getStatus(UID);
  ok('getStatus returns counts', status.ok === true && status.counts.facts === 15 && status.counts.activeFacts === 1);
  ok('getStatus reports doc states', status.state.profile === 'present' && status.state.projects === 'empty');
  ok('getStatus rejects invalid user', (await store.getStatus('bad')).error === 'invalid_user');

  // ---- 13. storage unavailable / cache errors ----
  const origGet = cache.get;
  const origSet = cache.set;
  const origProbe = cache.probe;
  cache.get = async () => { throw new Error('backend down'); };
  cache.probe = async () => { throw new Error('backend down'); };
  const downRead = await store.getProfile(UID);
  ok('degraded read returns empty + degraded flag', downRead.ok === true && downRead.facts.length === 0 && downRead.degraded === true);
  ok('degraded read surfaces storage error', downRead.storageError === 'storage_unavailable');
  ok('ping reports false when the backend probe fails', (await store.ping()) === false);
  ok('status reports storage unavailable', (await store.getStatus(UID)).error === 'storage_unavailable');
  cache.get = origGet;
  cache.probe = origProbe;
  ok('ping recovers after backend restored', (await store.ping()) === true);

  cache.set = async () => { throw new Error('backend down'); };
  ok('write surfaces storage unavailable', (await store.addFact(UID, { key: 'identity.role', value: 'x' })).error === 'storage_unavailable');
  cache.set = origSet;

  // ---- 13b. durability + retention policy (no false durable success) ----
  await store.wipeUser(UID);
  // memory backend: writes succeed but are honestly NON-durable.
  const memWrite = await store.addFact(UID, { key: 'identity.role', value: 'engineer' });
  ok('memory-backend write reports durable:false', memWrite.ok === true && memWrite.durable === false);

  // default retention must be explicit "no expiry" (0), never the cache default.
  delete process.env.MEMORY_RETENTION_SECONDS;
  let lastTtl = 'unset';
  cache.set = async (k, v, ttl) => { lastTtl = ttl; return origSet(k, v, ttl); };
  await store.addFact(UID, { key: 'identity.role', value: 'retention-default' });
  ok('default memory retention is no-expiry (0)', lastTtl === 0, String(lastTtl));
  process.env.MEMORY_RETENTION_SECONDS = '900';
  await store.addFact(UID, { key: 'identity.role', value: 'retention-bounded' });
  ok('MEMORY_RETENTION_SECONDS is applied to writes', lastTtl === 900, String(lastTtl));
  delete process.env.MEMORY_RETENTION_SECONDS;
  cache.set = origSet;

  // durable backend: a successful Upstash write is reported durable:true.
  const origFetch = globalThis.fetch;
  process.env.UPSTASH_REDIS_REST_URL = 'https://example-upstash.invalid';
  process.env.UPSTASH_REDIS_REST_TOKEN = 'test-token';
  globalThis.fetch = async (_url, opts = {}) => ({ ok: true, json: async () => ({ result: opts.method === 'POST' ? 'OK' : null }) });
  const upInfo = store.getBackend();
  ok('backend switches to upstash when configured', upInfo.mode === 'upstash' && upInfo.durable === true);
  const upWrite = await store.upsertProject(UID, { name: 'Durable Project' });
  ok('durable-backend write reports durable:true, no degraded flag', upWrite.ok === true && upWrite.durable === true && upWrite.degraded === undefined, JSON.stringify(upWrite));

  // Upstash reachable probe is honest when the backend answers.
  const probeUp = await cache.probe();
  ok('probe reports reachable when the durable backend answers', probeUp.reachable === true && probeUp.durable === true && probeUp.mode === 'upstash');

  // durable backend FAILURE: write falls back to ephemeral and must NOT claim durability.
  globalThis.fetch = async () => { throw new Error('network down'); };
  const fallbackWrite = await store.addFact(UID, { key: 'identity.role', value: 'fallback' });
  ok('upstash failure yields an ephemeral, non-durable write', fallbackWrite.ok === true && fallbackWrite.durable === false && fallbackWrite.degraded === true);
  const probeDown = await cache.probe();
  ok('probe reports unreachable when the durable backend fails', probeDown.reachable === false && probeDown.durable === false && probeDown.mode === 'upstash');
  globalThis.fetch = origFetch;
  delete process.env.UPSTASH_REDIS_REST_URL;
  delete process.env.UPSTASH_REDIS_REST_TOKEN;
  await store.wipeUser(UID);

  // ---- 14. status endpoint behavior + info-leakage ----
  const NS = 'statusns_12345678';
  process.env.MEMORY_STATUS_NAMESPACE = NS;
  await store.wipeUser(NS);
  await store.addFact(NS, { key: 'identity.career_goal', value: 'top-secret-value-xyz' });
  await store.upsertProject(NS, { name: 'Secret Project' });

  const app = express();
  app.use('/api/memory', memoryRouter);
  const server = app.listen(0);
  await new Promise((r) => server.once('listening', r));
  const port = server.address().port;

  const res = await fetch(`http://127.0.0.1:${port}/api/memory/status`);
  const body = await res.json();
  const raw = JSON.stringify(body);
  ok('status returns 200', res.status === 200);
  ok('status reports schema version', body.schemaVersion === SCHEMA_VERSION);
  ok('status reports storage mode', body.storage.mode === info.mode);
  ok('status reports reachable + durable', typeof body.storage.reachable === 'boolean' && typeof body.storage.durable === 'boolean');
  ok('status reports namespace configured', body.statusNamespaceConfigured === true);
  ok('status includes counts for configured namespace', body.counts && body.counts.activeFacts === 1 && body.counts.projects === 1);
  ok('status does NOT leak the namespace id', raw.includes(NS) === false);
  ok('status does NOT leak fact values', raw.includes('top-secret-value-xyz') === false);
  ok('status does NOT leak project contents', raw.includes('Secret Project') === false);

  // no client-supplied namespace is honored
  const res2 = await fetch(`http://127.0.0.1:${port}/api/memory/status?userId=${NS}`);
  const body2 = await res2.json();
  ok('status ignores client-supplied userId query', JSON.stringify(body2).includes(NS) === false);

  delete process.env.MEMORY_STATUS_NAMESPACE;
  const res3 = await fetch(`http://127.0.0.1:${port}/api/memory/status`);
  const body3 = await res3.json();
  ok('status with no configured namespace omits counts', body3.counts === null && body3.statusNamespaceConfigured === false);

  server.close();

  // ---- report ----
  for (const line of results) console.log(line);
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error('test harness crashed:', err);
  process.exit(1);
});
