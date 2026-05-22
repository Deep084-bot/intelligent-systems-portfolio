import express from 'express';
import buildContext from '../contextBuilder.js';
import { generateText } from '../utils/geminiClient.js';

const router = express.Router();

// Core prompt template — instruct model voice, constraints, and format
function buildPrompt(userQuestion, recentMessages = []) {
  const systemInstructions = `You are a concise, technically-minded engineering portfolio assistant representing the author of this portfolio. Answer questions about projects, technical skills, engineering interests, learning journey, achievements, and design decisions using ONLY the supplied CONTEXT. Be professional, specific, and recruiter-friendly. Avoid AI disclaimers, avoid inventing facts not present in CONTEXT. If asked for opinion or future plans, label them clearly as the author's perspective. Keep answers concise (3-6 sentences) unless asked for details. Use code blocks for short code examples when appropriate.`;

  const contextSectionHeader = '\n\n--- CONTEXT (do not hallucinate beyond this) ---\n\n';

  const contextPlaceholder = '{CONTEXT}';

  // Include recent conversation for continuity
  const convo = recentMessages.length ? '\n\nConversation history:\n' + recentMessages.map(m => `${m.role}: ${m.text}`).join('\n') : '';

  return `${systemInstructions}${contextSectionHeader}${contextPlaceholder}${convo}\n\nUser: ${userQuestion}\nAssistant:`;
}

router.post('/chat', async (req, res) => {
  try {
    const { question, history } = req.body || {};
    if (!question || typeof question !== 'string') return res.status(400).json({ error: 'Missing question' });

    const context = await buildContext();
    const rawPrompt = buildPrompt(question, history || []);
    const prompt = rawPrompt.replace('{CONTEXT}', context);

    // Call Gemini
    const answer = await generateText(prompt, { temperature: 0.05, maxOutputTokens: 512 });

    res.json({ answer });
  } catch (err) {
    console.error('AI route error:', err);
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

export default router;
