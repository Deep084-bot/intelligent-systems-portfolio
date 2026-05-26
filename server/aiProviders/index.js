import createGeminiProvider from './gemini.js';
import createGroqProvider from './groq.js';

const PROVIDERS = {
  gemini: createGeminiProvider,
  groq: createGroqProvider
};

export function getProvider(name = process.env.AI_PROVIDER || 'gemini') {
  const factory = PROVIDERS[name];
  if (!factory) throw new Error(`Unknown AI provider: ${name}`);
  const envKeyName = `${name.toUpperCase()}_API_KEY`;
  const apiKey = process.env[envKeyName] || null;
  // Safe debug: log provider selection and whether API key exists (boolean only)
  try {
    console.debug(`[aiProviders] provider selected=${name} apiKeyPresent=${!!apiKey}`);
  } catch (e) {}
  return factory({ apiKey, name });
}

export function listProviders() { return Object.keys(PROVIDERS); }
