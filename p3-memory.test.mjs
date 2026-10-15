// P3 tests: explicit memory commands - deterministic parsing, internal service
// semantics (remember/update/forget/inspect/wipe, idempotency, supersession,
// ambiguity, no-false-success), the owner-gated HTTP surface, and chat wiring
// that refuses owner memory for public traffic without calling the model.
// Plain Node ESM; no network, paid calls, or credentials required.
import express from 'express';
import cache from './server/cache.js';
import store from './server/memory/store.js';
import { parseMemoryCommand } from './server/memory/commands.js';
import { executeMemoryCommand } from './server/memory/service.js';
import {
  ownerMemoryEnabled,
  requestOwner,
  memoryNamespace,
  OWNER_MUTATION_DISABLED_MESSAGE,
  OWNER_INSPECT_DISABLED_MESSAGE,
} from './server/memory/access.js';
import memoryRouter from './server/routes/memory.js';
import aiRouter from './server/routes/ai.js';

let pass = 0, fail = 0;
const results = [];
const ok = (name, cond, detail = '') => {
  if (cond) pass++; else fail++;
  results.push(`${cond ? 'PASS' : 'FAIL'} ${name}${detail ? ' :: ' + detail : ''}`);
};

const NS = 'memns_p3test_0001';
const NS_EMPTY = 'memns_p3empty_0002';

function listen(app) {
  return new Promise((resolve) => { const s = app.listen(0, () => resolve(s)); });
}

function makeApp(injectIdentity) {
  const app = express();
  app.use(express.json());
  if (injectIdentity) app.use((req, _res, next) => { req.memoryOwner = { namespace: NS }; next(); });
  app.use('/api/memory', memoryRouter);
  app.use('/api/ai', aiRouter);
  return app;
}

async function wipe(ns) { await store.wipeUser(ns); }

async function main() {
  // =====================================================================
  // A. parser (pure) - deterministic intent extraction, no false positives
  // =====================================================================
  const c1 = parseMemoryCommand('Remember that I prefer Java for DSA.');
  ok('parse: remember fact', c1 && c1.type === 'remember' && c1.target === 'fact' && c1.key === 'dsa.default_language' && c1.value === 'Java');

  const c2 = parseMemoryCommand('Remember that Resyntha uses FAISS for vector search.');
  ok('parse: remember project decision', c2 && c2.type === 'remember' && c2.target === 'project' && c2.ref === 'Resyntha' && c2.decision.includes('FAISS'));

  const c3 = parseMemoryCommand('Update my Resyntha architecture decision to Event-driven with Kafka.');
  ok('parse: update project decision', c3 && c3.type === 'update' && c3.target === 'project' && c3.ref === 'Resyntha' && c3.decision.includes('Kafka'));

  const c4 = parseMemoryCommand('Update my response style to concise.');
  ok('parse: update fact', c4 && c4.type === 'update' && c4.target === 'fact' && c4.key === 'preference.response_style' && c4.value === 'concise');

  const c5 = parseMemoryCommand('Forget my preference for Java.');
  ok('parse: forget fact', c5 && c5.type === 'forget' && c5.target === 'fact' && c5.key === 'dsa.default_language' && c5.value === 'Java');

  const c6 = parseMemoryCommand("Forget Resyntha's architecture decision.");
  ok('parse: forget project decision', c6 && c6.type === 'forget' && c6.target === 'project' && c6.ref === 'Resyntha');

  const c7 = parseMemoryCommand('Forget everything about me.');
  ok('parse: wipe', c7 && c7.type === 'wipe');

  const c8 = parseMemoryCommand('What do you remember about my projects?');
  ok('parse: inspect projects', c8 && c8.type === 'inspect' && c8.scope === 'projects');

  const c9 = parseMemoryCommand('What do you remember about me?');
  ok('parse: inspect profile', c9 && c9.type === 'inspect' && c9.scope === 'profile');

  // non-commands / speculation must NOT be treated as memory writes
  ok('parse: ordinary question is not a command', parseMemoryCommand('What is your favorite color?') === null);
  ok('parse: greeting is not a command', parseMemoryCommand('Hello, how are you?') === null);
  ok('parse: speculative sentence is not a command', parseMemoryCommand('Resyntha might use FAISS for search.') === null);
  ok('parse: proposal is not a command', parseMemoryCommand('I think we should switch to Redis.') === null);
  ok('parse: "remove the last line" is not a memory command', parseMemoryCommand('Remove the last line of code.') === null);
  ok('parse: "forget it" is not hijacked', parseMemoryCommand('Forget it, never mind.') === null);
  ok('parse: empty input is not a command', parseMemoryCommand('') === null);
  ok('parse: non-string input is not a command', parseMemoryCommand(42) === null);

  // =====================================================================
  // B. service semantics (direct, no HTTP)
  // =====================================================================
  await wipe(NS);

  // remember fact -> stores once
  const r1 = await executeMemoryCommand(NS, parseMemoryCommand('Remember that I prefer Java for DSA.'));
  ok('service: remember fact succeeds', r1.ok === true && r1.action === 'remember');
  const prof1 = await store.getProfile(NS);
  ok('service: fact is actually stored', prof1.facts.filter(f => f.key === 'dsa.default_language' && !f.supersededBy).length === 1);

  // idempotent re-remember -> duplicate, still one active
  const r1b = await executeMemoryCommand(NS, parseMemoryCommand('Remember that I prefer Java for DSA.'));
  const prof1b = await store.getProfile(NS);
  ok('service: duplicate remember is flagged, not duplicated', r1b.ok === true && r1b.data && r1b.data.duplicate === true);
  ok('service: still exactly one active fact', prof1b.facts.filter(f => f.key === 'dsa.default_language' && !f.supersededBy).length === 1);

  // remember same key new value -> supersedes (schema-supported)
  const r1c = await executeMemoryCommand(NS, parseMemoryCommand('Remember that I prefer Python for DSA.'));
  const prof1c = await store.getProfile(NS);
  const active = prof1c.facts.filter(f => f.key === 'dsa.default_language' && !f.supersededBy);
  ok('service: new value supersedes the old', r1c.ok === true && active.length === 1 && active[0].value === 'Python');
  ok('service: superseded fact is retained', prof1c.facts.some(f => f.key === 'dsa.default_language' && f.supersededBy));

  // remember project decision on an existing project (preserve other fields)
  await store.upsertProject(NS, { name: 'Atlas', status: 'active', purpose: 'doc QA', stack: ['Python'], decisions: [{ text: 'Chose Postgres', confirmed: true }] });
  const r2 = await executeMemoryCommand(NS, parseMemoryCommand('Remember that Atlas uses FAISS for vector search.'));
  const atlas = await store.getProject(NS, 'atlas');
  ok('service: remember project decision succeeds', r2.ok === true);
  ok('service: decision appended', atlas.project.decisions.some(d => d.text.includes('FAISS')));
  ok('service: existing decision preserved', atlas.project.decisions.some(d => d.text.includes('Postgres')));
  ok('service: unrelated project fields preserved', atlas.project.purpose === 'doc QA' && atlas.project.stack.includes('Python'));

  const r2b = await executeMemoryCommand(NS, parseMemoryCommand('Remember that Atlas uses FAISS for vector search.'));
  ok('service: duplicate project decision flagged', r2b.ok === true && r2b.data && r2b.data.duplicate === true);

  // remember a decision for an unknown project -> creates it
  const r3 = await executeMemoryCommand(NS, parseMemoryCommand('Remember that Nebula uses Rust for parsing.'));
  const nebula = await store.getProject(NS, 'nebula');
  ok('service: unknown project created from explicit command', r3.ok === true && nebula.project && nebula.project.decisions.some(d => d.text.includes('Rust')));

  // update project decision (existing)
  const r4 = await executeMemoryCommand(NS, parseMemoryCommand('Update my Atlas architecture decision to Event-driven with Kafka.'));
  const atlas2 = await store.getProject(NS, 'atlas');
  ok('service: update project decision succeeds', r4.ok === true && atlas2.project.decisions.some(d => d.text.includes('Kafka')));
  const r4b = await executeMemoryCommand(NS, parseMemoryCommand('Update my Ghost architecture decision to something.'));
  ok('service: update unknown project is not a false success', r4b.ok === false && r4b.code === 'not_found');

  // update fact
  const r5 = await executeMemoryCommand(NS, parseMemoryCommand('Update my response style to concise.'));
  ok('service: update missing fact is not a false success', r5.ok === false && r5.code === 'not_found');
  await executeMemoryCommand(NS, parseMemoryCommand('Remember that my response style is detailed.'));
  const r5b = await executeMemoryCommand(NS, parseMemoryCommand('Update my response style to concise.'));
  const prof2 = await store.getProfile(NS);
  const style = prof2.facts.find(f => f.key === 'preference.response_style' && !f.supersededBy);
  ok('service: update fact succeeds', r5b.ok === true && style && style.value === 'concise');

  // forget fact (active value is Python after the earlier supersession)
  const f1 = await executeMemoryCommand(NS, parseMemoryCommand('Forget my preference for Python.'));
  ok('service: forget fact succeeds', f1.ok === true && f1.action === 'forget');
  const f2 = await executeMemoryCommand(NS, parseMemoryCommand('Forget my preference for Python.'));
  ok('service: forgetting a missing fact is not a false success', f2.ok === false && f2.code === 'not_found');
  ok('service: no-false-success message never claims a write', !/forgotten/i.test(f2.message));

  // forget with mismatched value does not delete the active fact
  await executeMemoryCommand(NS, parseMemoryCommand('Remember that I prefer Java for DSA.'));
  const f3 = await executeMemoryCommand(NS, parseMemoryCommand('Forget my preference for Rust.'));
  const prof3 = await store.getProfile(NS);
  ok('service: mismatched forget does not delete unrelated fact', f3.ok === false && prof3.facts.some(f => f.key === 'dsa.default_language' && !f.supersededBy));

  // forget project decision
  const fp1 = await executeMemoryCommand(NS, parseMemoryCommand('Forget Nebula\'s architecture decision.'));
  const nebula2 = await store.getProject(NS, 'nebula');
  ok('service: forget single project decision succeeds', fp1.ok === true && nebula2.project.decisions.length === 0);

  // ambiguity: two projects share the label "nova"
  await wipe(NS_EMPTY);
  await store.upsertProject(NS_EMPTY, { name: 'Nova', status: 'active' });
  await store.upsertProject(NS_EMPTY, { name: 'Nova Project', aliases: ['nova'], status: 'active' });
  const amb = await executeMemoryCommand(NS_EMPTY, parseMemoryCommand('Remember that Nova uses Kubernetes.'));
  ok('service: ambiguous project is refused', amb.ok === false && amb.code === 'ambiguous');
  ok('service: ambiguous refusal offers candidates', Array.isArray(amb.data && amb.data.candidates) && amb.data.candidates.length === 2);

  // unknown target -> clarify, never stored
  const cl = await executeMemoryCommand(NS_EMPTY, { type: 'remember', target: 'unknown', raw: 'something vague' });
  ok('service: unknown target clarifies (no store)', cl.ok === false && cl.code === 'clarify');

  // inspect
  const insP = await executeMemoryCommand(NS, { type: 'inspect', scope: 'profile' });
  ok('service: inspect profile returns facts', insP.ok === true && Array.isArray(insP.data.facts));
  const insPr = await executeMemoryCommand(NS, { type: 'inspect', scope: 'projects' });
  ok('service: inspect projects returns projects', insPr.ok === true && Array.isArray(insPr.data.projects));

  // wipe
  const w = await executeMemoryCommand(NS, { type: 'wipe' });
  const afterWipe = await store.getProfile(NS);
  ok('service: wipe succeeds', w.ok === true && w.action === 'wipe');
  ok('service: wipe removes facts', afterWipe.facts.length === 0);

  // empty inspect after wipe
  const insEmpty = await executeMemoryCommand(NS, { type: 'inspect', scope: 'profile' });
  ok('service: empty inspect reports nothing stored', insEmpty.ok === true && /no preferences stored/i.test(insEmpty.message));

  // invalid namespace
  const badNs = await executeMemoryCommand('bad', { type: 'wipe' });
  ok('service: invalid namespace refused', badNs.ok === false && badNs.code === 'invalid_namespace');

  // storage unavailable -> no false success
  const origGet = cache.get;
  cache.get = async () => { throw new Error('down'); };
  const down = await executeMemoryCommand(NS, parseMemoryCommand('Remember that I prefer Java for DSA.'));
  cache.get = origGet;
  ok('service: storage outage yields failure', down.ok === false && down.code === 'storage_unavailable');
  ok('service: storage outage never claims success', !/Got it|remembered|updated/i.test(down.message));

  // =====================================================================
  // C. owner-gated HTTP surface
  // =====================================================================
  await wipe(NS);
  process.env.MEMORY_NAMESPACE = NS;
  process.env.MEMORY_OWNER_ENABLED = 'true';

  const noId = await listen(makeApp(false));
  const noIdBase = `http://127.0.0.1:${noId.address().port}`;

  const g1 = await fetch(`${noIdBase}/api/memory/profile`);
  const g1b = await g1.json();
  ok('http: owner read without verified identity is 403', g1.status === 403 && g1b.code === 'owner_memory_disabled');
  const g2 = await fetch(`${noIdBase}/api/memory/facts`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ key: 'dsa.default_language', value: 'Java' }),
  });
  ok('http: owner write without verified identity is 403', g2.status === 403);
  const statusRes = await fetch(`${noIdBase}/api/memory/status`);
  ok('http: public status endpoint remains open', statusRes.status === 200);
  noId.close();

  const withId = await listen(makeApp(true));
  const idBase = `http://127.0.0.1:${withId.address().port}`;

  const p0 = await fetch(`${idBase}/api/memory/profile`);
  const p0b = await p0.json();
  ok('http: owner read with identity succeeds', p0.status === 200 && p0b.ok === true && Array.isArray(p0b.facts));

  const add = await fetch(`${idBase}/api/memory/facts`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ key: 'dsa.default_language', value: 'Java' }),
  });
  const addB = await add.json();
  ok('http: owner add fact returns 201', add.status === 201 && addB.ok === true && addB.value.value === 'Java');

  const badAdd = await fetch(`${idBase}/api/memory/facts`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ key: 'not.allowed', value: 'x' }),
  });
  ok('http: malformed fact is 400', badAdd.status === 400);

  const patched = await fetch(`${idBase}/api/memory/facts/${addB.value.id}`, {
    method: 'PATCH', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ value: 'Python' }),
  });
  ok('http: owner patch fact succeeds', patched.status === 200);

  const del = await fetch(`${idBase}/api/memory/facts/${addB.value.id}`, { method: 'DELETE' });
  ok('http: owner delete fact succeeds', del.status === 200);

  const delInvalid = await fetch(`${idBase}/api/memory/facts/bad!id`, { method: 'DELETE' });
  ok('http: invalid fact id is 400', delInvalid.status === 400);

  const delMissing = await fetch(`${idBase}/api/memory/facts/abcdef123456`, { method: 'DELETE' });
  ok('http: missing fact id is 404', delMissing.status === 404);

  const cmd = await fetch(`${idBase}/api/memory/command`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: 'Remember that I prefer Java for DSA.' }),
  });
  const cmdB = await cmd.json();
  ok('http: owner command endpoint executes', cmd.status === 200 && cmdB.ok === true && cmdB.action === 'remember');

  const cmdBad = await fetch(`${idBase}/api/memory/command`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}),
  });
  ok('http: command endpoint rejects empty text', cmdBad.status === 400);

  const wipeRes = await fetch(`${idBase}/api/memory/`, { method: 'DELETE' });
  ok('http: owner wipe succeeds', wipeRes.status === 200);

  // env gate: even with an identity, owner ops are refused when not opted in
  process.env.MEMORY_OWNER_ENABLED = 'false';
  const gated = await fetch(`${idBase}/api/memory/profile`);
  ok('http: owner ops refused when MEMORY_OWNER_ENABLED is not true', gated.status === 403);
  process.env.MEMORY_OWNER_ENABLED = 'true';
  withId.close();

  ok('access: ownerMemoryEnabled reflects the operator switch', ownerMemoryEnabled() === true);
  process.env.MEMORY_OWNER_ENABLED = 'false';
  ok('access: ownerMemoryEnabled is off by default', ownerMemoryEnabled() === false);
  ok('access: requestOwner ignores client-supplied identity', requestOwner({ body: { userId: NS }, query: { userId: NS } }) === null);
  ok('access: namespace is server-configured only', memoryNamespace() === NS);
  process.env.MEMORY_OWNER_ENABLED = 'true';

  // =====================================================================
  // D. chat wiring - deterministic, refuses public owner memory, no model call
  // =====================================================================
  await wipe(NS);
  await store.addFact(NS, { key: 'dsa.default_language', value: 'Java', pinned: true });

  // Public chat (no verified owner identity): mutation command is refused and
  // handled WITHOUT a provider (no GROQ_API_KEY set -> would be 502 if it
  // reached the model).
  delete process.env.GROQ_API_KEY;
  const publicApp = await listen(makeApp(false));
  const pubBase = `http://127.0.0.1:${publicApp.address().port}`;

  const pubRemember = await fetch(`${pubBase}/api/ai/chat`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question: 'Remember that I prefer Python for DSA.' }),
  });
  const pubRememberB = await pubRemember.json();
  ok('chat: public mutation command returns 200 (no provider)', pubRemember.status === 200);
  ok('chat: public mutation command is refused', pubRememberB.success === true && pubRememberB.command === true && pubRememberB.answer === OWNER_MUTATION_DISABLED_MESSAGE);

  const afterPub = await store.getProfile(NS);
  const afterPubActive = afterPub.facts.filter(f => f.key === 'dsa.default_language' && !f.supersededBy);
  ok('chat: public command did not mutate memory', afterPubActive.length === 1 && afterPubActive[0].value === 'Java');

  const pubInspect = await fetch(`${pubBase}/api/ai/chat`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question: 'What do you remember about me?' }),
  });
  const pubInspectB = await pubInspect.json();
  ok('chat: public inspect is refused with the inspect wording', pubInspectB.command === true && pubInspectB.answer === OWNER_INSPECT_DISABLED_MESSAGE);
  ok('chat: public inspect does not leak stored memory', !pubInspectB.answer.includes('Java') && !pubInspectB.answer.includes('dsa.default_language'));

  // Ordinary (non-command) question still goes to the provider -> 502 without a key
  const normalRes = await fetch(`${pubBase}/api/ai/chat`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question: 'What stack does Atlas use?' }),
  });
  ok('chat: ordinary question still uses the provider path', normalRes.status === 502);
  publicApp.close();

  // Verified owner chat: the same command executes deterministically.
  const ownerApp = await listen(makeApp(true));
  const ownerBase = `http://127.0.0.1:${ownerApp.address().port}`;
  const ownerRemember = await fetch(`${ownerBase}/api/ai/chat`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question: 'Remember that I prefer Python for DSA.' }),
  });
  const ownerRememberB = await ownerRemember.json();
  ok('chat: owner command executes', ownerRemember.status === 200 && ownerRememberB.command === true);
  ok('chat: owner command reports success only after a write', /remember|updated/i.test(ownerRememberB.answer));
  const ownerAfter = await store.getProfile(NS);
  const ownerActive = ownerAfter.facts.filter(f => f.key === 'dsa.default_language' && !f.supersededBy);
  ok('chat: owner command persisted the change', ownerActive.length === 1 && ownerActive[0].value === 'Python');

  const ownerInspect = await fetch(`${ownerBase}/api/ai/chat`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question: 'What do you remember about me?' }),
  });
  const ownerInspectB = await ownerInspect.json();
  ok('chat: owner inspect returns the stored preference', ownerInspectB.command === true && /Python/.test(ownerInspectB.answer));
  ownerApp.close();

  // response contract preserved on the command path
  ok('chat: command responses keep the {success, answer, requestId} contract',
    pubRememberB.success === true && typeof pubRememberB.answer === 'string' && typeof pubRememberB.requestId === 'string');

  delete process.env.MEMORY_OWNER_ENABLED;
  delete process.env.MEMORY_NAMESPACE;

  for (const line of results) console.log(line);
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error('test harness crashed:', err);
  process.exit(1);
});
