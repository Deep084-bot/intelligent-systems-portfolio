// Shared, reconciler-agnostic ending state. The DOM ending overlay (outside
// <Canvas>) drives `dim`; the 3D scene components (inside r3f's own reconciler
// root) read it each frame to let the Cosmic Web recede into the distance as
// the closing narrative plays. A module singleton intentionally bridges the two
// React roots without prop-drilling through the Canvas boundary.
export const endingState = {
  active: false,
  // 0 → 1 over the closing sequence. Drives scene recession.
  dim: 0,
}

export function resetEndingState() {
  endingState.active = false
  endingState.dim = 0
}
