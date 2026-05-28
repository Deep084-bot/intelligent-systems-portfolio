const TIMEOUT_MS = 30_000;

function parseErrorBody(status, bodyText) {
  try {
    const parsed = JSON.parse(bodyText);
    return parsed?.message || parsed?.error || `Server error (${status})`;
  } catch {
    return `Server error (${status})`;
  }
}

export async function chat(question, history = [], parentSignal = null) {
  const requestId = Math.random().toString(36).slice(2, 10);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  let cleanup = null;
  if (parentSignal) {
    if (parentSignal.aborted) controller.abort(parentSignal.reason);
    else {
      const onAbort = () => controller.abort(parentSignal.reason);
      parentSignal.addEventListener('abort', onAbort, { once: true });
      cleanup = () => parentSignal.removeEventListener('abort', onAbort);
    }
  }

  try {
    const payload = { question, history, requestId };
    const resp = await fetch('/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    if (cleanup) cleanup();

    let bodyText;
    try {
      bodyText = await resp.text();
    } catch {
      throw Object.assign(new Error('AI assistant is temporarily unavailable.'), { status: 0, requestId });
    }

    if (!resp.ok) {
      const msg = parseErrorBody(resp.status, bodyText);
      const err = Object.assign(new Error(msg), {
        status: resp.status,
        retryAfter: resp.headers.get('Retry-After') ? parseInt(resp.headers.get('Retry-After'), 10) : null,
        unavailable: resp.status === 503 || resp.status === 502,
        requestId,
      });
      throw err;
    }

    let data;
    try {
      data = JSON.parse(bodyText);
    } catch {
      throw Object.assign(new Error('Received an invalid response from the server.'), { status: 502, requestId });
    }

    if (!data || typeof data !== 'object') {
      throw Object.assign(new Error('AI assistant is temporarily unavailable.'), { status: 502, requestId });
    }

    data.requestId = requestId;
    return data;
  } catch (err) {
    clearTimeout(timeoutId);
    if (cleanup) cleanup();

    if (err.name === 'AbortError') {
      throw Object.assign(new Error('Request timed out. Please try again.'), { status: 0, requestId });
    }

    if (err.name === 'TypeError' && (!err.status || err.message === 'Failed to fetch')) {
      throw Object.assign(new Error('AI assistant is temporarily unavailable.'), { status: 0, unavailable: true, requestId });
    }

    err.requestId = err.requestId || requestId;
    throw err;
  }
}
