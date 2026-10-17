export const BASE_SCORE = 50

export function clamp(v, lo = 0, hi = 100) {
  return Math.max(lo, Math.min(hi, v))
}

export function initialScores(dims) {
  return Object.fromEntries(dims.map((d) => [d.id, BASE_SCORE]))
}

export function applyDeltas(scores, dims, deltas = {}) {
  const next = { ...scores }
  for (const d of dims) {
    next[d.id] = clamp(next[d.id] + (deltas[d.id] || 0))
  }
  return next
}

export function totalScore(scores, dims) {
  if (!dims.length) return 0
  return Math.round(dims.reduce((sum, d) => sum + (scores[d.id] || 0), 0) / dims.length)
}

export function grade(score) {
  if (score >= 85) return 'Exceptional'
  if (score >= 70) return 'Strong'
  if (score >= 55) return 'Competent'
  return 'Developing'
}
