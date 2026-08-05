import { initialJudgment, applyJudgmentDeltas, judgmentTotal } from './scoring'

export const PHASE = {
  BRIEF: 'brief',
  CONSTRAINTS: 'constraints',
  DECIDE: 'decide',
  CONSEQUENCE: 'consequence',
  FINAL: 'final',
  REVIEW: 'review',
}

export function initialState() {
  return {
    phase: PHASE.BRIEF,
    decisionIndex: 0,
    choiceIds: [],
    judgment: initialJudgment(),
    metrics: {},
    result: null,
    recorded: false,
  }
}

export function startScenario(state, scenario) {
  return {
    ...state,
    phase: PHASE.BRIEF,
    decisionIndex: 0,
    choiceIds: [],
    judgment: initialJudgment(),
    metrics: Object.fromEntries(Object.entries(scenario.metrics).map(([k, m]) => [k, m.value])),
    result: null,
    recorded: false,
  }
}

export function advanceBrief(state) {
  return { ...state, phase: PHASE.CONSTRAINTS }
}

export function beginDecisions(state) {
  return { ...state, phase: PHASE.DECIDE }
}

export function choose(state, scenario, choiceId) {
  const decision = scenario.decisions[state.decisionIndex]
  const choice = decision.choices.find((c) => c.id === choiceId)
  if (!choice) return state

  const metrics = { ...state.metrics }
  for (const [key, delta] of Object.entries(choice.deltas || {})) {
    metrics[key] = metrics[key] + delta
  }

  return {
    ...state,
    phase: PHASE.CONSEQUENCE,
    choiceIds: [...state.choiceIds, choiceId],
    judgment: applyJudgmentDeltas(state.judgment, choice.scoring),
    metrics,
  }
}

export function continueAfterConsequence(state, scenario) {
  if (state.decisionIndex < scenario.decisions.length - 1) {
    return { ...state, phase: PHASE.DECIDE, decisionIndex: state.decisionIndex + 1 }
  }
  return { ...state, phase: PHASE.FINAL }
}

export function enterReview(state, scenario) {
  const result = {
    score: judgmentTotal(state.judgment),
    breakdown: state.judgment,
    choiceIds: state.choiceIds,
    architecture: buildArchitecture(scenario, state.choiceIds),
    preferredIds: scenario.review.preferredChoiceIds,
    preferredNarrative: scenario.review.preferredNarrative,
    lessons: scenario.review.lessons || [],
  }
  return { ...state, phase: PHASE.REVIEW, result }
}

export function buildArchitecture(scenario, choiceIds) {
  const base = scenario.architecture.base
  let nodes = [...base.nodes]
  let links = [...base.links]

  choiceIds.forEach((choiceId, index) => {
    const decision = scenario.decisions[index]
    const choice = decision?.choices.find((c) => c.id === choiceId)
    if (!choice?.architecture) return
    const { addNodes = [], addLinks = [], removeNodeIds = [], removeLinkPairs = [], labelOverrides = {} } = choice.architecture
    const removeSet = new Set(removeNodeIds)
    const removePairKey = new Set(removeLinkPairs.map(([a, b]) => `${a}->${b}`))
    nodes = nodes.filter((n) => !removeSet.has(n.id)).concat(addNodes)
    links = links
      .filter(([a, b]) => !removeSet.has(a) && !removeSet.has(b) && !removePairKey.has(`${a}->${b}`))
      .concat(addLinks)
    nodes = nodes.map((n) => (labelOverrides[n.id] ? { ...n, label: labelOverrides[n.id] } : n))
  })

  return { viewBox: base.viewBox, nodes, links }
}
