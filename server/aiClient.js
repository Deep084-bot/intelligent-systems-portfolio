import buildContext from './contextBuilder.js';
import { getProvider, listProviders } from './aiProviders/index.js';
import cache from './cache.js';

const PRIMARY = process.env.AI_PROVIDER || 'gemini';
const FALLBACKS = listProviders().filter(p => p !== PRIMARY);

function normalizeKey(str) { return str.trim().toLowerCase(); }

export async function sendAIRequest({ category = 'general', userQuery = '', systemPrompt = '', concise = true, maxTokens = 512 } = {}) {
  const ctx = await buildContext({ category, query: userQuery });

  // Compose compact prompt: reduce verbosity and include provenance markers only
  const promptParts = [];
  if (systemPrompt) promptParts.push('[SYSTEM] ' + systemPrompt.trim());
  promptParts.push('[CONTEXT] ' + ctx);
  promptParts.push('[USER] ' + userQuery.trim());
  if (concise) promptParts.push('[CONSTRAINT] Keep answer < 150 words. Be concise.');
  const finalPrompt = promptParts.join('\n\n');

  // Log prompt size
  try { await cache.set(`promptsize:${Date.now()}`, { len: finalPrompt.length, category }, 60); } catch (e) {}
  console.log(`[aiClient] Prompt size: ${finalPrompt.length} chars, category: ${category}`);

  // Response cache: allow quick answers for repeated identical queries
  const cacheKey = `resp:${normalizeKey(category)}:${normalizeKey(userQuery)}`;
  const cached = await cache.get(cacheKey);
  if (cached) {
    console.log('[aiClient] response cache hit');
    return { ...cached, cached: true };
  }

  // Try primary provider, with graceful fallback
  const tried = [];
  const providersToTry = [PRIMARY, ...FALLBACKS];
  let lastErr = null;
  for (const name of providersToTry) {
    const provider = getProvider(name);
    tried.push(name);
    try {
      const res = await provider.sendPrompt({ prompt: finalPrompt, maxTokens });
      // store lightweight cache (short ttl)
      await cache.set(cacheKey, { text: res.text, provider: res.provider }, 60 * 3);
      return { text: res.text, provider: res.provider, tokensUsed: res.tokensUsed, tried };
    } catch (err) {
      console.warn(`[aiClient] provider ${name} failed: ${err.message}`);
      lastErr = err;
      continue; // try next
    }
  }

  throw new Error(`All providers failed. Last error: ${lastErr?.message || 'unknown'}`);
}
