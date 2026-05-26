// Staged verification tests for AI providers using aiClient
import { performance } from 'perf_hooks';
import buildContext from '../contextBuilder.js';
import { sendAIRequest } from '../aiClient.js';

const tests = [
  { id: 'connectivity', category: 'general', query: 'Ping the AI provider with a tiny check.' },
  { id: 'backend_project', category: 'backend/project/system', query: 'Summarize the backend architecture of my portfolio and list main services.' },
  { id: 'dsa_query', category: 'dsa/problem-solving', query: 'Explain how to approach two-pointer problems and give a short example.' },
  { id: 'learning_query', category: 'learning/ai/system-design', query: 'Suggest next learning steps for system design focusing on scalability and observability.' },
  { id: 'general_query', category: 'general', query: 'Give a concise overview of my portfolio and contact details.' }
];

async function runSingleTest(t) {
  const injectedCtx = await buildContext({ category: t.category, query: t.query });
  const promptParts = ['[SYSTEM] You are a concise assistant.'];
  promptParts.push('[CONTEXT] ' + injectedCtx);
  promptParts.push('[USER] ' + t.query);
  promptParts.push('[CONSTRAINT] Keep answer < 150 words.');
  const finalPrompt = promptParts.join('\n\n');

  const promptSize = finalPrompt.length;
  const start = performance.now();
  let cacheHit = false;
  let res;
  try {
    res = await sendAIRequest({ category: t.category, userQuery: t.query, concise: true, maxTokens: 300 });
    // sendAIRequest itself caches response; second call should hit cache
    const res2 = await sendAIRequest({ category: t.category, userQuery: t.query, concise: true, maxTokens: 300 });
    cacheHit = !!res2.cached;
  } catch (err) {
    res = { error: err.message };
  }
  const end = performance.now();
  const latency = Math.round(end - start);

  return {
    id: t.id,
    category: t.category,
    query: t.query,
    promptSize,
    provider: res.provider || null,
    model: res.model || process.env.GROQ_MODEL || process.env.GEMINI_MODEL || null,
    latencyMs: latency,
    tokensUsed: res.tokensUsed || null,
    cacheHit,
    conciseQualitySample: (res.text || '').slice(0, 500),
    raw: res.error ? { error: res.error } : undefined
  };
}

async function runAll() {
  console.log('Provider test run, AI_PROVIDER=', process.env.AI_PROVIDER);
  for (const t of tests) {
    const r = await runSingleTest(t);
    console.log('--- TEST RESULT ---');
    console.log(JSON.stringify(r, null, 2));
  }
}

runAll().catch(e => { console.error('Test runner error', e); process.exit(1); });
