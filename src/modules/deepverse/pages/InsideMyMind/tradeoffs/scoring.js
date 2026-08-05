export const JUDGMENT_DIMENSIONS = [
  { id: 'context', label: 'Context Awareness' },
  { id: 'scalability', label: 'Scalability Thinking' },
  { id: 'cost', label: 'Cost Awareness' },
  { id: 'simplicity', label: 'Simplicity' },
  { id: 'future', label: 'Future Growth' },
  { id: 'risk', label: 'Risk Management' },
]

export const BASE_SCORE = 50

export function clamp(v, lo = 0, hi = 100) {
  return Math.max(lo, Math.min(hi, v))
}

export function initialJudgment() {
  return Object.fromEntries(JUDGMENT_DIMENSIONS.map((d) => [d.id, BASE_SCORE]))
}

export function applyJudgmentDeltas(scores, deltas = {}) {
  const next = { ...scores }
  for (const d of JUDGMENT_DIMENSIONS) {
    next[d.id] = clamp(next[d.id] + (deltas[d.id] || 0))
  }
  return next
}

export function judgmentTotal(scores) {
  return Math.round(JUDGMENT_DIMENSIONS.reduce((sum, d) => sum + scores[d.id], 0) / JUDGMENT_DIMENSIONS.length)
}

export function judgmentGrade(score) {
  if (score >= 80) return 'Exceptional Judgment'
  if (score >= 65) return 'Strong Judgment'
  if (score >= 50) return 'Balanced Judgment'
  return 'Context-Dependent Judgment'
}
