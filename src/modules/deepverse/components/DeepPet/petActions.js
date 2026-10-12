// DeepPet — the actions DeepPet actually knows how to perform.
//
// Only actions with a real, working handler are registered. Anything that is
// merely planned is listed in RESERVED_ACTIONS for documentation and is NOT
// registered, so it can never appear executable.
//
// Registration happens at import time (via ensurePetActions). Tests may call
// resetActionRegistry() then ensurePetActions() to rebuild a clean registry.

import { registerAction, hasAction } from './actionRegistry'
import { WORLD_ROUTES, isKnownWorld } from './worldRoutes'

export const NAVIGATE_ACTION_ID = 'navigate_to_world'

// The only implemented action category. The handler navigates exclusively to a
// path taken from the allowlist keyed by `world`; a caller-supplied `path` is
// never read, so arguments cannot smuggle in an arbitrary URL.
function registerNavigateAction() {
  registerAction({
    id: NAVIGATE_ACTION_ID,
    name: 'Go to a DeepVerse world',
    description: 'Move the visitor to a known DeepVerse world.',
    requiresConfirmation: false,
    timeoutMs: 3000,
    validate(rawArgs) {
      const world = rawArgs && typeof rawArgs.world === 'string' ? rawArgs.world : ''
      if (!world) {
        return { ok: false, errorCode: 'MISSING_WORLD', message: "I'm not sure which world you mean." }
      }
      if (!isKnownWorld(world)) {
        return { ok: false, errorCode: 'UNKNOWN_WORLD', message: 'That place is not in DeepVerse.' }
      }
      // Only the world key survives — path/label are resolved from the allowlist.
      return { ok: true, args: { world } }
    },
    handler({ world }, ctx) {
      if (!isKnownWorld(world)) {
        return { ok: false, status: 'unsupported', errorCode: 'UNKNOWN_WORLD', message: 'That place is not in DeepVerse.' }
      }
      if (!ctx || typeof ctx.navigate !== 'function') {
        return { ok: false, status: 'failed', errorCode: 'NO_NAVIGATOR', message: "I can't take you anywhere right now." }
      }
      const destination = WORLD_ROUTES[world]
      ctx.navigate(destination.path)
      return {
        ok: true,
        message: `Heading to ${destination.label}.`,
        data: { world, label: destination.label, path: destination.path },
      }
    },
  })
}

// Idempotent: registers built-in actions only if they are not already present.
export function ensurePetActions() {
  if (!hasAction(NAVIGATE_ACTION_ID)) registerNavigateAction()
}

// Declared for a future Music Lab module. These are NOT registered: DeepPet has
// no playback engine yet, so none of them are executable. When a real Music Lab
// stops living behind this boundary, it can register handlers for the same ids
// (see the pattern in registerNavigateAction) without touching the registry core
// or the conversation UI.
export const RESERVED_ACTIONS = [
  { id: 'play_track', name: 'Play a track', description: 'Start playback of a chosen track.' },
  { id: 'pause_playback', name: 'Pause playback', description: 'Pause the current track.' },
  { id: 'resume_playback', name: 'Resume playback', description: 'Resume the paused track.' },
  { id: 'next_track', name: 'Next track', description: 'Skip to the next track.' },
  { id: 'set_volume', name: 'Set volume', description: 'Change the playback volume.' },
]

ensurePetActions()
