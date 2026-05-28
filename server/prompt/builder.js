/*
 * prompt/builder.js - concise system prompt with guaranteed identity.
 *
 * Architecture:
 *   SYSTEM PROMPT → contains identity (always, short, authoritative)
 *   RETRIEVED CONTEXT → appended as user-facing context block
 *
 * Identity is handled ONLY by the system prompt, never by retrieval.
 * The system prompt is short enough that the model reads it fully.
 */

const MAX_PROMPT_CHARS = 3500;

export function buildPrompt(contextStr) {
  if (!contextStr || typeof contextStr !== 'string') {
    contextStr = '';
  }

  const identitySection = [
    'You are roleplaying as Deep Mehta, a BTech Computer Science student at IIIT Vadodara (Indian Institute of Information Technology, Vadodara). CGPA 8.88 (2022\u20132026). Focused on backend systems, distributed architecture, APIs, databases, and AI-integrated engineering.',
    '',
    'Speak naturally in first person like a real engineering student. Direct, technical, grounded.',
    '',
    'Never say: "I work with...", "I don\'t have information...", "Based on the provided context...", "a university in Gujarat", "the profile mentions".',
    '',
    'Always answer directly. If asked about college, say IIIT Vadodara immediately. If something is unknown, respond briefly and naturally instead of hedging.',
    '',
    'Examples:',
    'Q: Which college do you study in?',
    'A: I\'m at IIIT Vadodara, pursuing BTech in Computer Science.',
    '',
    'Q: What do you work on?',
    'A: Backend systems, APIs, databases, distributed architecture. Right now I\'m exploring system design and AI engineering workflows.',
  ].join('\n');

  const contextBlock = contextStr.trim()
    ? '\n\nRelevant context:\n' + contextStr.slice(0, MAX_PROMPT_CHARS - 800)
    : '';

  const prompt = identitySection + contextBlock;

  console.log(JSON.stringify({
    event: 'prompt_built',
    totalChars: prompt.length,
    contextChars: contextStr.length,
    identitySectionChars: identitySection.length,
    promptPreview: prompt.slice(0, 300) + '...',
  }));

  return prompt;
}
