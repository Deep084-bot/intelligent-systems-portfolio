import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import aiRouter from './routes/ai.js';
import rateLimitMiddleware from './middleware/rateLimit.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '128kb' }));

// Basic in-memory rate limiting middleware
app.use(rateLimitMiddleware);

app.use('/api/ai', aiRouter);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`AI backend listening on port ${PORT}`);
});
