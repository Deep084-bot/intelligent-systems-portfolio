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
    try {
      ctx = await retrieveRelevantContext({ category, query: question });
    } catch {
      clearTimeout(timeoutHandle);
      return safeJson(res, 500, { error: 'AI assistant is temporarily unavailable.' });
    }

    const contextStr = (ctx && ctx.context) || '';
    const systemPrompt = buildPrompt(contextStr);
    const normalizedHistory = normalizeHistory(history);

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

      console.log(JSON.stringify({
        event: 'chat_response', id: logMeta.id, requestId: reqId,
        answerLen: answer.length, latencyMs: result.latencyMs || 0,
      }));

      safeJson(res, 200, { answer, requestId: reqId });
    } catch (err) {
      clearTimeout(timeoutHandle);
      if (res.headersSent) return;
      const statusCode = errorStatus(err);
      const msg = err.message || 'AI assistant is temporarily unavailable.';
      console.error(JSON.stringify({
        event: 'provider_error', id: logMeta.id, requestId: reqId, statusCode,
        msg: msg.slice(0, 300),
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

export default router;
