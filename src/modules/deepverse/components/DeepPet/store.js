import { create } from 'zustand'
import {
  PET_STATES,
  REACTIONS,
  REACTION_PRIORITY,
  EXPLICIT_PRIORITY,
  describeReaction,
  describeState,
  getPriority,
  getWorldMood,
  worldFromRoute,
} from './petState'
import { emit, on, off } from './events'

// A temporary override (hover / reaction) sits on top of the world's baseline mood.
// When the hold timer expires the pet falls back to the baseline for its world.
let holdTimer = null

// Which reaction currently owns the pet, so a weaker event cannot stomp it.
let activePriority = -1
// The trigger that installed the current override ('hover', 'greet', 'poke', …).
// Releasing on pointer-out only releases what the pointer actually installed.
let activeSource = null

// Two identical events inside this window are the same event arriving twice
// (a stray re-render, a double click) rather than two real things that happened.
const REACTION_DEBOUNCE_MS = 250
const lastReactionAt = new Map()

function clearHold() {
  if (holdTimer) {
    clearTimeout(holdTimer)
    holdTimer = null
  }
}

// Deterministic arbitration: equal or higher priority replaces the current
// override, lower priority is dropped outright.
function acceptsReaction(source, priority, force) {
  if (priority < activePriority) return false
  const now = Date.now()
  const last = lastReactionAt.get(source) ?? -Infinity
  const isDuplicate = now - last < REACTION_DEBOUNCE_MS
  // A forced call skips the debounce but still counts as "just fired", so a
  // stray duplicate immediately after it is still caught.
  lastReactionAt.set(source, now)
  return force ? true : !isDuplicate
}

export const usePetStore = create((set, get) => ({
  world: 'portal',
  baseline: PET_STATES.CURIOUS,
  state: PET_STATES.CURIOUS,
  // null when the baseline is showing, otherwise the override that owns the state
  override: null,
  hovering: false,
  line: null,
  burstId: 0,

  setWorld: (world, meta) => {
    if (!world || world === get().world) return
    const from = get().world
    const baseline = getWorldMood(world)
    // an in-flight reaction keeps playing out; only the resting mood changes
    if (get().override) set({ world, baseline })
    else set({ world, baseline, state: baseline })
    // Fires once per real world change — not on every route render.
    emit('world-enter', { world, from, ...meta })
  },

  setWorldFromRoute: (route) => get().setWorld(worldFromRoute(route), { route }),

  applyOverride: (payload) => {
    clearHold()
    activePriority = payload.priority ?? EXPLICIT_PRIORITY
    activeSource = payload.source ?? null
    set({ state: payload.state, override: payload.token, line: payload.line })
    if (payload.hold > 0) {
      holdTimer = setTimeout(() => get().releaseOverride(), payload.hold)
    }
  },

  // Without a source this releases unconditionally (v1 behaviour). Pass a source
  // to release only if that trigger still owns the pet. If the pointer is still
  // inside after a reaction expires, hand the face back to hover rather than
  // jumping straight to the world baseline mid-hold.
  releaseOverride: (source) => {
    if (source && source !== activeSource) return false
    clearHold()
    activePriority = -1
    activeSource = null
    set((s) => ({ state: s.baseline, override: null, line: null }))
    if (get().hovering) {
      get().applyOverride({
        ...describeReaction('hover'),
        priority: REACTION_PRIORITY.hover,
        source: 'hover',
      })
    }
    return true
  },

  setState: (state) =>
    get().applyOverride({ ...describeState(state), priority: EXPLICIT_PRIORITY, source: 'state' }),

  react: (event, options) => {
    const key = REACTIONS[event] ? event : 'greet'
    const priority = options?.priority ?? getPriority(key)
    if (!acceptsReaction(key, priority, options?.force)) return null
    const payload = describeReaction(key)
    // Conversation and world-context callers can supply their own line and hold
    // so spoken dialogue and its expression are driven by one event, while the
    // override still expires back to the world baseline (never sticky).
    if (options?.line != null) payload.line = options.line
    if (options?.hold != null) payload.hold = options.hold
    get().applyOverride({ ...payload, priority, source: key })
    if (key === 'poke' || key === 'achievement' || key === 'discovery') get().burst()
    return payload
  },

  setHovering: (hovering) => {
    if (get().hovering === hovering) return
    if (hovering) {
      // Hover is the floor of the priority ladder. It may borrow the face only
      // while nothing else owns the pet, so a live reaction is never stomped and
      // its hold timer is never cleared (that was cutting the reaction faces out).
      if (!get().override) {
        get().applyOverride({
          ...describeReaction('hover'),
          priority: REACTION_PRIORITY.hover,
          source: 'hover',
        })
      }
    }
    // Record the pointer state before releasing so a same-tick leave/return
    // does not resurrect the hover that the leave is tearing down.
    set({ hovering })
    if (!hovering) {
      // only the hover's own override is torn down — never a live reaction
      get().releaseOverride('hover')
    }
  },

  burst: () => set((s) => ({ burstId: s.burstId + 1 })),
}))

// Plain, framework-free handle so any world can react without importing
// component internals:
//   import { pet } from '.../DeepPet/store'
//   pet.react('success')
//   pet.emit('achievement', { achievementId: 'principal-reviewer' })
//   pet.on('poke', handler) / pet.off('poke', handler)
export const pet = {
  setState: (state) => usePetStore.getState().setState(state),
  react: (event, options) => usePetStore.getState().react(event, options),
  burst: () => usePetStore.getState().burst(),
  setWorld: (world, meta) => usePetStore.getState().setWorld(world, meta),
  setWorldFromRoute: (route) => usePetStore.getState().setWorldFromRoute(route),
  getState: () => usePetStore.getState().state,
  on: (event, handler) => on(event, handler),
  off: (event, handler) => off(event, handler),
  emit: (event, payload) => emit(event, payload),
}

export function usePetProfile() {
  return usePetStore((s) => s.state)
}

// Test seam: drops subscriptions and the active override so QA can start clean.
export function resetPetForTest() {
  clearHold()
  activePriority = -1
  activeSource = null
  lastReactionAt.clear()
}