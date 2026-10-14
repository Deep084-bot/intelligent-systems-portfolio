// DeepPet — the actions DeepPet actually knows how to perform.
//
// Only actions with a real, working handler are registered. Two families exist:
//   - navigation (this file), and
//   - music playback (petMusicActions.js), backed by the shared MusicEngine.
// Anything merely planned is simply not registered, so it can never appear
// executable.
//
// Registration happens at import time (via ensurePetActions). Tests may call
// resetActionRegistry() then ensurePetActions() to rebuild a clean registry.

import { registerAction, hasAction } from './actionRegistry'
import { WORLD_ROUTES, isKnownWorld } from './worldRoutes'
import { ensureMusicActions, MUSIC_ACTION_IDS } from './petMusicActions'

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
  ensureMusicActions()
}

// The music action ids, re-exported so callers have one place to discover the
// full set of implemented actions.
export { MUSIC_ACTION_IDS }

ensurePetActions()
