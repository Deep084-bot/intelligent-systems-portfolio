// Groq provider integration. Uses GROQ_API_KEY and GROQ_MODEL (optional).
import fetch from 'node-fetch';

const DEFAULT_MODEL = process.env.GROQ_MODEL || 'llama-3.1-8b-instant';
const ALT_MODEL = 'llama-3.3-70b-versatile';

function normalizeResp(raw) {
  if (!raw) return { text: '', tokensUsed: 0, raw };
  if (typeof raw === 'string') return { text: raw, tokensUsed: Math.round(raw.length / 4), raw };
  // Prefer OpenAI-compatible chat completion shape: choices[0].message.content
  if (raw.choices && raw.choices.length && raw.choices[0].message && typeof raw.choices[0].message.content === 'string') {
    const text = raw.choices[0].message.content;
    return { text, tokensUsed: raw.usage?.total_tokens || Math.round(text.length / 4), raw };
  }
  // Fallbacks for other provider shapes
  if (raw.output) {
    const text = Array.isArray(raw.output) ? raw.output.map(o => o.text || JSON.stringify(o)).join('\n') : String(raw.output);
    return { text, tokensUsed: raw.usage?.total_tokens || Math.round(text.length / 4), raw };
  }
  if (raw.generated_text) {
    const text = String(raw.generated_text);
    return { text, tokensUsed: raw.usage?.total_tokens || Math.round(text.length / 4), raw };
  }
  return { text: JSON.stringify(raw), tokensUsed: Math.round(JSON.stringify(raw).length / 4), raw };
}

export default function createGroqProvider({ apiKey = null, name = 'groq' } = {}) {
  async function sendPrompt({ prompt, maxTokens = 512, temperature = 0.2, model } = {}) {
    const useModel = model || process.env.GROQ_MODEL || DEFAULT_MODEL;
    const apiPresent = !!apiKey;
    // Safe debug logs (no secrets)
    try { console.debug(`[groq-provider] model=${useModel} apiPresent=${apiPresent} endpoint=${process.env.GROQ_ENDPOINT || 'https://api.groq.com/openai/v1/chat/completions'}`); } catch(e){}

    if (!apiPresent) {
      try { console.debug('[groq-provider] using mock response path'); } catch (e) {}
      return { text: `[MOCK GROQ:${useModel}] ${prompt.slice(0,200)}...`, tokensUsed: Math.round(prompt.length / 4), provider: 'groq', model: useModel, raw: null, mocked: true };
    }

    try {
      const endpoint = process.env.GROQ_ENDPOINT || 'https://api.groq.com/openai/v1/chat/completions';
      const payload = {
        model: useModel,
        messages: [ { role: "user", content: prompt } ],
        temperature: temperature,
        max_tokens: maxTokens
      };

      // Log non-sensitive request metadata
      try { console.debug(`[groq-provider] sending request model=${useModel} endpoint=${endpoint} payloadSize=${JSON.stringify(payload).length}`); } catch (e) {}
      const start = Date.now();
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload),
        timeout: 30_000
      });
      const latency = Date.now() - start;
      let j;
      try { j = await res.json(); } catch (e) { j = await res.text(); }
      try { console.debug(`[groq-provider] response status=${res.status} latencyMs=${latency}`); } catch (e) {}
      // Temporary debug: confirm final endpoint, provider, model, and success
      try { console.debug(`[groq-provider-debug] endpoint=${endpoint} provider=groq model=${useModel} success=${res.ok}`); } catch (e) {}

      const normalized = normalizeResp(j);
      return { text: normalized.text, tokensUsed: normalized.tokensUsed, provider: 'groq', model: useModel, raw: j, latencyMs: latency };
    } catch (err) {
      try { console.warn('[groq-provider] live request failed, error=', err.message || err); } catch (e) {}
      throw new Error(`Groq provider error: ${err.message}`);
    }
  }

  return { sendPrompt };
}
