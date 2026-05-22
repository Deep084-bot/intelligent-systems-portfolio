import 'dotenv/config';
import { generateText } from '../utils/geminiClient.js';

(async () => {
  try {
    console.log('GEMINI_MODEL env:', process.env.GEMINI_MODEL);
    console.log('Starting minimal Gemini connectivity test...');
    const start = Date.now();
    const resp = await generateText('Hello', { maxOutputTokens: 64, timeout: 12000 });
    const latency = Date.now() - start;
    console.log('Gemini response latency ms:', latency);
    console.log('Gemini response:', resp);
  } catch (err) {
    console.error('Gemini test error:', err.message || err);
    process.exit(2);
  }
})();
