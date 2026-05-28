export async function chat(question, history = [], parentSignal = null) {
  // generate a unique requestId for tracing
  const requestId = Math.random().toString(36).slice(2, 10);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30_000);

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

    if (!resp.ok) {
      let msg = `Server error (${resp.status})`;
      let retryAfter = null;
      let unavailable = false;
      try {
        const parsed = await resp.json();
        msg = parsed.error || msg;
      } catch {}
      if (resp.status === 429 || resp.status === 503) {
        const ra = resp.headers.get('Retry-After');
        retryAfter = ra ? parseInt(ra, 10) : null;
        unavailable = true;
      }
      if (resp.status === 504) {
        msg = 'Request timed out. Please try again.';
      }
      const err = new Error(msg);
      err.status = resp.status;
      err.retryAfter = retryAfter;
      err.unavailable = resp.status === 503 || resp.status === 502;
      err.requestId = requestId;
      throw err;
    }

    const data = await resp.json();
    // attach requestId for frontend tracing
    data.requestId = requestId;
    return data;
  } catch (err) {
    clearTimeout(timeoutId);
    if (cleanup) cleanup();

    if (err.name === 'AbortError') {
      const e = new Error('Request timed out. Please try again.');
      e.status = 0;
      e.requestId = requestId;
      throw e;
    }

    if (err.name === 'TypeError' && (!err.status || err.message === 'Failed to fetch')) {
      const e = new Error('AI assistant is temporarily unavailable.');
      e.status = 0;
      e.unavailable = true;
      e.requestId = requestId;
      throw e;
    }

    err.requestId = requestId;
    throw err;
  }
}
