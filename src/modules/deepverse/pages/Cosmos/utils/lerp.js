export function lerp(a, b, t) {
  return a + (b - a) * t
}

export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max)
}

export function smoothstep(edge0, edge1, x) {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1)
  return t * t * (3 - 2 * t)
}

export function fadeInOut(x, fadeInStart, fadeInEnd, fadeOutStart, fadeOutEnd) {
  if (x < fadeInStart || x > fadeOutEnd) return 0
  const inPhase = smoothstep(fadeInStart, fadeInEnd, x)
  const outPhase = 1 - smoothstep(fadeOutStart, fadeOutEnd, x)
  return Math.min(inPhase, outPhase)
}
