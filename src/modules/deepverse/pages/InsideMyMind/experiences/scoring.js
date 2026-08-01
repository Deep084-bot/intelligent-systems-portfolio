export const DIMENSIONS = [
  { id: 'prioritization', label: 'Prioritization' },
  { id: 'risk', label: 'Risk Awareness' },
  { id: 'tradeoffs', label: 'Tradeoff Thinking' },
  { id: 'incremental', label: 'Incremental Debugging' },
  { id: 'evidence', label: 'Evidence-Based' },
]

export const BASE_SCORE = 50

export function clamp(v, lo = 0, hi = 100) {
  return Math.max(lo, Math.min(hi, v))
}

export function initialScores() {
  return Object.fromEntries(DIMENSIONS.map((d) => [d.id, BASE_SCORE]))
}

export function applyDeltas(scores, deltas = {}) {
  const next = { ...scores }
  for (const d of DIMENSIONS) {
    next[d.id] = clamp(next[d.id] + (deltas[d.id] || 0))
  }
  return next
}

export function totalScore(scores) {
  return Math.round(DIMENSIONS.reduce((sum, d) => sum + scores[d.id], 0) / DIMENSIONS.length)
}
