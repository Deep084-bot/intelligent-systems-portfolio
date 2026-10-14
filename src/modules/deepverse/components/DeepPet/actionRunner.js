// DeepPet — action execution boundary.
//
// Takes a *proposal* produced by the parser, applies the confirmation policy,
// then runs it through the registry. This is the only place a proposal becomes
// an effect. Kept separate from parsing and from the registry core so each layer
// has one responsibility.

import { runAction, getAction, ACTION_STATUS } from './actionRegistry'

// A proposal object is marked once executed. Re-running the exact same proposal
// (a double click, a repeated Enter, a confirmation resolved twice) is refused
// rather than executed a second time.
const executed = new WeakSet()

function rejected(actionId, errorCode, status = ACTION_STATUS.REJECTED) {
  return { ok: false, actionId: actionId || null, status, message: '', errorCode, data: null }
}

export async function executeProposal(proposal, { navigate, confirm, signal } = {}) {
  if (!proposal || typeof proposal.actionId !== 'string') {
    return rejected(null, 'NO_ACTION')
  }

  const action = getAction(proposal.actionId)
  if (!action) {
    return rejected(proposal.actionId, 'UNKNOWN_ACTION')
  }

  if (executed.has(proposal)) {
    return rejected(proposal.actionId, 'ALREADY_EXECUTED', ACTION_STATUS.DUPLICATE)
  }

  if (action.requiresConfirmation) {
    let approved = false
    try {
      approved = confirm ? await confirm(proposal) : false
    } catch {
      approved = false
    }
    if (!approved) {
      return rejected(proposal.actionId, 'CANCELLED', ACTION_STATUS.CANCELLED)
    }
  }

  // Mark before awaiting so two concurrent calls on the same proposal cannot
  // both reach the handler.
  executed.add(proposal)

  return runAction(proposal.actionId, proposal.args, { navigate, signal })
}
