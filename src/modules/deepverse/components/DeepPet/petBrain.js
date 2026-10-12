// DeepPet — conversation orchestrator.
//
// One entry point, three resolution paths, all returning the same shape so the
// UI never needs to know which brain answered:
//
//   1. a validated navigation proposal -> { kind: 'action', proposal, text, … }
//   2. a reachable AI provider          -> { kind: 'ai', text, reaction, intent }
//   3. the deterministic persona        -> { kind: 'local', text, reaction, intent }
//
// The AI may shape a *reply*, but it can never produce an action: proposals come
// only from the deterministic parser, and even a proposal is validated against
// the registry before it is surfaced. AI text is treated as plain display text.

import { parseActionProposal, looksLikeNavigation } from './petCommands'
import {
  localReply,
  preActionLine,
  actionUnsupportedLine,
  reactionForIntent,
} from './petPersona'
import { getAction, validateActionArgs } from './actionRegistry'
import { ensurePetActions } from './petActions'
import { petChat } from '../../../../api/ai'

// Register the built-in actions on first import so proposals always have a
// handler to validate against. Idempotent.
ensurePetActions()

export const REPLY_KIND = {
  ACTION: 'action',
  AI: 'ai',
  LOCAL: 'local',
}

const AI_HISTORY_TURNS = 6

function toHistory(history) {
  if (!Array.isArray(history)) return []
  return history
    .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.text === 'string')
    .slice(-AI_HISTORY_TURNS)
    .map((m) => ({ role: m.role, content: m.text.slice(0, 500) }))
}

// Resolve one user message into a reply. Never throws: any AI failure degrades
// to the deterministic persona.
export async function getReply(message, { history = [], aiEnabled = false, signal } = {}) {
  const text = String(message || '').trim()
  if (!text) return { kind: REPLY_KIND.LOCAL, text: '', reaction: 'greet', intent: 'empty' }

  // Interpretation + validation only. The proposal is never executed here.
  const proposal = parseActionProposal(text)
  if (proposal) {
    const check = validateActionArgs(proposal.actionId, proposal.args)
    if (check.ok && getAction(proposal.actionId)) {
      return {
        kind: REPLY_KIND.ACTION,
        proposal,
        text: preActionLine(proposal.args.world),
        reaction: 'greet',
        intent: 'action',
      }
    }
    // Recognised as a navigation attempt but the registry cannot run it.
    return {
      kind: REPLY_KIND.LOCAL,
      text: actionUnsupportedLine(),
      reaction: 'greet',
      intent: 'action_invalid',
      errorCode: check.errorCode,
    }
  }

  if (aiEnabled) {
    try {
      const result = await petChat(text, toHistory(history), signal)
      const answer = typeof result?.answer === 'string' ? result.answer.trim() : ''
      if (answer) {
        // AI output is display text only — it is never parsed for actions.
        return { kind: REPLY_KIND.AI, text: answer, reaction: 'greet', intent: 'ai' }
      }
    } catch (err) {
      // swallow — fall through to the local persona
      void err
    }
  }

  const local = localReply(text, { flags: { navigational: looksLikeNavigation(text) } })
  return { kind: REPLY_KIND.LOCAL, ...local }
}

export { reactionForIntent }
