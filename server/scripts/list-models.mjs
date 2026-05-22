import 'dotenv/config';
import { GoogleGenerativeAI } from '@google/generative-ai';

const KEY = process.env.GEMINI_API_KEY;
if (!KEY) {
  console.error('GEMINI_API_KEY not set');
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(KEY);
try {
  const models = await genAI.listModels();
  console.log('Available Generative Models:');
  models.forEach((m, i) => {
    console.log(`${i+1}. ${m.name} (${m.baseModelId})`);
  });
} catch (err) {
  console.error('Error listing models:', err.message);
  process.exit(1);
}
