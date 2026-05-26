// Per-IP rate limiter: up to 4 AI requests per 60s window
// This is intentionally conservative to stay within Groq free tier TPM limits (~6000 tokens/min)
const AI_WINDOW_MS = 60 * 1000;
const AI_MAX_PER_WINDOW = process.env.RATE_LIMIT_AI ? Number(process.env.RATE_LIMIT_AI) : 4;

const buckets = new Map();

export default function rateLimit(req, res, next) {
  try {
    const ip = req.ip || req.headers['x-forwarded-for'] || req.connection?.remoteAddress || 'anon';
    const now = Date.now();
    const entry = buckets.get(ip) || { count: 0, start: now, aiCount: 0 };

    // Reset general bucket if window passed
    if (now - entry.start > AI_WINDOW_MS) {
      entry.count = 0;
      entry.aiCount = 0;
      entry.start = now;
    }

    entry.count++;
    buckets.set(ip, entry);

    // Stricter limit for AI chat endpoint
    if (req.path === '/chat' && entry.aiCount >= AI_MAX_PER_WINDOW) {
      const retryAfter = Math.ceil((entry.start + AI_WINDOW_MS - now) / 1000);
      res.set('Retry-After', String(retryAfter));
      return res.status(429).json({
        error: `You've reached the request limit. Please wait ${retryAfter}s before sending another message.`,
      });
    }

    if (req.path === '/chat') {
      entry.aiCount++;
    }

    next();
  } catch (err) {
    next();
  }
}
