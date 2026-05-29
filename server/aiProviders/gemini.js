import fetch from 'node-fetch';

const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta';

export default function createGeminiProvider({ apiKey }) {
  async function sendPrompt({ systemPrompt, question, prompt, maxTokens = 512, temperature = 0.2, model } = {}) {
    // Defensive: use question + systemPrompt or fallback to prompt parameter
    const finalPrompt = question ? `${systemPrompt}\n\nQuestion: ${question}` : (prompt || '');

    if (!apiKey) {
      // Safe guard: if no API key, return error instead of attempting mock
      throw new Error('Gemini provider is disabled (no GEMINI_API_KEY configured). Use Groq instead.');
    }

    if (!finalPrompt) {
      throw new Error('No prompt provided to Gemini provider');
    }

    const useModel = model || process.env.GEMINI_MODEL || 'gemini-2.0-flash';
    try {
      const url = `${GEMINI_API_BASE}/models/${useModel}:generateContent?key=${apiKey}`;
      const payload = {
        contents: [{ parts: [{ text: finalPrompt }] }],
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
      if (!text) {
        throw new Error('Gemini returned empty response');
      }

      return { text, tokensUsed: Math.round(text.length / 4), provider: 'gemini', raw };
    } catch (err) {
      throw new Error(`Gemini provider error: ${err.message}`);
    }
  }

  return { sendPrompt };
}

