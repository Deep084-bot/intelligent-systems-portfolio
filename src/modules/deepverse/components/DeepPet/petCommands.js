// DeepPet — command parser.
//
// Interpretation only. This module turns free text into a *proposed* action with
// validated arguments; it never executes anything. Execution is performed by
// actionRunner after the proposal has been validated and any confirmation
// policy applied.
//
// Only destinations in the world allowlist (worldRoutes.js) can ever be
// produced, and only known action ids are ever emitted. There is no path by
// which arbitrary text yields an arbitrary path or action.

import { ALIAS_INDEX, destinationList } from './worldRoutes'
import { NAVIGATE_ACTION_ID } from './petActions'
import { PLAY_TRACK_ACTION_ID, PAUSE_PLAYBACK_ACTION_ID, RESUME_PLAYBACK_ACTION_ID, NEXT_TRACK_ACTION_ID, SET_VOLUME_ACTION_ID } from './petMusicActions'

// Verbs that make a message read as a navigation request rather than small talk.
const TRIGGER = /\b(go|going|take|taking|bring|open|show|visit|navigate|head|let|lets|want|wanna|please|can|could|would)\b/

const PUNCT = /[^a-z0-9\s']/g

// Words that mark a message as being about music playback rather than a place.
const MUSICISH = /\b(music|song|songs|track|tracks|playback|tune|audio|playlist|volume)\b/

// If any of these appear, the message is about *going to* the Music Lab, never
// about starting playback there.
const NAV_GUARD = /\b(music lab|music room|air guitar|guitar)\b/

// Deterministic preset resolution: explicit names first, then mood words. Each
// entry is [phrase, presetId]; longest phrase wins so "night drive" beats
// "drive" and "focus mode" beats "focus".
const PRESET_PHRASES = [
  ['cosmic drift', 'cosmic-drift'],
  ['night drive', 'night-drive'],
  ['focus mode', 'focus-mode'],
  ['greenhouse', 'greenhouse'],
  ['cosmic', 'cosmic-drift'],
  ['drift', 'cosmic-drift'],
  ['ambient', 'cosmic-drift'],
  ['ambience', 'cosmic-drift'],
  ['spacious', 'cosmic-drift'],
  ['relaxing', 'cosmic-drift'],
  ['relax', 'cosmic-drift'],
  ['calm', 'cosmic-drift'],
  ['chill', 'cosmic-drift'],
  ['space', 'cosmic-drift'],
  ['warm', 'greenhouse'],
  ['gentle', 'greenhouse'],
  ['soft', 'greenhouse'],
  ['cozy', 'greenhouse'],
  ['night', 'night-drive'],
  ['drive', 'night-drive'],
  ['driving', 'night-drive'],
  ['energetic', 'night-drive'],
  ['energy', 'night-drive'],
  ['rhythmic', 'night-drive'],
  ['rhythm', 'night-drive'],
  ['synth', 'night-drive'],
  ['beat', 'night-drive'],
  ['upbeat', 'night-drive'],
  ['focus', 'focus-mode'],
  ['concentrate', 'focus-mode'],
  ['concentration', 'focus-mode'],
  ['study', 'focus-mode'],
  ['productivity', 'focus-mode'],
  ['restrained', 'focus-mode'],
  ['quiet', 'focus-mode'],
].sort((a, b) => b[0].length - a[0].length)

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
// null. Music playback commands are recognised first (they are explicit verbs),
// but only when they are clearly not a request to visit the Music Lab.
export function parseActionProposal(raw) {
  const text = normalizeText(raw)
  if (!text) return null

  const music = parseMusicProposal(text)
  if (music) return music

  const hit = ALIAS_INDEX.find(({ alias }) => text.includes(alias))
  if (!hit) return null

  const { alias, world } = hit
  const isBareMention = text === alias || text === `to ${alias}` || text === `the ${alias}`
  if (!isBareMention && !TRIGGER.test(text)) return null

  return { actionId: NAVIGATE_ACTION_ID, args: { world } }
}

// Deterministic music command parser. Takes already-normalized text. Returns a
// music proposal or null. Never invents a preset id: play targets are resolved
// only to known preset ids, volume only to a documented [0, 1] level.
export function parseMusicProposal(text) {
  if (!text) return null

  const volume = parseVolume(text)
  if (volume) return volume

  const musicish = MUSICISH.test(text)

  if (/\b(pause)\b/.test(text) && (musicish || /\bpause (it|this|that)\b/.test(text) || text === 'pause')) {
    return { actionId: PAUSE_PLAYBACK_ACTION_ID, args: {} }
  }

  if (
    (/\b(resume|unpause)\b/.test(text) && (musicish || /\b(resume|unpause)\b/.test(text))) ||
    /\bplay again\b/.test(text) ||
    (/\bcontinue\b/.test(text) && musicish)
  ) {
    return { actionId: RESUME_PLAYBACK_ACTION_ID, args: {} }
  }

  if (/\b(next|skip)\b/.test(text) && (musicish || /\b(next|skip)\b\s*(one|it|track|song)?/.test(text))) {
    return { actionId: NEXT_TRACK_ACTION_ID, args: {} }
  }

  if (/\b(stop|turn off|shut off)\b/.test(text) && musicish && !NAV_GUARD.test(text)) {
    return { actionId: PAUSE_PLAYBACK_ACTION_ID, args: {} }
  }

  if (/\b(play|put on|start)\b/.test(text) && !NAV_GUARD.test(text)) {
    const target = resolvePreset(text)
    if (target) return { actionId: PLAY_TRACK_ACTION_ID, args: { track: target } }
    if (musicish || /\b(something|anything)\b/.test(text)) {
      return { actionId: PLAY_TRACK_ACTION_ID, args: { track: 'cosmic-drift' } }
    }
  }

  return null
}

function resolvePreset(text) {
  const hit = PRESET_PHRASES.find(([phrase]) => text.includes(phrase))
  return hit ? hit[1] : null
}

function parseVolume(text) {
  const m = text.match(/\bvolume\b\s*(?:to|at|is)?\s*(\d{1,3})/)
  if (m) {
    const n = Number(m[1])
    if (Number.isFinite(n) && n >= 0 && n <= 100) {
      return { actionId: SET_VOLUME_ACTION_ID, args: { level: n / 100 } }
    }
    return null
  }
  if (/\b(mute|silence)\b/.test(text) && MUSICISH.test(text)) {
    return { actionId: SET_VOLUME_ACTION_ID, args: { level: 0 } }
  }
  if (/\b(max|maximum|full) volume\b/.test(text)) {
    return { actionId: SET_VOLUME_ACTION_ID, args: { level: 1 } }
  }
  return null
}

// Heuristic: does this read as an attempt to go somewhere, even though no known
// destination matched? Used only to pick a friendlier reply — never to route.
export function looksLikeNavigation(raw) {
  const text = normalizeText(raw)
  if (!text) return false
  if (!TRIGGER.test(text)) return false
  return /\b(to|into|toward|towards)\b/.test(text) || /\b(open|visit|navigate|bring)\b/.test(text) || /\bgo\b/.test(text)
}
