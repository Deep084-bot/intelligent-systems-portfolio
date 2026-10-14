// DeepPet — personality + deterministic response engine.
//
// Pure data + pure functions (no React, no fetch, no DOM). This is the local
// brain that keeps the companion conversational when no AI provider is
// reachable. petBrain.js prefers the AI provider and falls back to these lines.
//
// Design rules baked in here:
//  - never claim an action the pet did not perform;
//  - music playback is real (backed by the shared MusicEngine), so the lines
//    describe what actually happened rather than promising a future feature;
//  - short, warm, slightly mischievous, and varied (anti-repeat per pool);
//  - one reaction per intent so dialogue and expression stay in sync.

import { worldLabel } from './worldRoutes'
import { getPreset } from '../../audio/presets'
import {
  PLAY_TRACK_ACTION_ID,
  PAUSE_PLAYBACK_ACTION_ID,
  RESUME_PLAYBACK_ACTION_ID,
  NEXT_TRACK_ACTION_ID,
  SET_VOLUME_ACTION_ID,
  MUSIC_ACTION_IDS,
} from './petMusicActions'

// ---------------------------------------------------------------------------
// anti-repeat picker — never returns the same line twice in a row from a pool
// ---------------------------------------------------------------------------
const recentByPool = new Map()

function makePicker(pool, remember = 2) {
  return function pick() {
    if (!pool.length) return null
    if (pool.length === 1) return pool[0]
    const recent = recentByPool.get(pool) || []
    const fresh = pool.filter((line) => !recent.includes(line))
    const choices = fresh.length ? fresh : pool
    const line = choices[Math.floor(Math.random() * choices.length)]
    const next = [line, ...recent].slice(0, Math.max(0, remember))
    recentByPool.set(pool, next)
    return line
  }
}

function pool(lines) {
  return makePicker(lines)
}

// Reset helper for deterministic tests.
export function resetPersonaMemory() {
  recentByPool.clear()
}

// ---------------------------------------------------------------------------
// worlds
// ---------------------------------------------------------------------------

// Short contextual observations per world, shown on arrival.
export const WORLD_LINES = {
  portal: pool([
    'Back at the entrance. Where are we headed?',
    'The DeepVerse door is right there. I checked.',
  ]),
  cosmos: pool([
    "Whoa. Do you think there's another little robot out there?",
    'So many stars. I counted... some of them.',
    'Space is very big and I am very small. I still like it.',
  ]),
  'vision-arena': pool([
    'Is that a camera? Am I being perceived?',
    'Show me what you can see. I will supervise.',
    'You look great from this angle. Statistically.',
  ]),
  'music-lab': pool([
    'Is it time for some music?',
    'I like the wobbly sounds in here.',
    'Careful — I might start dancing. I only have one dance.',
  ]),
  'reading-room': pool([
    'Shhh. Books.',
    'This is a sleepy place. I approve.',
    'So many words. I will read the small ones.',
  ]),
  'system-design': pool([
    'Boxes and arrows. Very serious. I like it.',
    'Everything connects to everything. Like me.',
    'No single point of failure. I relate.',
  ]),
  'inside-my-mind': pool([
    'Ooh. Is this where the ideas live?',
    'Quiet in here. Thinking noises.',
    'I will not touch anything. Probably.',
  ]),
  deeppet: pool([
    'Oh, hi! Welcome to my little corner.',
    "This is where I live when I'm not following you around.",
    'Make yourself at home. It is, technically, my home.',
  ]),
}

export function worldLine(world) {
  const p = WORLD_LINES[world] || WORLD_LINES.portal
  return p()
}

// ---------------------------------------------------------------------------
// conversation
// ---------------------------------------------------------------------------

const GREETINGS = pool([
  "Oh, hi! I've been waiting to meet you.",
  'Hey! You made it.',
  'Hello there. I was just thinking about... something.',
  'Hi! Nice of you to drop by.',
])

const ABOUT = pool([
  "I'm DeepPet — a small robot that lives across DeepVerse. I follow you around, react to things, and occasionally have opinions.",
  'DeepPet: pocket-sized, cream-and-green, powered by curiosity. I keep you company in every world.',
  'I am a little companion robot. I observe, I chat a bit, and I get excited when good things happen.',
])

const CAPABILITIES = pool([
  "I can take you to any world — Cosmos, Music Lab, the Reading Room, System Design, and more. I can also play music: ask for Cosmic Drift, Greenhouse, Night Drive, or Focus Mode. I react to what happens around us too.",
  'Ask me to go somewhere ("take me to Cosmos"), to play a track ("play something relaxing"), or just talk. I can pause, resume, skip, and change the volume as well.',
  'Right now I can navigate DeepVerse and play music for you. Long-term memory is still on the roadmap, not in my head yet.',
])

const THANKS = pool([
  "Anytime. That's what companions are for.",
  'You got it.',
  'Happy to help. Boop.',
])

const FAREWELL = pool([
  "See you around. I'll be right here.",
  'Bye! Follow me back whenever.',
  'Later. I will keep the lights on.',
])

const AFFIRM = pool([
  'Nice. What next?',
  'Agreed. Point me somewhere.',
  'Cool. I like it here.',
])

const MUSIC_REPLY = pool([
  'I can play music now — try "play Cosmic Drift", or say "play something relaxing".',
  "Music is wired up. Name a track (Cosmic Drift, Greenhouse, Night Drive, Focus Mode) or just ask for something relaxing.",
  'I have a little synth in here. Ask me to play a track, pause it, or set the volume.',
])

const MUSIC_PRE = {
  play: pool([
    'Queuing {label}…',
    'Starting {label}…',
    'Cueing up {label}…',
  ]),
  pause: pool(['Pausing…', 'Holding that note…']),
  resume: pool(['Picking it back up…', 'Back on…']),
  next: pool(['Skipping ahead…', 'On to the next one…']),
  volume: pool(['Setting the volume to {percent}%…', 'Adjusting volume to {percent}%…']),
}

const MUSIC_SUCCESS = {
  play: pool(['Now playing {label}.', '{label} is on.', 'Spinning up {label}.']),
  pause: pool(['Paused.', 'Held. Say the word to resume.']),
  resume: pool(['Back on — {label}.', 'Resuming {label}.']),
  next: pool(['Up next: {label}.', 'Skipped to {label}.']),
  volume: pool(['Volume at {percent}%.', 'Set to {percent}%.']),
  nothing: pool(['Nothing is playing right now.', 'There is no track to do that to yet.']),
  blocked: pool([
    "I need a tap before I can make sound — press play and I'll start.",
    "The browser is holding my audio until you tap. Give me a click and I'm on.",
  ]),
  unavailable: pool([
    "This browser won't let me play audio, sorry.",
    'I have no audio engine here — Web Audio is unavailable.',
  ]),
  unknown: pool([
    "I don't have a track called that.",
    'That track is not in my little library.',
  ]),
}

const UNKNOWN = pool([
  "Hmm. I'm not sure I follow. Ask me to take you somewhere, or ask what I can do.",
  "That one went over my antenna. Try 'take me to Cosmos' or 'what can you do?'",
  'I did not quite catch that. I am small, but I am listening.',
])

const UNKNOWN_PLACE = pool([
  "I don't know that place yet. I can take you to Cosmos, Music Lab, the Reading Room, and a few others.",
  "That world is not on my map. Ask me for Cosmos, Music Lab, System Design, or the Reading Room.",
  "Never heard of it. My map only covers DeepVerse — say the word and I'll show you around.",
])

const PRE_ACTION = pool([
  'On my way to {label}…',
  'Taking you to {label}…',
  '{label}? Follow me.',
])

const ACTION_SUCCESS = pool([
  'Off we go! See you in {label}.',
  'Welcome to {label}!',
  'Made it to {label}. Nice choice.',
])

const ACTION_UNSUPPORTED = pool([
  "I can't find that place in DeepVerse yet.",
  "That isn't on my map — I can only take you to real DeepVerse places.",
  "I haven't learned how to do that yet.",
])

const ACTION_FAILED = pool([
  "Hmm, that didn't work. Let's try again.",
  'Something went sideways there. Want to try again?',
])

const ACTION_CANCELLED = pool([
  'Okay, staying put.',
  'No worries — we can go whenever you like.',
])

export function greetingLine() {
  return GREETINGS()
}

// Shown while an action is being carried out. States intent only.
export function preActionLine(world) {
  return PRE_ACTION().replace('{label}', worldLabel(world))
}

function presetLabel(track) {
  const preset = getPreset(track)
  return preset ? preset.name : 'that track'
}

// Intent line for any proposal kind. Navigation keeps its own phrasing; music
// actions announce what is about to happen without claiming it already did.
export function preActionLineFor(proposal) {
  const { actionId, args = {} } = proposal || {}
  switch (actionId) {
    case PLAY_TRACK_ACTION_ID:
      return MUSIC_PRE.play().replace('{label}', presetLabel(args.track))
    case PAUSE_PLAYBACK_ACTION_ID:
      return MUSIC_PRE.pause()
    case RESUME_PLAYBACK_ACTION_ID:
      return MUSIC_PRE.resume()
    case NEXT_TRACK_ACTION_ID:
      return MUSIC_PRE.next()
    case SET_VOLUME_ACTION_ID:
      return MUSIC_PRE.volume().replace('{percent}', String(Math.round((args.level ?? 0) * 100)))
    default:
      return preActionLine(args.world)
  }
}

// The single user-facing line for an action *result*. Only ever called with the
// real result returned by the registry, so it never claims a success that did
// not happen.
export function actionResultLine(result) {
  if (result && MUSIC_ACTION_IDS.includes(result.actionId)) {
    return musicResultLine(result)
  }
  const status = result?.status
  const label = result?.data?.label || worldLabel(result?.data?.world)

  switch (status) {
    case 'ok':
      return ACTION_SUCCESS().replace('{label}', label)
    case 'cancelled':
      return ACTION_CANCELLED()
    case 'timeout':
    case 'failed':
      return ACTION_FAILED()
    case 'unsupported':
      return ACTION_UNSUPPORTED()
    case 'rejected':
    case 'invalid_args':
    case 'duplicate':
    default:
      if (result?.errorCode === 'NO_NAVIGATOR') return ACTION_FAILED()
      return ACTION_UNSUPPORTED()
  }
}

function musicResultLine(result) {
  const status = result?.status
  const data = result?.data || {}
  const label = data.label || 'that track'
  const percent = data.volumePercent

  if (status === 'ok') {
    switch (result.actionId) {
      case PLAY_TRACK_ACTION_ID:
        return MUSIC_SUCCESS.play().replace('{label}', label)
      case PAUSE_PLAYBACK_ACTION_ID:
        return MUSIC_SUCCESS.pause()
      case RESUME_PLAYBACK_ACTION_ID:
        return MUSIC_SUCCESS.resume().replace('{label}', label)
      case NEXT_TRACK_ACTION_ID:
        return MUSIC_SUCCESS.next().replace('{label}', label)
      case SET_VOLUME_ACTION_ID:
        return MUSIC_SUCCESS.volume().replace('{percent}', String(percent ?? ''))
      default:
        return ACTION_SUCCESS().replace('{label}', label)
    }
  }

  const errorCode = result?.errorCode
  if (errorCode === 'AUTOPLAY_BLOCKED') return MUSIC_SUCCESS.blocked()
  if (errorCode === 'AUDIO_UNSUPPORTED') return MUSIC_SUCCESS.unavailable()
  if (errorCode === 'UNKNOWN_TRACK') return MUSIC_SUCCESS.unknown()
  if (errorCode === 'NOTHING_PLAYING') return MUSIC_SUCCESS.nothing()

  switch (status) {
    case 'cancelled':
      return ACTION_CANCELLED()
    case 'timeout':
    case 'failed':
      return ACTION_FAILED()
    default:
      return ACTION_UNSUPPORTED()
  }
}

export function actionUnsupportedLine() {
  return ACTION_UNSUPPORTED()
}

export function reactionForActionResult(result) {
  const status = result?.status
  if (status === 'ok') {
    if (result?.actionId === PAUSE_PLAYBACK_ACTION_ID) return 'rest'
    return 'success'
  }
  switch (status) {
    case 'cancelled': return 'rest'
    case 'timeout':
    case 'failed': return 'error'
    default: return 'greet'
  }
}

export function unknownPlaceLine() {
  return UNKNOWN_PLACE()
}

// ---------------------------------------------------------------------------
// intent classification
// ---------------------------------------------------------------------------

export function classifyIntent(raw) {
  const text = ` ${String(raw || '').toLowerCase().replace(/[^a-z0-9\s']/g, ' ').replace(/\s+/g, ' ').trim()} `
  const has = (re) => re.test(text)

  if (/ (music|song|songs|track|tracks|playlist|listen to|play something|audio) /.test(text)) return 'music'
  if (/ (about you|about yourself|who are you|what are you|your name|tell me about you) /.test(text)) return 'about'
  if (/ (what can you do|what do you do|capabilities|can you help|how can you help|help me|your abilities|what are you good at) /.test(text)) return 'capabilities'
  if (/ (thanks|thank you|thx|ty|appreciate it) /.test(text)) return 'thanks'
  if (/ (bye|goodbye|see you|cya|later|farewell) /.test(text)) return 'farewell'
  if (/ (hi|hello|hey|yo|howdy|hiya|sup|good morning|good evening|good afternoon) /.test(text)) return 'greeting'
  if (/ (yes|yeah|yep|sure|ok|okay|cool|nice|great|awesome) /.test(text)) return 'affirm'
  return 'unknown'
}

// Every intent maps to one expression event so the face and the words agree.
export const INTENT_REACTION = {
  greeting: 'greet',
  about: 'greet',
  capabilities: 'greet',
  music: 'greet',
  thanks: 'success',
  affirm: 'success',
  farewell: 'rest',
  unknown: 'greet',
}

export function reactionForIntent(intent) {
  return INTENT_REACTION[intent] || 'greet'
}

// The deterministic reply. `flags.navigational` marks messages that looked like
// a request to go somewhere but named an unknown place, so we can apologise
// instead of shrugging.
export function localReply(raw, { flags = {} } = {}) {
  const intent = classifyIntent(raw)
  let text
  switch (intent) {
    case 'greeting': text = GREETINGS(); break
    case 'about': text = ABOUT(); break
    case 'capabilities': text = CAPABILITIES(); break
    case 'thanks': text = THANKS(); break
    case 'farewell': text = FAREWELL(); break
    case 'affirm': text = AFFIRM(); break
    case 'music': text = MUSIC_REPLY(); break
    default:
      text = flags.navigational ? UNKNOWN_PLACE() : UNKNOWN()
  }
  return { text, reaction: reactionForIntent(intent), intent }
}
