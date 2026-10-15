/*
 * history.js - pure helper for selecting prior conversation turns to send with
 * a chat request.
 *
 * The current question is always transmitted separately as the request's
 * `question`, so it must never also appear in `history`. Keeping this logic
 * dependency-free makes the "no duplicate current turn" invariant directly
 * testable.
 */

export const MAX_HISTORY_MESSAGES = 6;

export function buildRequestHistory(messages, text, limit = MAX_HISTORY_MESSAGES) {
  const list = (Array.isArray(messages) ? messages : [])
    .filter((m) => m && (m.role === 'user' || (m.role === 'assistant' && m.text)))
    .slice(-limit);

  // Drop a trailing user turn equal to the current question. This covers normal
  // sends (defensive) and retry, which resends the last user turn.
  const last = list[list.length - 1];
  if (last && last.role === 'user' && last.text === text) return list.slice(0, -1);
  return list;
}

export default buildRequestHistory;
