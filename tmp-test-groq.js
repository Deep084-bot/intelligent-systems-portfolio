import createGroqProvider from './server/aiProviders/groq.js';

// helper to create a mock fetch sequence
function makeFetchSequence(sequence) {
  let i = 0;
  return async function fetchMock(url, opts) {
    const current = sequence[Math.min(i, sequence.length - 1)];
    i++;
    if (current.type === 'success') {
      return {
        ok: true,
        json: async () => ({ choices: [{ message: { content: current.text || 'ok' } }], usage: { total_tokens: 10 } })
      };
    }
    if (current.type === 'status') {
      return {
        ok: false,
        status: current.status,
        json: async () => ({ error: { message: current.msg || 'err' } })
      };
    }
    if (current.type === 'timeout') {
      // simulate a hanging request that responds to abort signal
      return new Promise((resolve, reject) => {
        if (opts && opts.signal) {
          if (opts.signal.aborted) {
            const e = new Error('aborted'); e.name = 'AbortError'; return reject(e);
          }
          opts.signal.addEventListener('abort', () => {
            const e = new Error('aborted'); e.name = 'AbortError'; reject(e);
          });
        }
        // otherwise hang (never resolve)
      });
    }
    if (current.type === 'network') {
      const err = new Error('fetch failed: network');
      err.code = 'ECONNRESET';
      throw err;
    }
    // default success
    return { ok: true, json: async () => ({ choices: [{ message: { content: 'ok' } }], usage: { total_tokens: 5 } }) };
  };
}

async function run() {
  console.log('Starting groq provider tests');

  // 1) 20 sequential requests
  globalThis.fetch = makeFetchSequence(Array(20).fill({ type: 'success', text: 'answer' }));
  const p = createGroqProvider({ apiKey: 'test-key' });
  console.log('\nTest 1: 20 sequential requests (should be fast and serial)');
  for (let i = 0; i < 20; i++) {
    const r = await p.sendPrompt({ systemPrompt: 'sys', question: `q${i}` });
    console.log('resp', i, r.text.slice(0,20));
  }

  // 2) rapid concurrent requests (should be serialized by provider)
  globalThis.fetch = makeFetchSequence(Array(5).fill({ type: 'success', text: 'fast' }));
  console.log('\nTest 2: rapid concurrent requests (5)');
  const promises = [];
  for (let i = 0; i < 5; i++) promises.push(p.sendPrompt({ systemPrompt: 'sys', question: `concurrent-${i}` }));
  const results = await Promise.all(promises);
  console.log('concurrent results count:', results.length);

  // 3) multi-turn
  globalThis.fetch = makeFetchSequence([{ type: 'success', text: 'turn1' }]);
  console.log('\nTest 3: multi-turn (history included)');
  const multi = await p.sendPrompt({ systemPrompt: 'sys', history: [{ role: 'assistant', content: 'prev' }], question: 'followup' });
  console.log('multi-turn text:', multi.text);

  // 4) timeout simulation
  globalThis.fetch = makeFetchSequence([{ type: 'timeout' }]);
  console.log('\nTest 4: timeout simulation (will trigger provider timeout)');
  try {
    const t = await p.sendPrompt({ systemPrompt: 'sys', question: 'will timeout' });
    console.log('unexpected success', t);
  } catch (e) {
    console.log('timeout caught:', e.message);
  }

  // 5) rate limit simulation (429 then success)
  globalThis.fetch = makeFetchSequence([{ type: 'status', status: 429, msg: 'rate' }, { type: 'status', status: 429, msg: 'rate' }, { type: 'success', text: 'after-rate' }]);
  console.log('\nTest 5: rate limit simulation (should retry then succeed or open circuit)');
  try {
    const r = await p.sendPrompt({ systemPrompt: 'sys', question: 'rate test' });
    console.log('rate response:', r.text);
  } catch (e) {
    console.log('rate error:', e.message);
  }

  console.log('\nAll tests done');
}

run().catch(e => { console.error('test script failed', e); process.exit(1); });
