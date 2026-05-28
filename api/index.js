// Vercel serverless entry — re-export the Express app
// Vercel handles all routes defined in vercel.json rewrites
import app from '../server/index.js';
export default app;
