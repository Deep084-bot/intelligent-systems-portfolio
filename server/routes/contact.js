import express from 'express';

const router = express.Router();

const RATE_LIMIT_WINDOW = 60 * 1000;
const MAX_PER_IP = 3;
const buckets = new Map();

function simpleSpamCheck(body) {
  const { name, email, message } = body;
  if (!name || !email || !message) return 'All fields are required';
  if (typeof name !== 'string' || name.length < 1 || name.length > 100) return 'Invalid name';
  if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Invalid email';
  if (typeof message !== 'string' || message.length < 10 || message.length > 2000) return 'Message must be 10-2000 characters';
  if (/(<script|javascript:|onclick|onerror)/i.test(message)) return 'Invalid content detected';
  return null;
}

router.post('/send', async (req, res) => {
  try {
    const ip = req.ip || req.headers['x-forwarded-for'] || 'anon';
    const now = Date.now();
    const entry = buckets.get(ip) || { count: 0, start: now };
    if (now - entry.start > RATE_LIMIT_WINDOW) {
      entry.count = 0;
      entry.start = now;
    }
    entry.count++;
    buckets.set(ip, entry);
    if (entry.count > MAX_PER_IP) {
      return res.status(429).json({ error: 'Too many messages. Please try again later.' });
    }

    const validationError = simpleSpamCheck(req.body);
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    const { name, email, message } = req.body;

    console.log(`[contact] New message from ${name} (${email})`);

    try {
      const logDir = new URL('../logs', import.meta.url).pathname;
      const fs = await import('fs/promises');
      const path = await import('path');
      await fs.mkdir(logDir, { recursive: true });
      const logLine = JSON.stringify({
        ts: new Date().toISOString(),
        name,
        email,
        message: message.slice(0, 500),
      }) + '\n';
      await fs.appendFile(path.join(logDir, 'contact_messages.jsonl'), logLine, 'utf8');
    } catch (logErr) {
      console.warn('[contact] Failed to log message:', logErr.message);
    }

    res.json({ success: true, message: 'Message received. I will get back to you soon.' });
  } catch (err) {
    console.error('[contact] Error:', err.message);
    res.status(500).json({ error: 'Server error. Please try again later.' });
  }
});

export default router;
