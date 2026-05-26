const DEFAULT_MODEL = process.env.GROQ_MODEL || 'llama-3.1-8b-instant';
const TIMEOUT_MS = 15_000;
const MAX_SYSTEM_CHARS = 30_000;

const MAX_RETRIES = 2; // number of retry attempts (not counting first try)

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

  // exponential backoff with jitter (ms)
  function backoffDelay(attempt) {
    const base = 300; // base ms
    const exp = Math.min(30_000, base * Math.pow(2, attempt));
    const jitter = Math.floor(Math.random() * 200);
    return exp + jitter;
  }

  async function doSend(promptArgs) {
    const { systemPrompt, history = [], question, maxTokens = 512, temperature = 0.2, model } = promptArgs || {};
    const useModel = model || process.env.GROQ_MODEL || DEFAULT_MODEL;
    const hasKey = !!apiKey;

    if (!hasKey) {
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
      console.log(JSON.stringify({ event: 'provider_request', provider: 'groq', status: 'circuit_open' }));
      // Immediately return a graceful, normalized error object so caller can surface a friendly message
      const err = new Error(getStatusMessage(503));
      err.statusCode = 503;
      throw err;
    }

    const safeSystem = truncateSystemPrompt(systemPrompt);
    const messages = [ { role: 'system', content: safeSystem }, ...history, { role: 'user', content: question || '' } ];
    const endpoint = process.env.GROQ_ENDPOINT || 'https://api.groq.com/openai/v1/chat/completions';
    const payload = { model: useModel, messages, temperature, max_tokens: maxTokens };

    console.log(JSON.stringify({ event: 'provider_request', provider: 'groq', model: useModel }));

    let lastErr = null;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);
      const start = Date.now();

      try {
        if (attempt > 0) {
          const delay = backoffDelay(attempt - 1);
          console.log(JSON.stringify({ event: 'provider_retry', provider: 'groq', attempt, delayMs: delay }));
          await new Promise(r => setTimeout(r, delay));
        }

        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!res.ok) {
          // don't expose provider body; map to normalized message
          const status = res.status;
          const message = getStatusMessage(status);
          const err = new Error(message);
          err.statusCode = status;

          if (isRetryable(err) && attempt < MAX_RETRIES) {
            lastErr = err;
            console.log(JSON.stringify({ event: 'provider_retry', provider: 'groq', attempt, status }));
            continue;
          }

          // track failure for circuit breaker on retryable status codes
          if (RETRYABLE_STATUSES.has(status)) circuitBreaker.recordFailure();
          else circuitBreaker.recordSuccess();

          console.log(JSON.stringify({ event: 'provider_failure', provider: 'groq', status }));
          throw err;
        }

        let j;
        try { j = await res.json(); } catch (e) {
          clearTimeout(timeoutId);
          circuitBreaker.recordFailure();
          console.log(JSON.stringify({ event: 'provider_failure', provider: 'groq', status: 502 }));
          const err = new Error('AI provider temporarily unavailable.');
          err.statusCode = 502;
          throw err;
        }

        circuitBreaker.recordSuccess();
        const latencyMs = Date.now() - start;
        const normalized = normalizeResp(j);
        console.log(JSON.stringify({ event: 'provider_success', provider: 'groq', latencyMs, attempt }));

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
          console.log(JSON.stringify({ event: 'provider_timeout', provider: 'groq' }));
          circuitBreaker.recordFailure();
          const err = new Error('AI request timed out.');
          err.statusCode = 408;
          throw err;
        }

        // If the error carries a statusCode (we threw it above), respect retry rules
        if (fetchErr && fetchErr.statusCode) {
          if (isRetryable(fetchErr) && attempt < MAX_RETRIES) {
            lastErr = fetchErr;
            console.log(JSON.stringify({ event: 'provider_retry', provider: 'groq', attempt, status: fetchErr.statusCode }));
            continue;
          }
          // non-retryable or exhausted
          circuitBreaker.recordFailure();
          console.log(JSON.stringify({ event: 'provider_failure', provider: 'groq', status: fetchErr.statusCode }));
          throw fetchErr;
        }

        // network/error scenarios
        if (isRetryable(fetchErr) && attempt < MAX_RETRIES) {
          lastErr = fetchErr;
          console.log(JSON.stringify({ event: 'provider_retry', provider: 'groq', attempt, msg: (fetchErr.message || '').slice(0,120) }));
          continue;
        }

        // final fallback sanitized error
        circuitBreaker.recordFailure();
        console.log(JSON.stringify({ event: 'provider_failure', provider: 'groq', msg: (fetchErr && fetchErr.message || '').slice(0,120) }));
        const err = new Error('AI provider temporarily unavailable.');
        err.statusCode = 503;
        throw err;
      }
    }

    // exhausted retries
    circuitBreaker.recordFailure();
    console.log(JSON.stringify({ event: 'provider_failure', provider: 'groq', msg: 'retries exhausted' }));
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
