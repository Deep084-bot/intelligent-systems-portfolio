// DeepPet — command parser.
//
// Interpretation only. This module turns free text into a *proposed* action with
// validated arguments; it never executes anything. Execution is performed by
// actionRunner after the proposal has been validated and any confirmation
// policy applied.
//
// Only destinations in the world allowlist (worldRoutes.js) can ever be
// produced, and only the `navigate_to_world` action id is ever emitted. There is
// no path by which arbitrary text yields an arbitrary path or action.

import { ALIAS_INDEX, destinationList } from './worldRoutes'
import { NAVIGATE_ACTION_ID } from './petActions'

// Verbs that make a message read as a navigation request rather than small talk.
const TRIGGER = /\b(go|going|take|taking|bring|open|show|visit|navigate|head|let|lets|want|wanna|please|can|could|would)\b/

const PUNCT = /[^a-z0-9\s']/g

export function normalizeText(raw) {
  return String(raw || '')
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(PUNCT, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function listDestinations() {
  return destinationList()
}

// Returns a proposed action ({ actionId, args }) or null. A proposal is only
// produced when a known alias appears *and* the phrasing reads as a navigation
// request (a trigger verb is present, or the message is essentially the place
// name). Anything else — including unknown places and external URLs — yields
// null.
export function parseActionProposal(raw) {
  const text = normalizeText(raw)
  if (!text) return null

  const hit = ALIAS_INDEX.find(({ alias }) => text.includes(alias))
  if (!hit) return null

  const { alias, world } = hit
  const isBareMention = text === alias || text === `to ${alias}` || text === `the ${alias}`
  if (!isBareMention && !TRIGGER.test(text)) return null

  return { actionId: NAVIGATE_ACTION_ID, args: { world } }
}

// Heuristic: does this read as an attempt to go somewhere, even though no known
// destination matched? Used only to pick a friendlier reply — never to route.
export function looksLikeNavigation(raw) {
  const text = normalizeText(raw)
  if (!text) return false
  if (!TRIGGER.test(text)) return false
  return /\b(to|into|toward|towards)\b/.test(text) || /\b(open|visit|navigate|bring)\b/.test(text) || /\bgo\b/.test(text)
}
