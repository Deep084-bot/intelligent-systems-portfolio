import express from 'express';
import cors from 'cors';
import aiRouter from './routes/ai.js';
import petRouter from './routes/pet.js';
import contactRouter from './routes/contact.js';
import leetcodeRouter from './routes/leetcode.js';
import projectsRouter from './routes/projects.js';
import memoryRouter from './routes/memory.js';
import rateLimitMiddleware from './middleware/rateLimit.js';

const app = express();

// Startup: log provider credential PRESENCE only. Never log any part of the
// key (a prefix or length is credential-derived metadata and must not leak).
console.log(JSON.stringify({
  event: 'startup_ai_provider',
  groqConfigured: !!process.env.GROQ_API_KEY,
  geminiConfigured: !!process.env.GEMINI_API_KEY,
}));

app.set('trust proxy', 1);
app.use(cors());
app.use(express.json({ limit: '64kb' }));

app.use(rateLimitMiddleware);

app.use('/api/ai', aiRouter);
app.use('/api/ai', petRouter);
app.use('/api/contact', contactRouter);
app.use('/api/leetcode', leetcodeRouter);
app.use('/api/projects', projectsRouter);
app.use('/api/memory', memoryRouter);

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

// Export for Vercel serverless
export default app;

// Only listen directly when not running on Vercel
if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 4000;
  app.listen(PORT, () => {
    console.log(`AI backend listening on port ${PORT}`);
  });
}
