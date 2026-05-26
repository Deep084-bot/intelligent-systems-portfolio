import fetch from 'node-fetch';

const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta';

export default function createGeminiProvider({ apiKey }) {
  async function sendPrompt({ prompt, maxTokens = 512, temperature = 0.2, model } = {}) {
    if (!apiKey) {
      return { text: `[MOCK GEMINI] ${prompt.slice(0, 200)}...`, tokensUsed: Math.round(prompt.length / 4), provider: 'gemini', raw: null };
    }

    const useModel = model || process.env.GEMINI_MODEL || 'gemini-2.0-flash';
    try {
      const url = `${GEMINI_API_BASE}/models/${useModel}:generateContent?key=${apiKey}`;
      const payload = {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature,
          maxOutputTokens: maxTokens,
        },
      };

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        timeout: 30_000,
      });

      const raw = await res.json();

      if (!res.ok) {
        const errMsg = raw?.error?.message || `HTTP ${res.status}`;
        throw new Error(`Gemini API error: ${errMsg}`);
      }

      const text = raw?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      return { text, tokensUsed: Math.round(text.length / 4), provider: 'gemini', raw };
    } catch (err) {
      throw new Error(`Gemini provider error: ${err.message}`);
    }
  }

  return { sendPrompt };
}
