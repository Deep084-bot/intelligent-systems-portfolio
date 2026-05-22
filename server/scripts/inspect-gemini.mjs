import 'dotenv/config';
import { GoogleGenerativeAI } from '@google/generative-ai';

const KEY = process.env.GEMINI_API_KEY;
const MODEL_NAME = process.env.GEMINI_MODEL || 'gemini-1.5-flash';

const genAI = new GoogleGenerativeAI(KEY);
const model = genAI.getGenerativeModel({ model: MODEL_NAME });

console.log('Model keys:', Object.keys(model));
for (const k of Object.keys(model)) {
  try { console.log(k, typeof model[k]); } catch(e) {}
}

if (model && typeof model.generateContent === 'function') {
  console.log('generateContent is function, arity:', model.generateContent.length);
  try { console.log('generateContent source:', model.generateContent.toString().slice(0,2000)); } catch(e) {}
} else {
  console.log('generateContent not a function');
}

if (genAI) console.log('genAI methods:', Object.keys(genAI).slice(0,20));
