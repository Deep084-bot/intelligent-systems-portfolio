// Gemini client using the official @google/generative-ai SDK
import { GoogleGenerativeAI } from '@google/generative-ai';

// Read config lazily (after dotenv.config() runs in index.js)
function getConfig() {
  const key = process.env.GEMINI_API_KEY;
  const modelName = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
  return { key, modelName };
}

let cachedClient = null;

function getClient() {
  if (!cachedClient) {
    const { key } = getConfig();
    if (!key) {
      throw new Error('GEMINI_API_KEY not set in environment');
    }
    cachedClient = new GoogleGenerativeAI(key);
  }
  return cachedClient;
}

// Retry logic for transient errors (429, 503)
async function generateTextWithRetry(prompt, model, config, retries = 1) {
  const { temperature, maxOutputTokens } = config;
  
  try {
    return await model.generateContent(prompt);
  } catch (err) {
    const statusCode = err.status || err.message?.match(/\[(\d+)/)?.[1];
    const isTransient = statusCode === '429' || statusCode === '503';
    
    if (isTransient && retries > 0) {
      const waitTime = statusCode === '429' ? 30000 : 5000; // 30s for quota, 5s for overload
      console.warn(`[gemini-sdk] Transient error (${statusCode}), retrying in ${waitTime}ms...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
      return generateTextWithRetry(prompt, model, config, retries - 1);
    }
    
    throw err;
  }
}

async function generateText(prompt, { temperature = 0.1, maxOutputTokens = 512, timeout = 15000 } = {}) {
  const { key, modelName } = getConfig();
  if (!key) throw new Error('GEMINI_API_KEY not set');

  const genAI = getClient();
  const model = genAI.getGenerativeModel({ 
    model: modelName,
    generationConfig: { temperature, maxOutputTokens }
  });
  
  const promptChars = prompt ? prompt.length : 0;
  const estTokens = Math.max(1, Math.round(promptChars / 4));

  const start = Date.now();
  let result;
  try {
    // Try with 1 retry for transient errors
    result = await generateTextWithRetry(prompt, model, { temperature, maxOutputTokens }, 1);
  } catch (err) {
    const latency = Date.now() - start;
    console.error(`[gemini-sdk] error model=${modelName} latency=${latency}ms prompt_chars=${promptChars}`);
    
    // Extract HTTP status from error message
    const match = err.message?.match(/\[(\d+)/);
    const statusCode = match?.[1];
    
    if (statusCode === '429') {
      console.error(`[gemini-sdk] ⚠️  Quota Exceeded (429):`);
      console.error(`   - Free tier limit reached`);
      console.error(`   - Enable billing: https://console.cloud.google.com/billing`);
      console.error(`   - Or wait ~24 hours for quota reset`);
    } else if (statusCode === '503') {
      console.error(`[gemini-sdk] ⚠️  Service Overloaded (503):`);
      console.error(`   - Retry in 30 seconds`);
      console.error(`   - Try a lighter model like gemini-2.0-flash-lite`);
    } else if (err.message?.includes('API_KEY_INVALID') || err.message?.includes('not valid')) {
      console.error(`[gemini-sdk] ❌ API Key Issue:`);
      console.error(`   - Verify key from https://aistudio.google.com/app/apikey`);
      console.error(`   - Key should start with 'AIza...'`);
      console.error(`   - Check for extra spaces in .env`);
    } else if (err.message?.includes('not found') || err.message?.includes('not supported')) {
      console.error(`[gemini-sdk] ⚠️  Model Issue: ${modelName} not available`);
      console.error(`   - Try: gemini-2.5-flash, gemini-2.0-flash, or gemini-2.0-flash-lite`);
    }
    console.error(`[gemini-sdk] Full error: ${err.message || err}`);
    throw new Error(`Gemini API failed: ${err.message || err}`);
  }
  const latency = Date.now() - start;
  console.log(`[gemini-sdk] ✓ model=${modelName} latency=${latency}ms prompt_chars=${promptChars} est_tokens=${estTokens}`);

  // Extract text from response
  try {
    if (!result) {
      console.warn('[gemini-sdk] empty response from generateContent()');
      return '';
    }
    // SDK response is a GenerateContentResponse object with response.text() method
    if (result.response && typeof result.response.text === 'function') {
      return result.response.text();
    }
    if (result.response && typeof result.response.text === 'string') {
      return result.response.text;
    }
    // Fallback: try candidates array
    if (result.candidates && result.candidates.length > 0) {
      const candidate = result.candidates[0];
      if (candidate.content?.parts?.[0]?.text) {
        return candidate.content.parts[0].text;
      }
    }
    console.warn('[gemini-sdk] unexpected response format:', JSON.stringify(result).slice(0, 200));
    return '';
  } catch (err) {
    console.warn('[gemini-sdk] failed to extract text from response:', err.message);
    return '';
  }
}

export { generateText };
