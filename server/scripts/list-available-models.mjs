import 'dotenv/config';
import { GoogleGenerativeAI } from '@google/generative-ai';

const KEY = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(KEY);

console.log('Attempting to list available models...\n');

try {
  const response = await genAI.listModels();
  console.log('Available models:');
  for await (const model of response) {
    console.log(`  • ${model.name}`);
    console.log(`    Display Name: ${model.displayName}`);
    if (model.supportedGenerationMethods) {
      console.log(`    Supports: ${model.supportedGenerationMethods.join(', ')}`);
    }
    console.log();
  }
} catch (err) {
  console.error('Error listing models:', err.message);
  console.log('\nNote: If listModels() is not available, try these hardcoded model names:');
  console.log('  • gemini-1.5-pro');
  console.log('  • gemini-1.5-flash');
  console.log('  • gemini-pro');
  console.log('  • gemini-pro-vision');
}
