// DeepPet — state machine, motion profiles, world moods, reaction vocabulary.
// Pure data + pure helpers. No React, no DOM. Imported by the store and the pet body.

export const PET_STATES = {
  IDLE: 'idle',
  CURIOUS: 'curious',
  HAPPY: 'happy',
  EXCITED: 'excited',
  CONFUSED: 'confused',
  SLEEPY: 'sleepy',
}

export const PET_STATE_LIST = Object.values(PET_STATES)

// Every animated channel of the pet is driven from one profile, so a single
// state change retunes the whole organism without re-rendering React.
export const STATE_PROFILES = {
  [PET_STATES.IDLE]: {
    floatDur: 6.6, floatAmp: 7, glow: 0.5, orbitDur: 15, tilt: 0,
    corePulse: 3.4, trailRate: 1.0, jitter: false,
  },
  [PET_STATES.CURIOUS]: {
    floatDur: 5.2, floatAmp: 9.5, glow: 0.82, orbitDur: 9, tilt: -6,
    corePulse: 2.4, trailRate: 1.4, jitter: false,
  },
  [PET_STATES.HAPPY]: {
    floatDur: 4.4, floatAmp: 12, glow: 0.92, orbitDur: 7, tilt: 3,
    corePulse: 2.0, trailRate: 1.65, jitter: false,
  },
  [PET_STATES.EXCITED]: {
    floatDur: 2.6, floatAmp: 17, glow: 1.0, orbitDur: 4, tilt: -4,
    corePulse: 1.3, trailRate: 2.4, jitter: false,
  },
  [PET_STATES.CONFUSED]: {
    floatDur: 5.0, floatAmp: 8, glow: 0.58, orbitDur: 11.5, tilt: 9,
    corePulse: 2.8, trailRate: 1.1, jitter: true,
  },
  [PET_STATES.SLEEPY]: {
    floatDur: 9.6, floatAmp: 4, glow: 0.3, orbitDur: 21, tilt: 5,
    corePulse: 4.8, trailRate: 0.5, jitter: false,
  },
}

export const DEFAULT_PROFILE = STATE_PROFILES[PET_STATES.IDLE]

export function getProfile(state) {
  return STATE_PROFILES[state] || DEFAULT_PROFILE
}

// Semantic reactions other DeepVerse modules can fire without knowing anything
// about the pet's internals.
export const REACTIONS = {
  greet: { state: PET_STATES.CURIOUS, hold: 2600, speak: true },
  hover: { state: PET_STATES.CURIOUS, hold: 0, speak: false },
  success: { state: PET_STATES.HAPPY, hold: 3200, speak: true },
  error: { state: PET_STATES.CONFUSED, hold: 3000, speak: true },
  discovery: { state: PET_STATES.EXCITED, hold: 2800, speak: true },
  achievement: { state: PET_STATES.EXCITED, hold: 3400, speak: true },
  poke: { state: PET_STATES.EXCITED, hold: 2400, speak: true },
  rest: { state: PET_STATES.IDLE, hold: 2200, speak: false },
  sleep: { state: PET_STATES.SLEEPY, hold: 6000, speak: false },
  ponder: { state: PET_STATES.CONFUSED, hold: 2600, speak: true },
}

export const REACTION_EVENTS = Object.keys(REACTIONS)

// ---------------------------------------------------------------------------
// v1.1 — reactive companion
// ---------------------------------------------------------------------------

// When reactions collide, the higher rung wins and the lower one is dropped, so
// the pet never stacks two animations on top of each other.
export const REACTION_PRIORITY = {
  achievement: 7,
  discovery: 6,
  success: 5,
  error: 5,
  poke: 4,
  'world-enter': 3,
  idle: 2,
  greet: 1,
  hover: 0,
}

// An explicit pet.setState() call is deliberate developer intent, so it sits at
// the top of the ladder and simply never loses to an automatic reaction.
export const EXPLICIT_PRIORITY = 8

export function getPriority(event) {
  return REACTION_PRIORITY[event] ?? REACTION_PRIORITY.greet
}

// Which reaction the pet plays for each event. `idle` is null because the
// behaviour is chosen by the caller at the moment the timer fires.
export const EVENT_REACTIONS = {
  greet: 'greet',
  'world-enter': 'greet',
  success: 'success',
  error: 'error',
  discovery: 'discovery',
  achievement: 'achievement',
  poke: 'poke',
  idle: null,
}

// Entering a world should be acknowledged, never announced. Quiet worlds get a
// silent settle instead of a greeting.
export const WORLD_ENTER_RESPONSE = {
  portal: 'greet',
  cosmos: 'rest',
  'vision-arena': 'greet',
  'music-lab': 'greet',
  'reading-room': 'rest',
  'system-design': 'greet',
  'inside-my-mind': 'greet',
  deeppet: 'greet',
}

export function worldEnterResponse(world) {
  return WORLD_ENTER_RESPONSE[world] || 'greet'
}

// Baseline mood per world. Applied whenever no interaction override is active.
export const WORLD_MOODS = {
  portal: PET_STATES.CURIOUS,
  cosmos: PET_STATES.IDLE,
  'vision-arena': PET_STATES.CURIOUS,
  'music-lab': PET_STATES.HAPPY,
  'reading-room': PET_STATES.SLEEPY,
  'system-design': PET_STATES.IDLE,
  'inside-my-mind': PET_STATES.CURIOUS,
  deeppet: PET_STATES.CURIOUS,
}

export const DEFAULT_WORLD = 'portal'

export function getWorldMood(world) {
  return WORLD_MOODS[world] || PET_STATES.IDLE
}

// route -> world key
export function worldFromRoute(route) {
  if (!route || !route.startsWith('/deepverse')) return DEFAULT_WORLD
  const seg = route.split('/')[2]
  return seg || DEFAULT_WORLD
}

// Tiny, quiet voice. Never a tooltip, never a chat bubble.
export const FLOAT_LINES = {
  poke: ['boop.', 'hm.', 'hey.', 'oh — hi.'],
  greet: ['hello.', 'there you are.'],
  success: ['clean.', 'that worked.', 'noted.'],
  error: ['hm.', 'that broke.', 'not that.'],
  discovery: ['oh.', 'new.', 'look at that.'],
  achievement: ['earned.', 'that one counts.'],
  ponder: ['hmm.', 'wait.', 'oh?'],
}

function pickLine(event) {
  const pool = FLOAT_LINES[event]
  if (!pool || !pool.length) return null
  return pool[Math.floor(Math.random() * pool.length)]
}

// Idle micro-behaviours — rare, small, autonomous. `ponder` is the pet losing
// itself for a moment: it reuses the existing `confused` face so the whole
// six-state vocabulary is reachable without any event-architecture change.
export const IDLE_BEHAVIORS = [
  { event: 'poke', weight: 2 },
  { event: 'rest', weight: 3 },
  { event: 'sleep', weight: 2 },
  { event: 'ponder', weight: 2 },
  { event: 'poke', weight: 1 },
]

export function pickIdleBehavior() {
  const total = IDLE_BEHAVIORS.reduce((s, b) => s + b.weight, 0)
  let roll = Math.random() * total
  for (const b of IDLE_BEHAVIORS) {
    roll -= b.weight
    if (roll <= 0) return b.event
  }
  return 'rest'
}

let lineSeq = 0

// Build the transient payload a reaction produces.
export function describeReaction(event) {
  const spec = REACTIONS[event] || REACTIONS.greet
  return {
    state: spec.state,
    hold: spec.hold,
    line: spec.speak ? pickLine(event) : null,
    token: `pet-${++lineSeq}`,
  }
}

export function describeState(state) {
  const target = PET_STATE_LIST.includes(state) ? state : PET_STATES.IDLE
  return { state: target, hold: 0, line: null, token: `pet-${++lineSeq}` }
}