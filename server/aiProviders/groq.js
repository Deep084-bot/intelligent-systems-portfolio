const DEFAULT_MODEL = process.env.GROQ_MODEL || 'llama-3.1-8b-instant';
const TIMEOUT_MS = 10_000; // per-provider attempt timeout (reduced to keep total under frontend timeout)
const MAX_SYSTEM_CHARS = 20_000; // reduce oversized prompts to improve latency

const MAX_RETRIES = 1; // keep total attempts low so total latency stays under frontend timeout

const CB_FAILURE_THRESHOLD = 3;
const CB_OPEN_DURATION_MS = 20_000; // 20s as requested

const RETRYABLE_STATUSES = new Set([429, 500, 502, 503, 504]);
const RETRYABLE_ERRORS = [/ECONNRESET/, /ETIMEDOUT/, /fetch failed/i, /network error/i, /timeout/i, /network/i];

// Normalized messages (do NOT expose raw provider errors)
const STATUS_MESSAGES = {
  400: 'AI provider rejected the request.',
  401: 'AI provider authentication failed.',
  403: 'AI provider access denied.',
  408: 'AI request timed out.',
  429: 'AI service is busy right now.',
  500: 'AI provider temporarily unavailable.',
  502: 'AI provider temporarily unavailable.',
  503: 'AI provider temporarily unavailable.',
  504: 'AI provider temporarily unavailable.',
};

function truncateSystemPrompt(prompt) {
  if (!prompt || prompt.length <= MAX_SYSTEM_CHARS) return prompt || '';
  const half = Math.floor(MAX_SYSTEM_CHARS / 2);
  return prompt.slice(0, half) + '\n...[context truncated]...\n' + prompt.slice(-half);
}

function normalizeResp(raw) {
  if (!raw) return { text: '', tokensUsed: 0 };
  if (typeof raw === 'string') return { text: raw, tokensUsed: Math.round(raw.length / 4) };
  if (raw.choices && raw.choices.length && raw.choices[0].message && typeof raw.choices[0].message.content === 'string') {
    const text = raw.choices[0].message.content;
    return { text, tokensUsed: raw.usage?.total_tokens || Math.round(text.length / 4) };
  }
  if (raw.output) {
    const text = Array.isArray(raw.output) ? raw.output.map(o => o.text || JSON.stringify(o)).join('\n') : String(raw.output);
    return { text, tokensUsed: raw.usage?.total_tokens || Math.round(text.length / 4) };
  }
  if (raw.generated_text) {
    const text = String(raw.generated_text);
    return { text, tokensUsed: raw.usage?.total_tokens || Math.round(text.length / 4) };
  }
  return { text: JSON.stringify(raw), tokensUsed: Math.round(JSON.stringify(raw).length / 4) };
}

function isRetryable(err) {
  if (!err) return false;
  if (err.statusCode && RETRYABLE_STATUSES.has(err.statusCode)) return true;
  if (err.code === 'ECONNRESET' || err.code === 'ETIMEDOUT') return true;
  const msg = (err.message || '') + (err.cause?.message || '');
  return RETRYABLE_ERRORS.some(r => r.test(msg));
}

function getStatusMessage(statusCode) {
  return STATUS_MESSAGES[statusCode] || 'AI provider temporarily unavailable.';
}

function createCircuitBreaker() {
  let failures = [];
  let open = false;
  let openUntil = 0;

  function recordFailure() {
    const now = Date.now();
    failures = failures.filter(t => now - t < 60_000);
    failures.push(now);
    if (!open && failures.length >= CB_FAILURE_THRESHOLD) {
      open = true;
      openUntil = now + CB_OPEN_DURATION_MS;
      setTimeout(() => { open = false; failures = []; openUntil = 0; }, CB_OPEN_DURATION_MS);
      console.log(JSON.stringify({ event: 'provider_circuit_open', until: new Date(openUntil).toISOString() }));
    }
  }

  function recordSuccess() {
    failures = [];
  }

  function isOpen() {
    if (!open) return false;
    if (Date.now() >= openUntil) {
      open = false; failures = []; openUntil = 0; return false;
    }
    return true;
  }

  function timeUntilClosed() {
    if (!open) return 0;
    return Math.max(0, openUntil - Date.now());
  }

  return { recordFailure, recordSuccess, isOpen, timeUntilClosed };
}

export default function createGroqProvider({ apiKey = null, name = 'groq' } = {}) {
  const circuitBreaker = createCircuitBreaker();

  // Simple serial queue to prevent overlapping requests
  let queue = Promise.resolve();
  function enqueue(fn) {
    queue = queue.then(() => fn(), () => fn()); // ensure chain continues on errors
    return queue;
  }

  // exponential backoff with jitter (ms) — keep small to avoid long retries
  function backoffDelay(attempt) {
    const base = 200; // base ms
    const exp = Math.min(5_000, base * Math.pow(2, attempt));
    const jitter = Math.floor(Math.random() * 200);
    return exp + jitter;
  }

  async function doSend(promptArgs) {
    const { systemPrompt, history = [], question, maxTokens = 512, temperature = 0.2, model, signal: externalSignal, requestId } = promptArgs || {};
    const useModel = model || process.env.GROQ_MODEL || DEFAULT_MODEL;
    const hasKey = !!apiKey;

    if (!hasKey) {
      console.log(JSON.stringify({ event: 'provider_request_mock', provider: 'groq', requestId }));
      return {
        text: `[MOCK GROQ:${useModel}] ${(question || '').slice(0, 200)}...`,
        tokensUsed: Math.round((question || '').length / 4),
        provider: 'groq',
        model: useModel,
        mocked: true,
      };
    }

    // circuit breaker check
    if (circuitBreaker.isOpen()) {
      console.log(JSON.stringify({ event: 'provider_request', provider: 'groq', status: 'circuit_open', requestId }));
      const err = new Error(getStatusMessage(503));
      err.statusCode = 503;
      throw err;
    }

    const safeSystem = truncateSystemPrompt(systemPrompt);

    // validate and normalize messages strictly to { role, content }
    const normalizeMsg = (m) => {
      if (!m || typeof m !== 'object') return null;
      const role = (m.role || '').toString().trim().toLowerCase();
      const content = (m.content ?? m.text ?? '').toString().trim();
      if (!content) return null;
      if (!['system', 'user', 'assistant'].includes(role)) return null;
      return { role, content };
    };

    const messages = [];
    const sys = normalizeMsg({ role: 'system', content: safeSystem });
    if (sys) messages.push(sys);
    (history || []).forEach(h => {
      const nm = normalizeMsg(h);
      if (nm) messages.push(nm);
    });
    const userMsg = normalizeMsg({ role: 'user', content: question || '' });
    if (userMsg) messages.push(userMsg);

    const endpoint = process.env.GROQ_ENDPOINT || 'https://api.groq.com/openai/v1/chat/completions';
    const payload = { model: useModel, messages, temperature, max_completion_tokens: maxTokens };

    console.log(JSON.stringify({ event: 'provider_request', provider: 'groq', model: useModel, requestId }));

    let lastErr = null;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      const controller = new AbortController();
      // wire external signal to internal controller so route can cancel
      if (externalSignal) {
        if (externalSignal.aborted) controller.abort(externalSignal.reason);
        else externalSignal.addEventListener('abort', () => controller.abort(externalSignal.reason), { once: true });
      }
      const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);
      const start = Date.now();

      try {
        if (attempt > 0) {
          const delay = backoffDelay(attempt - 1);
          console.log(JSON.stringify({ event: 'provider_retry_wait', provider: 'groq', attempt, delayMs: delay, requestId }));
          await new Promise(r => setTimeout(r, delay));
        }

        const reqStart = Date.now();
        // detect if external signal already aborted
        if (externalSignal && externalSignal.aborted) {
          console.log(JSON.stringify({ event: 'provider_external_aborted_before_fetch', requestId, attempt }));
        }
        console.log(JSON.stringify({ event: 'provider_fetch_start', provider: 'groq', requestId, attempt }));
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });
        console.log(JSON.stringify({ event: 'provider_fetch_end', provider: 'groq', requestId, attempt, status: res.status }));
        const providerCallMs = Date.now() - reqStart;
        clearTimeout(timeoutId);

        if (!res.ok) {
          const status = res.status;
          const message = getStatusMessage(status);
          const err = new Error(message);
          err.statusCode = status;

          if (isRetryable(err) && attempt < MAX_RETRIES) {
            lastErr = err;
            console.log(JSON.stringify({ event: 'provider_retry', provider: 'groq', attempt, status, requestId, provider_latency_ms: providerCallMs }));
            continue;
          }

          if (RETRYABLE_STATUSES.has(status)) circuitBreaker.recordFailure();
          else circuitBreaker.recordSuccess();

          console.log(JSON.stringify({ event: 'provider_failure', provider: 'groq', status, requestId, provider_latency_ms: providerCallMs }));
          throw err;
        }

        let j;
        try { j = await res.json(); } catch (e) {
          clearTimeout(timeoutId);
          circuitBreaker.recordFailure();
          console.log(JSON.stringify({ event: 'provider_failure', provider: 'groq', status: 502, requestId }));
          const err = new Error('AI provider temporarily unavailable.');
          err.statusCode = 502;
          throw err;
        }

        circuitBreaker.recordSuccess();
        const latencyMs = Date.now() - start;
        const normalized = normalizeResp(j);
        console.log(JSON.stringify({ event: 'provider_success', provider: 'groq', latencyMs, attempt, requestId, provider_latency_ms: latencyMs, provider_call_ms: providerCallMs }));

        return {
          text: normalized.text,
          tokensUsed: normalized.tokensUsed,
          provider: 'groq',
          model: useModel,
          latencyMs,
        };
      } catch (fetchErr) {
        clearTimeout(timeoutId);

        const isAbort = fetchErr && fetchErr.name === 'AbortError';
        if (isAbort) {
          console.log(JSON.stringify({ event: 'provider_timeout', provider: 'groq', requestId }));
          circuitBreaker.recordFailure();
          const err = new Error('AI request timed out.');
          err.statusCode = 408;
          throw err;
        }

        if (fetchErr && fetchErr.statusCode) {
          if (isRetryable(fetchErr) && attempt < MAX_RETRIES) {
            lastErr = fetchErr;
            console.log(JSON.stringify({ event: 'provider_retry', provider: 'groq', attempt, status: fetchErr.statusCode, requestId }));
            continue;
          }
          circuitBreaker.recordFailure();
          console.log(JSON.stringify({ event: 'provider_failure', provider: 'groq', status: fetchErr.statusCode, requestId }));
          throw fetchErr;
        }

        if (isRetryable(fetchErr) && attempt < MAX_RETRIES) {
          lastErr = fetchErr;
          console.log(JSON.stringify({ event: 'provider_retry', provider: 'groq', attempt, msg: (fetchErr.message || '').slice(0,120), requestId }));
          continue;
        }

        circuitBreaker.recordFailure();
        console.log(JSON.stringify({ event: 'provider_failure', provider: 'groq', msg: (fetchErr && fetchErr.message || '').slice(0,120), requestId }));
        const err = new Error('AI provider temporarily unavailable.');
        err.statusCode = 503;
        throw err;
      }
    }

    circuitBreaker.recordFailure();
    console.log(JSON.stringify({ event: 'provider_failure', provider: 'groq', msg: 'retries exhausted', requestId }));
    const finalErr = new Error('AI provider temporarily unavailable.');
    finalErr.statusCode = 503;
    throw finalErr;
  }

  // Public API: serialize calls to prevent overlapping requests
  async function sendPrompt(args) {
    return enqueue(() => doSend(args));
  }

  return { sendPrompt };
}
