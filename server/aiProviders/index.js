import createGeminiProvider from './gemini.js';
import createGroqProvider from './groq.js';

const PROVIDERS = {
  gemini: createGeminiProvider,
  groq: createGroqProvider
};

export function getProvider(name = process.env.AI_PROVIDER || 'groq') {
  const factory = PROVIDERS[name];
  if (!factory) throw new Error(`Unknown AI provider: ${name}`);

  const envKeyName = `${name.toUpperCase()}_API_KEY`;
  const apiKey = process.env[envKeyName] || null;

  // CRITICAL: Reject disabled providers with clear error
  if (!apiKey) {
    throw new Error(`AI provider "${name}" is not configured. Set ${envKeyName} environment variable.`);
  }

  // Log provider selection for debugging
  console.log({
    event: 'provider_init',
    provider: name,
    groqConfigured: !!process.env.GROQ_API_KEY,
    geminiConfigured: !!process.env.GEMINI_API_KEY,
  });

  return factory({ apiKey, name });
}

export function listProviders() { return Object.keys(PROVIDERS); }

