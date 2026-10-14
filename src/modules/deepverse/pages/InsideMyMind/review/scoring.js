export const DIMENSIONS = [
  { id: 'prioritization', label: 'Severity Prioritization' },
  { id: 'importantFound', label: 'Important Issues Found' },
  { id: 'falsePositives', label: 'False Positives' },
  { id: 'communication', label: 'Communication Quality' },
  { id: 'judgment', label: 'Engineering Judgment' },
  { id: 'completeness', label: 'Review Completeness' },
]

export function clamp(v, lo = 0, hi = 100) {
  return Math.max(lo, Math.min(hi, v))
}

export function totalScore(breakdown) {
  return Math.round(DIMENSIONS.reduce((sum, d) => sum + (breakdown[d.id] ?? 0), 0) / DIMENSIONS.length)
}

export function reviewGrade(score) {
  if (score >= 85) return 'Principal-level Review'
  if (score >= 70) return 'Senior-level Review'
  if (score >= 55) return 'Solid Review'
  return 'Needs Depth'
}
