import { clamp, totalScore } from './scoring'

export const PHASE = {
  INCIDENT: 'incident',
  INVESTIGATE: 'investigate',
  HYPOTHESIS: 'hypothesis',
  RESOLVED: 'resolved',
}

export function initialState() {
  return {
    phase: PHASE.INCIDENT,
    time: 0,
    discovered: [],
    actionsDone: [],
    categoryHits: {},
    timeline: [],
    hypothesisAttempts: [],
    lastFeedback: null,
    selectedCause: null,
    reasoning: '',
    result: null,
    recorded: false,
  }
}

export function startIncident(state, scenario) {
  const observedAt = scenario.incident.observedAt || 0
  return {
    ...state,
    phase: PHASE.INCIDENT,
    time: observedAt,
    discovered: [],
    actionsDone: [],
    categoryHits: {},
    timeline: [
      {
        id: 'observed',
        at: observedAt,
        kind: 'observation',
        text: scenario.incident.symptom,
        detail: null,
      },
    ],
    hypothesisAttempts: [],
    lastFeedback: null,
    selectedCause: null,
    reasoning: '',
    result: null,
    recorded: false,
  }
}

export function beginInvestigation(state) {
  return { ...state, phase: PHASE.INVESTIGATE }
}

export function performAction(state, scenario, actionId) {
  const action = scenario.actions.find((a) => a.id === actionId)
  if (!action || state.actionsDone.includes(actionId)) return state

  const nextTime = state.time + action.timeCost
  const discovered = [...new Set([...state.discovered, ...(action.reveals || [])])]
  const categoryHits = { ...state.categoryHits }
  for (const eid of action.reveals || []) {
    const cat = scenario.evidence[eid].category
    categoryHits[cat] = (categoryHits[cat] || 0) + 1
  }

  return {
    ...state,
    phase: PHASE.INVESTIGATE,
    time: nextTime,
    discovered,
    actionsDone: [...state.actionsDone, actionId],
    categoryHits,
    lastFeedback: null,
    timeline: [
      ...state.timeline,
      {
        id: `action-${actionId}`,
        at: nextTime,
        kind: 'action',
        text: action.label,
        detail: action.resultNote || null,
      },
    ],
  }
}

export function proposeCause(state, scenario, causeId, reasoning) {
  const cause = scenario.causes.find((c) => c.id === causeId)
  if (!cause) return state

  const decisiveFound = scenario.keyEvidence.every((id) => state.discovered.includes(id))
  const isCorrect = !!cause.isCorrect
  const nextTime = state.time + 2
  const attempt = { causeId, correct: isCorrect, decisive: decisiveFound, at: nextTime }

  const timeline = [
    ...state.timeline,
    {
      id: `hypothesis-${state.hypothesisAttempts.length + 1}`,
      at: nextTime,
      kind: 'hypothesis',
      text: `Proposed root cause: ${cause.label}`,
      detail: isCorrect && decisiveFound ? 'Confirmed — evidence supports this.' : isCorrect ? 'Direction is right, but not yet proven.' : 'Not supported by the evidence so far.',
    },
  ]

  if (isCorrect && decisiveFound) {
    return {
      ...state,
      phase: PHASE.RESOLVED,
      time: nextTime,
      timeline,
      hypothesisAttempts: [...state.hypothesisAttempts, attempt],
      selectedCause: cause,
      reasoning,
      result: computeResult({ ...state, timeline, time: nextTime, hypothesisAttempts: [...state.hypothesisAttempts, attempt] }, scenario),
    }
  }

  return {
    ...state,
    phase: PHASE.INVESTIGATE,
    time: nextTime,
    timeline,
    hypothesisAttempts: [...state.hypothesisAttempts, attempt],
    selectedCause: cause,
    reasoning,
    lastFeedback: isCorrect
      ? 'Correct direction — but the evidence is not conclusive yet. Gather more evidence to prove it.'
      : 'That is not supported by the evidence so far. Return to the investigation.',
  }
}

export function computeResult(state, scenario) {
  const totalEvidence = Object.keys(scenario.evidence).length
  const keyFound = scenario.keyEvidence.filter((id) => state.discovered.includes(id)).length
  const keyTotal = scenario.keyEvidence.length
  const categoriesTouched = Object.keys(state.categoryHits).length
  const attempts = state.hypothesisAttempts
  const wrong = attempts.filter((a) => !a.correct).length
  const premature = attempts.filter((a) => a.correct && !a.decisive).length
  const lowValue = state.actionsDone.filter((id) => scenario.actions.find((a) => a.id === id)?.value === 'low').length

  const efficiency = clamp(Math.round(100 - Math.max(0, state.time - scenario.recommendedTime) * 3))
  const evidence = Math.round(0.5 * (100 * state.discovered.length / totalEvidence) + 0.5 * (100 * keyFound / keyTotal))
  const hypothesis = clamp(100 - wrong * 20 - premature * 12)
  const accuracy = attempts.length === 1 ? 100 : clamp(100 - (attempts.length - 1) * 18)
  const communication = Math.round(0.5 * (100 * categoriesTouched / scenario.categories.length) + 0.5 * (100 * state.discovered.length / totalEvidence))
  const risk = clamp(100 - lowValue * 10 - premature * 14 - wrong * 8)

  const breakdown = { efficiency, evidence, hypothesis, accuracy, communication, risk }
  return {
    score: totalScore(breakdown),
    breakdown,
    timeline: state.timeline,
    time: state.time,
    discovered: state.discovered,
    attempts,
  }
}
