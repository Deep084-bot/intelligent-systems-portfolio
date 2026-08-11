import { clamp, totalScore } from './scoring'

export const PHASE = {
  PR: 'pr',
  CONTEXT: 'context',
  REVIEW: 'review',
  VERDICT: 'verdict',
  SUMMARY: 'summary',
}

export const CATEGORIES = [
  { id: 'performance', label: 'Performance' },
  { id: 'security', label: 'Security' },
  { id: 'scalability', label: 'Scalability' },
  { id: 'architecture', label: 'Architecture' },
  { id: 'readability', label: 'Readability' },
  { id: 'maintainability', label: 'Maintainability' },
  { id: 'correctness', label: 'Correctness' },
  { id: 'testing', label: 'Testing' },
]

export function initialState() {
  return {
    phase: PHASE.PR,
    comments: [],
    foundIds: [],
    falsePositives: 0,
    verdict: null,
    notes: '',
    result: null,
    recorded: false,
  }
}

export function startReview(state, scenario) {
  return {
    ...state,
    phase: PHASE.PR,
    comments: [],
    foundIds: [],
    falsePositives: 0,
    verdict: null,
    notes: '',
    result: null,
    recorded: false,
  }
}

export function advancePr(state) {
  return { ...state, phase: PHASE.CONTEXT }
}

export function beginReview(state) {
  return { ...state, phase: PHASE.REVIEW }
}

export function openVerdict(state, verdict) {
  return { ...state, phase: PHASE.VERDICT, verdict }
}

export function cancelVerdict(state) {
  return { ...state, phase: PHASE.REVIEW }
}

export function addComment(state, scenario, { file, line, category, text }) {
  const issue = scenario.issues.find((i) => i.file === file && i.line === line)
  const hit = !!issue
  const catMatch = hit && issue.category.includes(category)
  const comment = {
    id: `c-${Date.now()}-${state.comments.length}`,
    file,
    line,
    category,
    text,
    hit,
    catMatch,
    issueId: issue?.id || null,
  }
  const foundIds = hit && !state.foundIds.includes(issue.id) ? [...state.foundIds, issue.id] : state.foundIds
  const falsePositives = state.falsePositives + (hit ? 0 : 1)
  return { ...state, phase: PHASE.REVIEW, comments: [...state.comments, comment], foundIds, falsePositives }
}

export function submitVerdict(state, scenario, verdict, notes) {
  const next = { ...state, phase: PHASE.SUMMARY, verdict, notes }
  next.result = computeResult(next, scenario)
  return next
}

export function computeResult(state, scenario) {
  const all = scenario.issues
  const foundSet = new Set(state.foundIds)
  const totalWeight = all.reduce((s, i) => s + i.importance, 0)
  const foundWeight = all.filter((i) => foundSet.has(i.id)).reduce((s, i) => s + i.importance, 0)

  const prioritization = totalWeight ? Math.round(100 * foundWeight / totalWeight) : 100

  const important = all.filter((i) => i.severity === 'critical' || i.severity === 'high')
  const importantFound = important.length ? Math.round(100 * important.filter((i) => foundSet.has(i.id)).length / important.length) : 100

  const completeness = all.length ? Math.round(100 * foundSet.size / all.length) : 100
  const falsePositivesScore = clamp(100 - state.falsePositives * 15)

  const withCat = state.comments.filter((c) => c.hit && c.catMatch).length
  const communication = state.comments.length ? Math.round(100 * withCat / state.comments.length) : 0

  let judgment = 100
  const unfoundCritical = important.filter((i) => i.severity === 'critical' && !foundSet.has(i.id)).length
  const unfoundHigh = important.filter((i) => i.severity === 'high' && !foundSet.has(i.id)).length
  if (state.verdict === 'approve') {
    judgment = clamp(judgment - unfoundCritical * 30 - unfoundHigh * 15)
    if (unfoundCritical === 0 && unfoundHigh === 0) judgment = 95
  } else if (unfoundCritical === 0 && unfoundHigh === 0 && foundSet.size === all.length) {
    judgment = clamp(judgment - 8)
  }

  const breakdown = { prioritization, importantFound, falsePositives: falsePositivesScore, communication, judgment, completeness }
  return {
    score: totalScore(breakdown),
    breakdown,
    comments: state.comments,
    verdict: state.verdict,
    notes: state.notes,
    found: state.foundIds,
  }
}
