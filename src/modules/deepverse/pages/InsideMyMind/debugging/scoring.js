export const DIMENSIONS = [
  { id: 'efficiency', label: 'Investigation Efficiency' },
  { id: 'evidence', label: 'Evidence Collection' },
  { id: 'hypothesis', label: 'Hypothesis Quality' },
  { id: 'accuracy', label: 'Root Cause Accuracy' },
  { id: 'communication', label: 'Communication' },
  { id: 'risk', label: 'Risk Awareness' },
]

export function clamp(v, lo = 0, hi = 100) {
  return Math.max(lo, Math.min(hi, v))
}

export function totalScore(breakdown) {
  return Math.round(DIMENSIONS.reduce((sum, d) => sum + (breakdown[d.id] ?? 0), 0) / DIMENSIONS.length)
}

export function incidentGrade(score) {
  if (score >= 85) return 'Exceptional Investigator'
  if (score >= 70) return 'Strong Investigator'
  if (score >= 55) return 'Competent Investigator'
  return 'Needs More Structure'
}
