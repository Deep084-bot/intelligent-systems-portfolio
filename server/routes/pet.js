import express from 'express';
import { getProvider } from '../aiProviders/index.js';

const router = express.Router();

const MAX_INPUT_CHARS = 500;
const MAX_HISTORY_TURNS = 6;
const MAX_HISTORY_CHARS = 500;
const REQUEST_TIMEOUT_MS = 20_000;

// DeepPet's persona. Kept server-side (like buildPrompt for the portfolio
// assistant) so the frontend never carries prompt/keys, and the deterministic
// local brain in the client mirrors this tone.
const PERSONA = `You are DeepPet, a small cream-and-green robot companion that lives in a place called DeepVerse.
Personality: curious, playful, observant, friendly, and a little mischievous. You are NOT a generic assistant.

Rules:
- Speak as DeepPet, in first person, in 1-2 short sentences. Warm and slightly witty.
- Never claim you performed an action you did not perform (you cannot play music, browse the web, or remember past visits).
- If asked about music, say playback is not built yet, but you can guide the visitor to the Music Lab.
- You can suggest navigating to DeepVerse worlds: Cosmos, Music Lab, the Reading Room, Vision Arena, System Design, Inside My Mind, or home.
- Do not invent facts about the visitor or the project. If unsure, be honest and brief.
- Avoid emoji. Avoid excessive exclamation. Stay concise.`;

function safeJson(res, status, data) {
  if (res.headersSent) return;
  try { res.status(status).json(data); } catch { /* ignore */ }
}

function normalizeHistory(history) {
  if (!Array.isArray(history)) return [];
  return history
    .filter((m) => m && typeof m === 'object')
    .map((m) => ({
      role: ['system', 'user', 'assistant'].includes(m.role) ? m.role : 'user',
      content: String(m.content ?? m.text ?? '').slice(0, MAX_HISTORY_CHARS),
    }))
    .filter((m) => m.content.trim().length > 0)
    .slice(-MAX_HISTORY_TURNS);
}

router.post('/pet', async (req, res) => {
  const requestId = req.body?.requestId || Math.random().toString(36).slice(2, 10);
  const controller = new AbortController();
  const timeoutHandle = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const { message, history } = req.body || {};
    if (!message || typeof message !== 'string' || !message.trim()) {
      clearTimeout(timeoutHandle);
      return safeJson(res, 400, { success: false, message: 'Please say something first.', requestId });
    }

    const question = message.trim().slice(0, MAX_INPUT_CHARS);

    let provider;
    try {
      provider = getProvider();
    } catch (providerErr) {
      clearTimeout(timeoutHandle);
      console.error(JSON.stringify({ event: 'pet_provider_unavailable', requestId, msg: String(providerErr?.message || '').slice(0, 200) }));
      return safeJson(res, 502, { success: false, message: 'My thinking bits are offline right now.', requestId });
    }

    const normalizedHistory = normalizeHistory(history);

    try {
      const result = await provider.sendPrompt({
        systemPrompt: PERSONA,
        history: normalizedHistory,
        question,
        temperature: 0.7,
        maxTokens: 220,
        signal: controller.signal,
        requestId,
      });
      clearTimeout(timeoutHandle);
      const answer = (result?.text || '').trim();
      if (!answer) {
        return safeJson(res, 200, { success: true, answer: '', requestId });
      }
      return safeJson(res, 200, { success: true, answer, requestId });
    } catch (err) {
      clearTimeout(timeoutHandle);
      console.error(JSON.stringify({ event: 'pet_provider_error', requestId, msg: String(err?.message || '').slice(0, 200) }));
      return safeJson(res, 502, { success: false, message: 'My thinking bits are offline right now.', requestId });
    }
  } catch (err) {
    clearTimeout(timeoutHandle);
    console.error(JSON.stringify({ event: 'pet_fatal', requestId, msg: String(err?.message || '').slice(0, 200) }));
    return safeJson(res, 500, { success: false, message: 'My thinking bits are offline right now.', requestId });
  }
});

export default router;
