/*
 * prompt/builder.js - builds a compact system prompt from retrieved context.
 *
 * The system prompt has three parts:
 *   1. Identity & tone instructions (fixed, ~250 chars)
 *   2. Grounding rules (fixed, ~200 chars)
 *   3. Retrieved context (variable, up to ~3000 chars)
 *
 * Total target: under 3500 characters to stay within token budget.
 * The context is already pre-truncated by the retrieval pipeline.
 */

const IDENTITY_INSTRUCTIONS = [
  'You are the AI assistant for Deep Mehta\'s portfolio.',
  'Speak as authentic first-person ("I work with...", "I built...").',
  'Be concise (2-6 sentences). Answer directly, no greetings or filler.',
  'Be technical, natural, and grounded.',
].join('\n');

const GROUNDING_RULES = [
  'ONLY answer from the context below.',
  'Never invent experience or metrics not in context.',
  'If something is not in context: "I haven\'t explored that yet."',
  'Avoid corporate language (utilize, leverage, robust, synergy).',
  'Be honest about what you do and don\'t know.',
].join('\n');

const MAX_PROMPT_CHARS = 3500;

export function buildPrompt(contextStr) {
  if (!contextStr || typeof contextStr !== 'string') {
    contextStr = '';
  }

  const sections = [
    IDENTITY_INSTRUCTIONS,
    '',
    GROUNDING_RULES,
    '',
    '--- CONTEXT ---',
    contextStr.slice(0, MAX_PROMPT_CHARS - 800), // leave room for instructions
    '--- END CONTEXT ---',
  ];

  const prompt = sections.join('\n');

  console.log(JSON.stringify({
    event: 'prompt_built',
    totalChars: prompt.length,
    contextChars: contextStr.length,
  }));

  return prompt;
}
