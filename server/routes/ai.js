import express from 'express';
import { detectCategory } from '../classifiers/index.js';
import { retrieveRelevantContext } from '../retrieval/index.js';
import { buildPrompt } from '../prompt/builder.js';
import { getProvider } from '../aiProviders/index.js';

const router = express.Router();
const REQUEST_TIMEOUT_MS = 30_000;

function safeJson(res, status, data) {
  if (res.headersSent) return;
  try { res.status(status).json(data); } catch {}
}

function normalizeHistory(history) {
  if (!Array.isArray(history)) return [];
  return history
    .filter(m => m && typeof m === 'object')
    .map(m => ({
      role: ['system', 'user', 'assistant'].includes(m.role) ? m.role : 'user',
      content: String(m.content ?? m.text ?? ''),
    }))
    .filter(m => m.content.trim().length > 0);
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
    if (!res.headersSent) safeJson(res, 504, { error: 'The request timed out. Please try again.' });
    try { controller.abort(); } catch {}
  }, REQUEST_TIMEOUT_MS);

  // if client disconnects, abort provider work
  req.on('close', () => {
    console.log(JSON.stringify({ event: 'client_disconnected', id: logMeta.id, requestId: reqId }));
    try { controller.abort(); } catch {}
  });

  try {
    const { question, history } = req.body || {};
    if (!question || typeof question !== 'string' || !question.trim()) {
      clearTimeout(timeoutHandle);
      return safeJson(res, 400, { error: 'Please provide a question.' });
    }

    let provider;
    try {
      provider = getProvider();
    } catch (providerErr) {
      console.error(JSON.stringify({ event: 'provider_init_failed', msg: providerErr.message }));
      clearTimeout(timeoutHandle);
      return safeJson(res, 502, { error: 'AI provider unavailable.' });
    }

    let category;
    try {
      category = detectCategory(question);
    } catch {
      clearTimeout(timeoutHandle);
      return safeJson(res, 500, { error: 'AI assistant is temporarily unavailable.' });
    }

    let ctx;
    const retrievalStart = Date.now();
    try {
      ctx = await retrieveRelevantContext({ category, query: question });
    } catch {
      clearTimeout(timeoutHandle);
      return safeJson(res, 500, { error: 'AI assistant is temporarily unavailable.' });
    }
    const retrievalMs = Date.now() - retrievalStart;

    const contextStr = (ctx && ctx.context) || '';
    const promptBuildStart = Date.now();
    const systemPrompt = buildPrompt(contextStr);
    const promptBuildMs = Date.now() - promptBuildStart;

    // keep history trimmed to recent turns to limit prompt size and latency
    const normalizedHistory = normalizeHistory(history).slice(-6);

    console.log(JSON.stringify({
      event: 'chat_request', id: logMeta.id, requestId: reqId,
      category, contextSize: contextStr.length,
      historyLen: normalizedHistory.length,
    }));

    try {
      const result = await provider.sendPrompt({
        systemPrompt,
        history: normalizedHistory,
        question,
        temperature: 0.05,
        maxTokens: 512,
        signal: controller.signal,
        requestId: reqId,
      });

      const answer = (result && result.text) ? result.text.trim() : '';
      clearTimeout(timeoutHandle);

      if (!answer) {
        return safeJson(res, 200, {
          answer: 'I received your question but generated an empty response. Please try rephrasing.',
          requestId: reqId,
        });
      }

      const providerLatency = result.latencyMs || 0;
      const totalMs = Date.now() - requestStart;
      console.log(JSON.stringify({
        event: 'chat_response', id: logMeta.id, requestId: reqId,
        answerLen: answer.length, provider_latency_ms: providerLatency,
        retrieval_latency_ms: retrievalMs, prompt_build_ms: promptBuildMs,
        total_request_ms: totalMs,
      }));

      // lightweight performance metric event
      console.log(JSON.stringify({ event: 'metric', provider_latency_ms: providerLatency, retrieval_latency_ms: retrievalMs, total_request_ms: totalMs }));

      safeJson(res, 200, { answer, requestId: reqId });
    } catch (err) {
      clearTimeout(timeoutHandle);
      if (res.headersSent) return;
      const statusCode = errorStatus(err);
      const msg = err.message || 'AI assistant is temporarily unavailable.';
      const totalMs = Date.now() - requestStart;
      console.error(JSON.stringify({
        event: 'provider_error', id: logMeta.id, requestId: reqId, statusCode,
        msg: msg.slice(0, 300), retrieval_latency_ms: retrievalMs ?? null, prompt_build_ms: promptBuildMs ?? null, total_request_ms: totalMs,
      }));
      // do not expose raw error; return normalized message
      safeJson(res, statusCode, { error: msg, requestId: reqId });
    }
  } catch (err) {
    clearTimeout(timeoutHandle);
    if (res.headersSent) return;
    console.error(JSON.stringify({
      event: 'chat_fatal', id: logMeta.id, msg: err.message?.slice(0, 300),
    }));
    safeJson(res, 500, { error: 'AI assistant is temporarily unavailable.' });
  }
});

router.get('/status', (req, res) => {
  safeJson(res, 200, {
    ok: true,
    uptime: Math.floor(process.uptime()),
    providerConfigured: !!process.env.GROQ_API_KEY || !!process.env.GEMINI_API_KEY,
  });
});

// Connectivity test endpoint (raw provider connectivity debugging)
router.get('/test', async (req, res) => {
  const start = Date.now();
  const requestId = Math.random().toString(36).slice(2, 10);
  console.log(JSON.stringify({ event: 'provider_connectivity_test_start', requestId }));

  const apiHost = 'api.groq.com';
  const apiUrl = 'https://api.groq.com/openai/v1/chat/completions';
  const key = process.env.GROQ_API_KEY || null;

  // helper to respond in a single place
  function respond(status, body) {
    if (res.headersSent) return;
    res.status(status).json(body);
  }

  // DNS lookup
  try {
    const dns = await import('dns');
    const { promises: dnsPromises } = dns;
    const lookupStart = Date.now();
    let addr = null;
    try {
      const r = await dnsPromises.lookup(apiHost);
      addr = r.address;
      console.log(JSON.stringify({ event: 'dns_lookup', requestId, host: apiHost, address: addr, durationMs: Date.now() - lookupStart }));
    } catch (e) {
      console.error(JSON.stringify({ event: 'dns_error', requestId, host: apiHost, msg: e.message }));
      // continue to allow fetch to reveal error too
    }
  } catch (e) {
    console.error(JSON.stringify({ event: 'dns_module_unavailable', msg: e.message }));
  }

  // TCP connect test
  try {
    const net = await import('net');
    const socket = new net.Socket();
    const connectStart = Date.now();
    const connTimeout = 5000;
    let connected = false;
    await new Promise((resolve) => {
      socket.setTimeout(connTimeout);
      socket.once('error', (err) => {
        console.error(JSON.stringify({ event: 'tcp_connect_error', requestId, msg: err.message }));
        socket.destroy();
        resolve();
      });
      socket.once('timeout', () => {
        console.error(JSON.stringify({ event: 'tcp_connect_timeout', requestId, host: apiHost }));
        socket.destroy();
        resolve();
      });
      socket.connect(443, apiHost, () => {
        connected = true;
        const ms = Date.now() - connectStart;
        console.log(JSON.stringify({ event: 'tcp_connect', requestId, host: apiHost, durationMs: ms }));
        socket.end();
        resolve();
      });
    });
  } catch (e) {
    console.error(JSON.stringify({ event: 'tcp_test_failure', requestId, msg: e.message }));
  }

  // If no API key, return early
  if (!key) {
    console.error(JSON.stringify({ event: 'provider_connectivity_test_no_key', requestId }));
    return respond(400, { ok: false, error: 'GROQ_API_KEY not configured', requestId });
  }

  // Increase timeout for connectivity test
  const controller = new AbortController();
  const timeoutMs = 60_000;
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  // Try groq-sdk first if available
  try {
    let Groq = null;
    try {
      const mod = await import('groq-sdk');
      Groq = mod.default || mod.Groq || mod;
    } catch (e) {
      console.log(JSON.stringify({ event: 'groq_sdk_missing', requestId, msg: e.message }));
    }

    if (Groq) {
      try {
        console.log(JSON.stringify({ event: 'groq_sdk_init', requestId }));
        const sdk = new Groq({ apiKey: key });
        console.log(JSON.stringify({ event: 'groq_sdk_ready', requestId }));
        // send minimal request
        console.log(JSON.stringify({ event: 'groq_sdk_request_start', requestId }));
        const reqStart = Date.now();
        // Attempt to call compatible API — many SDKs map to openai-like methods; try common patterns
        let sdkResp = null;
        if (typeof sdk.chat === 'object' && typeof sdk.chat.completions?.create === 'function') {
          sdkResp = await sdk.chat.completions.create({ model: 'llama-3.1-8b-instant', messages: [{ role: 'user', content: 'ping' }] });
        } else if (typeof sdk.chatCompletion === 'function') {
          sdkResp = await sdk.chatCompletion({ model: 'llama-3.1-8b-instant', messages: [{ role: 'user', content: 'ping' }] });
        } else if (typeof sdk.createCompletion === 'function') {
          // fallback
          sdkResp = await sdk.createCompletion({ model: 'llama-3.1-8b-instant', messages: [{ role: 'user', content: 'ping' }] });
        } else if (typeof sdk.request === 'function') {
          sdkResp = await sdk.request({ method: 'POST', path: '/openai/v1/chat/completions', body: { model: 'llama-3.1-8b-instant', messages: [{ role: 'user', content: 'ping' }] } });
        } else {
          console.log(JSON.stringify({ event: 'groq_sdk_unknown_api', requestId }));
        }
        const sdkMs = Date.now() - reqStart;
        clearTimeout(timeoutId);
        console.log(JSON.stringify({ event: 'groq_sdk_response', requestId, durationMs: sdkMs }));
        // attempt to extract text
        let respText = '';
        try { respText = (sdkResp?.choices?.[0]?.message?.content) || JSON.stringify(sdkResp).slice(0, 200); } catch (e) { respText = String(sdkResp).slice(0, 200); }
        return respond(200, { ok: true, via: 'sdk', durationMs: sdkMs, preview: String(respText).slice(0, 100), requestId, raw: typeof sdkResp === 'object' ? Object.keys(sdkResp).slice(0,5) : null });
      } catch (sdkErr) {
        console.error(JSON.stringify({ event: 'groq_sdk_error', requestId, msg: sdkErr.message?.slice(0,300) }));
        // fallthrough to raw fetch test
      }
    }
  } catch (e) {
    console.error(JSON.stringify({ event: 'groq_sdk_import_failed', requestId, msg: e.message }));
  }

  // Raw fetch fallback
  try {
    console.log(JSON.stringify({ event: 'groq_raw_fetch_start', requestId }));
    const fetchStart = Date.now();
    const resp = await fetch(apiUrl, {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'llama-3.1-8b-instant', messages: [{ role: 'user', content: 'ping' }] }),
      signal: controller.signal,
    });
    const fetchMs = Date.now() - fetchStart;
    let j = null;
    try { j = await resp.json(); } catch (e) { j = null; }
    clearTimeout(timeoutId);

    const groqRequestId = resp.headers.get('x-request-id') || resp.headers.get('request-id') || null;
    console.log(JSON.stringify({ event: 'groq_raw_fetch_end', requestId, status: resp.status, groq_request_id: groqRequestId, fetchMs }));

    const preview = j ? (j.choices?.[0]?.message?.content || JSON.stringify(j).slice(0,100)) : null;
    return respond(resp.ok ? 200 : 502, { ok: resp.ok, status: resp.status, groqRequestId, durationMs: fetchMs, preview: preview ? String(preview).slice(0,100) : null, body: j });
  } catch (e) {
    clearTimeout(timeoutId);
    // Determine error type
    const errMsg = e?.message || String(e);
    const errType = (e && e.code) ? e.code : (/(timeout|aborted|abort)/i.test(errMsg) ? 'AbortError/Timeout' : 'network');
    console.error(JSON.stringify({ event: 'groq_raw_fetch_error', requestId, errType, msg: errMsg }));
    return respond(502, { ok: false, error: errMsg, errType, requestId });
  }
});

export default router;
