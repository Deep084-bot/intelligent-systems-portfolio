import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { config } from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envResult = config({ path: resolve(__dirname, '.env') });

import express from 'express';
import cors from 'cors';
import aiRouter from './routes/ai.js';
import contactRouter from './routes/contact.js';
import leetcodeRouter from './routes/leetcode.js';
import rateLimitMiddleware from './middleware/rateLimit.js';

const app = express();

// Startup: log GROQ API key presence safely
try {
  const groqKey = process.env.GROQ_API_KEY || null;
  const present = !!groqKey;
  const prefix = groqKey ? groqKey.slice(0, 4) : null;
  const len = groqKey ? groqKey.length : 0;
  console.log(JSON.stringify({ event: 'startup_groq_key', loaded: present, key_prefix: prefix, key_length: len }));
} catch (e) {
  console.log(JSON.stringify({ event: 'startup_groq_key', loaded: false }));
}

app.set('trust proxy', 1);
app.use(cors());
app.use(express.json({ limit: '64kb' }));

app.use(rateLimitMiddleware);

app.use('/api/ai', aiRouter);
app.use('/api/contact', contactRouter);
app.use('/api/leetcode', leetcodeRouter);

// Global error handler — catches JSON parse failures and uncaught errors
app.use((err, _req, res, _next) => {
  const isJsonParse = err.type === 'entity.parse.failed' || err instanceof SyntaxError;
  res.status(isJsonParse ? 400 : 500).json({
    error: isJsonParse ? 'Invalid request body.' : 'Internal server error.',
  });
  console.error(JSON.stringify({
    event: 'express_error', type: isJsonParse ? 'bad_json' : 'uncaught',
    msg: err.message?.slice(0, 200),
  }));
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`AI backend listening on port ${PORT}`);
});
