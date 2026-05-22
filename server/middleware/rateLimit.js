// Simple per-IP rate limiter: up to 20 requests per minute
const windowMs = 60 * 1000; // 1 minute
const maxRequests = process.env.RATE_LIMIT_MAX ? Number(process.env.RATE_LIMIT_MAX) : 20;

const buckets = new Map();

export default function rateLimit(req, res, next) {
  try {
    const ip = req.ip || req.headers['x-forwarded-for'] || req.connection?.remoteAddress || 'anon';
    const now = Date.now();
    const entry = buckets.get(ip) || { count: 0, start: now };
    if (now - entry.start > windowMs) {
      entry.count = 0;
      entry.start = now;
    }
    entry.count++;
    buckets.set(ip, entry);
    if (entry.count > maxRequests) {
      res.status(429).json({ error: 'Rate limit exceeded. Please try again later.' });
      return;
    }
    next();
  } catch (err) {
    next();
  }
}
