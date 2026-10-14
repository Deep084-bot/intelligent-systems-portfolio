import { createContext, useContext } from 'react'

// Multiplier applied to every autonomous (non user-driven) animation. Set to 0
// when the visitor prefers reduced motion so idle sway, spins and orbits hold
// still while the scroll-driven camera journey still works.
//
// NOTE: r3f renders inside its own reconciler root, so the provider must live
// *inside* <Canvas>. JourneyWorld wraps its subtree with this.
export const MotionContext = createContext(1)

export function useMotionScale() {
  return useContext(MotionContext)
}
