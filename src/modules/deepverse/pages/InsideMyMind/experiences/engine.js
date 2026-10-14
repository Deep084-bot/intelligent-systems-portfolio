import { initialScores, applyDeltas, totalScore } from './scoring'

export const PHASE = {
  SITUATION: 'situation',
  DECIDE: 'decide',
  OUTCOME: 'outcome',
  CONCLUSION: 'conclusion',
}

export function initialState() {
  return {
    phase: PHASE.SITUATION,
    nodeId: 'start',
    timeline: [],
    scores: initialScores(),
    unlockedEvidence: [],
    selected: null,
    result: null,
  }
}

export function beginScenario(state) {
  return { ...state, phase: PHASE.DECIDE }
}

export function selectChoice(state, scenario, choiceId) {
  const node = scenario.nodes[state.nodeId]
  const choice = node.choices.find((c) => c.id === choiceId)
  if (!choice) return state
  const scores = applyDeltas(state.scores, choice.scoring)
  const unlockedEvidence = [...new Set([...state.unlockedEvidence, ...(choice.unlockEvidence || [])])]
  const timeline = [
    ...state.timeline,
    {
      nodeId: state.nodeId,
      label: choice.label,
      outcome: choice.outcome,
      effect: choice.effect || null,
      delta: choice.scoring || {},
      next: choice.next || 'conclusion',
    },
  ]
  return {
    ...state,
    phase: PHASE.OUTCOME,
    selected: choice,
    scores,
    unlockedEvidence,
    timeline,
  }
}

export function continueFlow(state, scenario) {
  const next = state.selected?.next || 'conclusion'
  if (next === 'conclusion') {
    return {
      ...state,
      phase: PHASE.CONCLUSION,
      selected: null,
      result: {
        score: totalScore(state.scores),
        scores: state.scores,
        dimensionBreakdown: state.scores,
        timeline: state.timeline,
        recommendedApproach: scenario.end?.recommendedApproach || '',
        lessons: scenario.end?.lessons || [],
      },
    }
  }
  return { ...state, phase: PHASE.DECIDE, nodeId: next, selected: null }
}
