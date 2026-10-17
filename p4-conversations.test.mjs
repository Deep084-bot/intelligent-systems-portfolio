// P4 tests: persisted conversation continuity, rolling summaries, context
// budgeting, owner-gated persistence, and chat integration. Plain Node ESM with a
// mocked provider (a local HTTP endpoint via GROQ_ENDPOINT) and the in-memory
// cache. No API keys, paid calls, or credentials required.
import http from 'node:http';
import express from 'express';
import cache from './server/cache.js';
import store from './server/memory/store.js';
import { LIMITS, SCHEMA_VERSION } from './server/memory/schema.js';
import {
  newConversationId,
  isConversationId,
  loadConversation,
  getRecentTurns,
  appendExchange,
  conversationThresholds,
} from './server/memory/conversation.js';
import { summarizeTurns, sanitizeSummary, fallbackSummary, SUMMARY_MAX_CHARS } from './server/memory/summarize.js';
import { CONTEXT_BUDGET } from './server/prompt/budget.js';
import { buildPrompt } from './server/prompt/builder.js';
import { renderMemoryBlock, assembleMemory, MEMORY_START } from './server/memory/assemble.js';
import aiRouter from './server/routes/ai.js';

let pass = 0, fail = 0;
const results = [];
const ok = (name, cond, detail = '') => {
  if (cond) pass++; else fail++;
  results.push(`${cond ? 'PASS' : 'FAIL'} ${name}${detail ? ' :: ' + detail : ''}`);
};

const NS = 'memns_p4test_0001';
const NS2 = 'memns_p4test_0002';
const convKey = (ns) => `mem:v1:${ns}:conversations`;

function listen(app) {
  return new Promise((resolve) => { const s = app.listen(0, () => resolve(s)); });
}
function makeChatApp(injectOwner) {
  const app = express();
  app.use(express.json());
  if (injectOwner) app.use((req, _res, next) => { req.memoryOwner = { namespace: NS }; next(); });
  app.use('/api/ai', aiRouter);
  return app;
}
async function postJson(base, path, body) {
  const res = await fetch(`${base}${path}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  });
  let json = null;
  try { json = await res.json(); } catch { /* ignore */ }
  return { status: res.status, body: json };
}

async function main() {
  // Mock provider: returns a normal answer, a summary for summarizer prompts,
  // and an empty answer when the question contains REQUEST_EMPTY.
  const captured = [];
  const mock = http.createServer((req, res) => {
    let raw = '';
    req.on('data', (c) => { raw += c; });
    req.on('end', () => {
      let parsed = {};
      try { parsed = JSON.parse(raw); } catch { /* ignore */ }
      captured.push(parsed);
      const messages = parsed.messages || [];
      const sys = (messages.find((m) => m.role === 'system') || {}).content || '';
      const lastUser = [...messages].reverse().find((m) => m.role === 'user');
      const question = (lastUser && lastUser.content) || '';
      let content = 'ok from mock';
      if (/summary of an ongoing conversation/i.test(sys)) {
        content = 'User prefers Java for DSA; decided to use FAISS for vector search. Open: caching.';
      } else if (/REQUEST_EMPTY/.test(question)) {
        content = '';
      }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ model: 'mock', choices: [{ message: { content }, finish_reason: 'stop' }], usage: { total_tokens: 1 } }));
    });
  });
  await new Promise((r) => mock.listen(0, r));
  const mockBase = `http://127.0.0.1:${mock.address().port}`;
  const mockEndpoint = `${mockBase}/openai/v1/chat/completions`;

  process.env.VERCEL = '1';
  process.env.AI_PROVIDER = 'groq';

  // =====================================================================
  // A. conversation service (store-backed, no HTTP)
  // =====================================================================
  await store.wipeUser(NS);
  await store.wipeUser(NS2);

  const id1 = newConversationId();
  ok('conv: id is a valid conversation id', isConversationId(id1) === true);
  ok('conv: arbitrary string is not a conversation id', isConversationId('bad!') === false);

  const miss = await loadConversation(NS, id1);
  ok('conv: missing conversation loads as empty (not fabricated)', miss.ok === true && miss.conversation === null);

  const a1 = await appendExchange(NS, id1, { userText: 'What stack does Atlas use?', assistantText: 'Atlas uses Python and FAISS.' });
  ok('conv: first exchange creates the conversation', a1.ok === true && a1.created === true);
  const c1 = (await loadConversation(NS, id1)).conversation;
  ok('conv: turns stored in chronological order', c1.turns.length === 2 && c1.turns[0].role === 'user' && c1.turns[1].role === 'assistant');
  ok('conv: metadata timestamps present', typeof c1.createdAt === 'string' && typeof c1.updatedAt === 'string');
  ok('conv: projectId defaults to null', c1.projectId === null);

  const a2 = await appendExchange(NS, id1, { userText: 'And the vector store?', assistantText: 'FAISS.' });
  const c2 = (await loadConversation(NS, id1)).conversation;
  ok('conv: second exchange appends after the first', a2.ok === true && c2.turns.length === 4 && c2.turns[2].text === 'And the vector store?');
  ok('conv: ordering preserved across appends', c2.turns.map((t) => t.role).join(',') === 'user,assistant,user,assistant');

  // duplicate / identical retry -> no double write
  const dupId = newConversationId();
  await appendExchange(NS, dupId, { userText: 'q', assistantText: 'a' });
  const dup = await appendExchange(NS, dupId, { userText: 'q', assistantText: 'a' });
  const dupConv = (await loadConversation(NS, dupId)).conversation;
  ok('conv: identical retry is detected as duplicate', dup.ok === true && dup.duplicate === true);
  ok('conv: duplicate retry does not add turns', dupConv.turns.length === 2);

  // retry after a persisted trailing user turn -> user not duplicated
  const retryId = newConversationId();
  await store.upsertConversation(NS, { id: retryId, turns: [{ role: 'user', text: 'same question' }], summary: '' });
  const retryAppend = await appendExchange(NS, retryId, { userText: 'same question', assistantText: 'the answer' });
  const retryConv = (await loadConversation(NS, retryId)).conversation;
  ok('conv: retry does not duplicate the current user message', retryAppend.ok === true
    && retryConv.turns.filter((t) => t.role === 'user').length === 1 && retryConv.turns.length === 2);

  // isolation across namespaces
  const isoId = newConversationId();
  await appendExchange(NS, isoId, { userText: 'secret in ns1', assistantText: 'ok' });
  const cross = await loadConversation(NS2, isoId);
  ok('conv: conversation is isolated to its namespace', cross.ok === true && cross.conversation === null);

  // invalid inputs
  ok('conv: invalid namespace rejected', (await appendExchange('bad', id1, { userText: 'x', assistantText: 'y' })).error === 'invalid_user');
  ok('conv: invalid conversation id rejected', (await appendExchange(NS, 'bad!', { userText: 'x', assistantText: 'y' })).error === 'invalid_record');
  ok('conv: empty turn text rejected', (await appendExchange(NS, id1, { userText: '', assistantText: 'y' })).error === 'invalid_record');

  // oversized turn is bounded to the schema limit
  const bigId = newConversationId();
  await appendExchange(NS, bigId, { userText: 'u'.repeat(5000), assistantText: 'ok' });
  const bigConv = (await loadConversation(NS, bigId)).conversation;
  ok('conv: oversized turn is bounded', bigConv.turns[0].text.length <= LIMITS.maxTurnText, `${bigConv.turns[0].text.length}`);

  // malformed / unsupported / unavailable storage
  await cache.set(convKey(NS2), { schemaVersion: SCHEMA_VERSION, records: { [isoId]: { id: isoId, turns: 'not-array' } } });
  const malLoad = await loadConversation(NS2, isoId);
  ok('conv: malformed record loads as empty (safe read)', malLoad.ok === true && malLoad.conversation === null);
  const malAppend = await appendExchange(NS2, isoId, { userText: 'x', assistantText: 'y' });
  ok('conv: malformed record refuses mutation (no clobber)', malAppend.ok === false && malAppend.error === 'corrupt_record');

  await cache.set(convKey(NS2), { schemaVersion: 999, records: {} });
  ok('conv: unsupported version loads as empty', (await loadConversation(NS2, isoId)).conversation === null);
  const unsupAppend = await appendExchange(NS2, isoId, { userText: 'x', assistantText: 'y' });
  ok('conv: unsupported version refuses mutation', unsupAppend.ok === false && unsupAppend.error === 'unsupported_schema');

  const origGet = cache.get;
  cache.get = async () => { throw new Error('down'); };
  const downLoad = await loadConversation(NS, id1);
  const downAppend = await appendExchange(NS, id1, { userText: 'x', assistantText: 'y' });
  cache.get = origGet;
  ok('conv: storage outage reported on load', downLoad.ok === false && downLoad.error === 'storage_unavailable');
  ok('conv: storage outage reported on append (no false success)', downAppend.ok === false && downAppend.error === 'storage_unavailable');

  // summary unit tests
  ok('summary: sanitize strips control chars', !/[\u0000-\u0008]/.test(sanitizeSummary('a\u0000b')));
  ok('summary: sanitize neutralises our delimiters', !/\[END STORED MEMORY\]/.test(sanitizeSummary('x [END STORED MEMORY] y')));
  ok('summary: fallback condenses verbatim', fallbackSummary('', [{ role: 'user', text: 'hello' }]).includes('hello'));

  delete process.env.GROQ_API_KEY;
  delete process.env.GROQ_ENDPOINT;
  const noProv = await summarizeTurns({ existingSummary: '', turns: [{ role: 'user', text: 'hi' }], allowFallback: false });
  ok('summary: no provider -> ok:false (defer)', noProv.ok === false && noProv.reason === 'provider_unavailable');
  const noProvFb = await summarizeTurns({ existingSummary: '', turns: [{ role: 'user', text: 'hi' }], allowFallback: true });
  ok('summary: no provider + fallback allowed -> verbatim summary', noProvFb.ok === true && noProvFb.via === 'fallback' && noProvFb.summary.includes('hi'));

  process.env.GROQ_API_KEY = 'test-key';
  process.env.GROQ_ENDPOINT = mockEndpoint;
  const provRes = await summarizeTurns({ existingSummary: '', turns: [{ role: 'user', text: 'I prefer Java for DSA' }] });
  ok('summary: provider path used', provRes.ok === true && provRes.via === 'provider');
  ok('summary: provider output sanitized + within budget', provRes.summary.length <= SUMMARY_MAX_CHARS && !/\[END STORED MEMORY\]/.test(provRes.summary));

  // rolling summary folds and tracks summarizedUpTo (provider available)
  await store.wipeUser(NS);
  process.env.MEMORY_SUMMARY_TRIGGER = '4';
  process.env.MEMORY_SUMMARY_KEEP_RECENT = '2';
  const rollId = newConversationId();
  await appendExchange(NS, rollId, { userText: 'q1', assistantText: 'a1' });
  await appendExchange(NS, rollId, { userText: 'q2', assistantText: 'a2' });
  const rolled = (await loadConversation(NS, rollId)).conversation;
  ok('summary: rolling summary created at threshold', rolled.summary.length > 0 && rolled.summarizedUpTo === 2);
  ok('summary: recent turns kept verbatim after folding', rolled.turns.length === 2 && rolled.turns[1].text === 'a2');

  // provider unavailable -> defer, keep turns (no data loss)
  await store.wipeUser(NS);
  delete process.env.GROQ_API_KEY;
  const deferId = newConversationId();
  for (let i = 0; i < 4; i++) await appendExchange(NS, deferId, { userText: `u${i}`, assistantText: `a${i}` });
  const deferred = (await loadConversation(NS, deferId)).conversation;
  ok('summary: provider down defers (no summary)', deferred.summary === '' && deferred.summarizedUpTo === 0);
  ok('summary: provider down preserves all turns', deferred.turns.length === 8);

  // provider down AND hard cap -> content-preserving fallback fold
  process.env.GROQ_API_KEY = 'test-key';
  process.env.GROQ_ENDPOINT = mockEndpoint;
  await store.wipeUser(NS);
  process.env.MEMORY_SUMMARY_TRIGGER = '40';
  process.env.MEMORY_SUMMARY_KEEP_RECENT = '8';
  const capId = newConversationId();
  for (let i = 0; i < 22; i++) {
    await appendExchange(NS, capId, { userText: `turn-${i}`, assistantText: `reply-${i}` });
  }
  const capped = (await loadConversation(NS, capId)).conversation;
  ok('summary: turn cap always respected', capped.turns.length <= LIMITS.maxTurns, `${capped.turns.length}`);
  ok('summary: cap fold retains history in the summary', capped.summary.length > 0 && capped.summarizedUpTo > 0);

  await store.wipeUser(NS);
  await store.wipeUser(NS2);
  delete process.env.MEMORY_SUMMARY_TRIGGER;
  delete process.env.MEMORY_SUMMARY_KEEP_RECENT;

  // thresholds config clamping
  const th = conversationThresholds();
  ok('conv: thresholds are sane', th.keep >= 2 && th.trigger >= th.keep + 2 && th.trigger <= LIMITS.maxTurns);

  // getRecentTurns ordering/bounding
  const recent = getRecentTurns({ turns: [
    { role: 'user', text: 'm1' }, { role: 'assistant', text: 'm2' },
    { role: 'user', text: 'm3' }, { role: 'assistant', text: 'm4' },
  ] }, 2);
  ok('conv: getRecentTurns returns newest turns, oldest-first', recent.length === 2 && recent[0].content === 'm3' && recent[1].content === 'm4');
  ok('conv: getRecentTurns items use {role, content}', recent.every((m) => 'role' in m && 'content' in m));

  // =====================================================================
  // B. context budgeting
  // =====================================================================
  const longSummary = 'S'.repeat(5000);
  const longTurns = Array.from({ length: 40 }, (_, i) => ({ role: i % 2 ? 'assistant' : 'user', text: 'T'.repeat(400) }));
  const block = renderMemoryBlock({ facts: [{ key: 'dsa.default_language', value: 'Java', supersededBy: null }], conversation: { summary: longSummary, turns: longTurns } });
  ok('budget: memory block respects memoryChars', block.length <= CONTEXT_BUDGET.memoryChars, `${block.length}`);
  ok('budget: conversation summary is capped', !block.includes('S'.repeat(CONTEXT_BUDGET.conversationSummaryChars + 50)));
  const bigPrompt = buildPrompt('C'.repeat(50000), block);
  ok('budget: final system prompt respects maxPromptChars', bigPrompt.length <= CONTEXT_BUDGET.maxPromptChars, `${bigPrompt.length}`);
  ok('budget: memory survives a huge portfolio context', bigPrompt.includes(MEMORY_START));

  // =====================================================================
  // C. chat integration (owner-gated persistence)
  // =====================================================================
  await cache.set('project:all', []); // avoid GitHub fetch during retrieval
  process.env.MEMORY_NAMESPACE = NS;
  process.env.RATE_LIMIT_AI = '1000';
  process.env.GROQ_API_KEY = 'test-key';
  process.env.GROQ_ENDPOINT = mockEndpoint;
  process.env.MEMORY_SUMMARY_TRIGGER = '10';
  process.env.MEMORY_SUMMARY_KEEP_RECENT = '4';

  const ownerApp = await listen(makeChatApp(true));
  const ownerBase = `http://127.0.0.1:${ownerApp.address().port}`;

  const r1 = await postJson(ownerBase, '/api/ai/chat', { question: 'What stack does Atlas use?', history: [] });
  ok('chat: owner response keeps contract', r1.status === 200 && r1.body.success === true && r1.body.answer === 'ok from mock' && typeof r1.body.requestId === 'string');
  ok('chat: owner response returns a conversation id', typeof r1.body.conversationId === 'string' && isConversationId(r1.body.conversationId));
  ok('chat: owner exchange is persisted', r1.body.conversation && r1.body.conversation.persisted === true);
  const chatId = r1.body.conversationId;
  const storedAfter1 = (await loadConversation(NS, chatId)).conversation;
  ok('chat: two turns stored after first message', storedAfter1.turns.length === 2);

  // simulated refresh: no local history, only the conversation id
  const r2 = await postJson(ownerBase, '/api/ai/chat', { question: 'And the database?', history: [], conversationId: chatId });
  ok('chat: same conversation continues after refresh', r2.body.conversationId === chatId);
  const storedAfter2 = (await loadConversation(NS, chatId)).conversation;
  ok('chat: exchange appended -> continuity preserved', storedAfter2.turns.length === 4 && storedAfter2.summarizedUpTo === 0);

  // the provider must have received prior turns (continuity), not just the new question
  const chatReq = [...captured].reverse().find((c) => {
    const u = [...(c.messages || [])].reverse().find((m) => m.role === 'user');
    return u && u.content === 'And the database?';
  });
  const chatMsgs = (chatReq && chatReq.messages) || [];
  ok('chat: prior turns supplied as context after refresh', chatMsgs.some((m) => m.role === 'user' && m.content === 'What stack does Atlas use?'));
  ok('chat: current question not duplicated in messages', chatMsgs.filter((m) => m.role === 'user' && m.content === 'And the database?').length === 1);

  // identical retry -> no double write
  const r3 = await postJson(ownerBase, '/api/ai/chat', { question: 'And the database?', history: [], conversationId: chatId });
  const storedAfter3 = (await loadConversation(NS, chatId)).conversation;
  ok('chat: identical retry does not double-write', r3.status === 200 && storedAfter3.turns.length === 4 && storedAfter3.summarizedUpTo === 0);

  // empty provider answer -> not persisted
  const emptyRes = await postJson(ownerBase, '/api/ai/chat', { question: 'REQUEST_EMPTY please', history: [], conversationId: newConversationId() });
  ok('chat: empty answer returns a friendly message', emptyRes.status === 200 && emptyRes.body.success === true && typeof emptyRes.body.message === 'string');

  ownerApp.close();

  // provider unavailable -> 502, nothing persisted
  delete process.env.GROQ_API_KEY;
  const downApp = await listen(makeChatApp(true));
  const downBase = `http://127.0.0.1:${downApp.address().port}`;
  const before = (await loadConversation(NS, chatId)).conversation.turns.length;
  const downRes = await postJson(downBase, '/api/ai/chat', { question: 'anything', history: [], conversationId: chatId });
  const afterDown = (await loadConversation(NS, chatId)).conversation.turns.length;
  ok('chat: provider unavailable -> 502', downRes.status === 502);
  ok('chat: failed turn is not persisted', afterDown === before);
  downApp.close();

  // anonymous: cannot read or write owner conversations
  process.env.GROQ_API_KEY = 'test-key';
  const anonSeedId = newConversationId();
  await store.upsertConversation(NS, { id: anonSeedId, turns: [{ role: 'user', text: 'owner secret' }, { role: 'assistant', text: 'owner reply' }], summary: 'SECRET_SUMMARY_TOKEN' });
  const anonApp = await listen(makeChatApp(false));
  const anonBase = `http://127.0.0.1:${anonApp.address().port}`;
  const anonStored = (await loadConversation(NS, chatId)).conversation;
  const anonRes = await postJson(anonBase, '/api/ai/chat', { question: 'hello there', history: [], conversationId: chatId });
  ok('chat: anonymous response has no conversation id', anonRes.status === 200 && !('conversationId' in anonRes.body));
  const anonReq = [...captured].reverse().find((c) => {
    const u = [...(c.messages || [])].reverse().find((m) => m.role === 'user');
    return u && u.content === 'hello there';
  });
  const anonPrompt = anonReq ? ((anonReq.messages || []).find((m) => m.role === 'system') || {}).content || '' : '';
  ok('chat: anonymous prompt never contains owner conversation content', !anonPrompt.includes('SECRET_SUMMARY_TOKEN') && !anonPrompt.includes('owner secret'));
  const anonAfter = (await loadConversation(NS, chatId)).conversation;
  ok('chat: anonymous request does not mutate owner conversation', anonAfter.turns.length === anonStored.turns.length);
  anonApp.close();

  // N.B. assembleMemory direct check for the empty-state contract
  const emptyAsm = await assembleMemory({ namespace: 'memns_p4empty_0003', question: 'x' });
  ok('assemble: empty namespace fabricates nothing', emptyAsm.hasMemory === false);

  for (const line of results) console.log(line);
  console.log(`\n${pass} passed, ${fail} failed`);
  mock.close();
  process.exit(fail === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error('test harness crashed:', err);
  process.exit(1);
});
