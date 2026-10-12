// DeepPet — personality + deterministic response engine.
//
// Pure data + pure functions (no React, no fetch, no DOM). This is the local
// brain that keeps the companion conversational when no AI provider is
// reachable. petBrain.js prefers the AI provider and falls back to these lines.
//
// Design rules baked in here:
//  - never claim an action the pet did not perform;
//  - music playback is explicitly stated as not built yet;
//  - short, warm, slightly mischievous, and varied (anti-repeat per pool);
//  - one reaction per intent so dialogue and expression stay in sync.

import { worldLabel } from './worldRoutes'

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
  "I can take you to any world — Cosmos, Music Lab, the Reading Room, System Design, and more. I can chat, and I react to what happens around us. Music playback and a real memory aren't built yet.",
  'Ask me to go somewhere ("take me to Cosmos") or just talk. I react to the world too. I cannot play audio yet — that part is still a sketch.',
  "Right now I can navigate DeepVerse for you and keep you company. Music and long-term memory are on the roadmap, not in my head yet.",
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
  "Music playback isn't wired up yet. But I can take you to the Music Lab to look around.",
  "I can't play a track yet — no music engine back here. I can walk you to the Music Lab though.",
  'No audio circuits yet, sorry. Say the word and I will take you to the Music Lab.',
])

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

// The single user-facing line for an action *result*. Only ever called with the
// real result returned by the registry, so it never claims a success that did
// not happen.
export function actionResultLine(result) {
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

export function actionUnsupportedLine() {
  return ACTION_UNSUPPORTED()
}

export function reactionForActionResult(result) {
  switch (result?.status) {
    case 'ok': return 'success'
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
