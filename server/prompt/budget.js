/*
 * prompt/budget.js - the single explicit context budget for the assistant.
 *
 * Every consumer (retrieval, memory assembly, prompt builder, chat route) reads
 * its ceiling from here so the final system prompt cannot grow without bound and
 * the pieces cannot silently crowd each other out. Character counts are used as
 * a cheap, provider-agnostic proxy for tokens.
 */

export const CONTEXT_BUDGET = Object.freeze({
  // Absolute ceiling for the assembled system prompt
  // (identity + behavior + directives + memory + portfolio).
  maxPromptChars: 4500,

  // The fixed identity section is authoritative; reserve room for it first.
  identityReserve: 1000,

  // Always-on behavior/scope contract (scope, recall honesty, safety, format).
  behaviorChars: 1300,

  // Per-question directive (e.g. the DSA language default/override).
  scopeDirectivesChars: 220,

  // Persistent memory (profile facts + the matched project + conversation context).
  memoryChars: 1200,

  // Static retrieved portfolio context.
  portfolioContextChars: 2200,

  // Recent conversation history passed through to the provider.
  historyMessages: 6,
  historyTotalChars: 3000,
  historyMessageChars: 1200,

  // Rolling conversation summary (P4): the compacted narrative of earlier turns.
  // It is rendered inside the memory block, so it also competes for `memoryChars`.
  conversationSummaryChars: 800,

  // Recent verbatim turns loaded from a persisted conversation (P4). Aligned with
  // `historyMessages` so the two paths pick comparable amounts of context.
  conversationRecentTurns: 6,
});

export default CONTEXT_BUDGET;
