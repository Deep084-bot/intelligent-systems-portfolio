// DeepPet — minimal event bus.
//
// Plain JavaScript on purpose: no React, no DOM, no dependencies. Any DeepVerse
// module can announce something meaningful without importing pet internals:
//
//   import { pet } from '.../DeepPet/store'
//   pet.emit('achievement', { achievementId: 'principal-reviewer' })
//
// and anything can observe the pet's life without React re-renders:
//
//   const off = pet.on('poke', (payload) => …)
//   off()                        // or pet.off('poke', handler)

export const PET_EVENTS = [
  'greet',
  'world-enter',
  'success',
  'error',
  'discovery',
  'achievement',
  'poke',
  'idle',
]

// event -> Set<handler>. A Set keeps subscriptions idempotent and lets off()
// remove the exact handler that was registered.
const listeners = new Map()

export function on(event, handler) {
  if (typeof handler !== 'function') return () => false
  let set = listeners.get(event)
  if (!set) {
    set = new Set()
    listeners.set(event, set)
  }
  set.add(handler)
  return () => off(event, handler)
}

export function off(event, handler) {
  const set = listeners.get(event)
  if (!set) return false
  const removed = set.delete(handler)
  if (removed && set.size === 0) listeners.delete(event)
  return removed
}

// Dispatch over a snapshot so a listener may safely subscribe/unsubscribe
// during dispatch, and one throwing listener never blocks the others.
export function emit(event, payload) {
  const set = listeners.get(event)
  if (!set || set.size === 0) return 0
  const snapshot = Array.from(set)
  let delivered = 0
  for (const handler of snapshot) {
    delivered++
    try {
      handler(payload, event)
    } catch (err) {
      if (typeof console !== 'undefined') {
        console.warn(`[deeppet] "${event}" listener threw`, err)
      }
    }
  }
  return delivered
}

// Introspection, used by the pet's own QA and by tests.
export function listenerCount(event) {
  if (event === undefined) {
    let total = 0
    for (const set of listeners.values()) total += set.size
    return total
  }
  const set = listeners.get(event)
  return set ? set.size : 0
}

export function resetListeners() {
  listeners.clear()
}