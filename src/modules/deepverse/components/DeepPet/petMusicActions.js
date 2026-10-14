// DeepPet — real music playback actions.
//
// These are the actions DeepPet can *actually* perform against the shared
// MusicEngine. They live beside the navigation action and follow the same
// pattern: a pure `validate` plus a `handler` that calls a framework-free
// service. Registration is idempotent (guarded by hasAction) because
// registerAction intentionally throws on a duplicate id.
//
// The handler never decides success itself — it reports the engine's own
// result, so a blocked autoplay policy surfaces as a real failure rather than a
// false "playing" message.

import { registerAction, hasAction } from './actionRegistry'
import { musicEngine } from '../../audio/MusicEngine'
import { isPresetId, getPreset } from '../../audio/presets'

export const PLAY_TRACK_ACTION_ID = 'play_track'
export const PAUSE_PLAYBACK_ACTION_ID = 'pause_playback'
export const RESUME_PLAYBACK_ACTION_ID = 'resume_playback'
export const NEXT_TRACK_ACTION_ID = 'next_track'
export const SET_VOLUME_ACTION_ID = 'set_volume'

export const MUSIC_ACTION_IDS = [
  PLAY_TRACK_ACTION_ID,
  PAUSE_PLAYBACK_ACTION_ID,
  RESUME_PLAYBACK_ACTION_ID,
  NEXT_TRACK_ACTION_ID,
  SET_VOLUME_ACTION_ID,
]

function labelFor(presetId) {
  const preset = getPreset(presetId)
  return preset ? preset.name : null
}

// Turn an engine result into the registry's handler-result shape. The engine is
// the source of truth for ok/status; we only classify the reason.
function playbackResult(res) {
  if (res && res.ok) {
    return {
      ok: true,
      message: '',
      data: {
        presetId: res.presetId ?? null,
        label: labelFor(res.presetId),
        playbackStatus: res.status ?? null,
        volume: res.volume,
        volumePercent: res.volumePercent,
      },
    }
  }
  const errorCode = res?.errorCode || 'PLAYBACK_FAILED'
  const unsupported = errorCode === 'UNKNOWN_TRACK' || errorCode === 'AUDIO_UNSUPPORTED'
  return { ok: false, status: unsupported ? 'unsupported' : 'failed', errorCode, message: '' }
}

function registerPlayTrack() {
  registerAction({
    id: PLAY_TRACK_ACTION_ID,
    name: 'Play a track',
    description: 'Start playback of a known DeepVerse preset.',
    requiresConfirmation: false,
    timeoutMs: 5000,
    validate(rawArgs) {
      const track = rawArgs && typeof rawArgs.track === 'string' ? rawArgs.track : ''
      if (!track) {
        return { ok: false, errorCode: 'MISSING_TRACK', message: 'Which track should I play?' }
      }
      if (!isPresetId(track)) {
        return { ok: false, errorCode: 'UNKNOWN_TRACK', message: "I don't know that track." }
      }
      return { ok: true, args: { track } }
    },
    async handler({ track }) {
      return playbackResult(await musicEngine.play(track))
    },
  })
}

function registerPause() {
  registerAction({
    id: PAUSE_PLAYBACK_ACTION_ID,
    name: 'Pause playback',
    description: 'Pause the current track.',
    requiresConfirmation: false,
    timeoutMs: 3000,
    async handler() {
      return playbackResult(await musicEngine.pause())
    },
  })
}

function registerResume() {
  registerAction({
    id: RESUME_PLAYBACK_ACTION_ID,
    name: 'Resume playback',
    description: 'Resume the paused track.',
    requiresConfirmation: false,
    timeoutMs: 3000,
    async handler() {
      return playbackResult(await musicEngine.resume())
    },
  })
}

function registerNext() {
  registerAction({
    id: NEXT_TRACK_ACTION_ID,
    name: 'Next track',
    description: 'Skip to the next track.',
    requiresConfirmation: false,
    timeoutMs: 5000,
    async handler() {
      return playbackResult(await musicEngine.next())
    },
  })
}

function registerSetVolume() {
  registerAction({
    id: SET_VOLUME_ACTION_ID,
    name: 'Set volume',
    description: 'Change the playback volume (0 to 1).',
    requiresConfirmation: false,
    timeoutMs: 3000,
    validate(rawArgs) {
      const level = rawArgs ? rawArgs.level : undefined
      if (!Number.isFinite(level)) {
        return { ok: false, errorCode: 'INVALID_VOLUME', message: 'Give me a volume level.' }
      }
      if (level < 0 || level > 1) {
        return { ok: false, errorCode: 'INVALID_VOLUME', message: 'Volume must be between 0 and 100 percent.' }
      }
      return { ok: true, args: { level } }
    },
    handler({ level }) {
      return playbackResult(musicEngine.setVolume(level))
    },
  })
}

// Idempotent: only registers what is missing.
export function ensureMusicActions() {
  if (!hasAction(PLAY_TRACK_ACTION_ID)) registerPlayTrack()
  if (!hasAction(PAUSE_PLAYBACK_ACTION_ID)) registerPause()
  if (!hasAction(RESUME_PLAYBACK_ACTION_ID)) registerResume()
  if (!hasAction(NEXT_TRACK_ACTION_ID)) registerNext()
  if (!hasAction(SET_VOLUME_ACTION_ID)) registerSetVolume()
}
