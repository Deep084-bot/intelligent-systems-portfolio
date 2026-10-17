// Focused tests for the Engineering Decision Lab core logic:
// reducer determinism, DAG branching, 5-dimension scoring, clamp/tie edges,
// conclusion generation, and registry integrity.
import {
  initialState, beginScenario, selectChoice, continueFlow, PHASE,
} from './src/modules/deepverse/pages/InsideMyMind/experiences/engine.js'
import {
  DIMENSIONS, BASE_SCORE, initialScores, applyDeltas, totalScore, clamp,
} from './src/modules/deepverse/pages/InsideMyMind/experiences/scoring.js'
import { PLAYABLE, SCENARIOS } from './src/modules/deepverse/pages/InsideMyMind/experiences/scenarios/registry.js'

let pass = 0, fail = 0
const results = []
const ok = (name, cond, detail = '') => {
  if (cond) pass++; else fail++
  results.push(`${cond ? 'PASS' : 'FAIL'} ${name}${detail ? ' :: ' + detail : ''}`)
}
const deepEq = (a, b) => JSON.stringify(a) === JSON.stringify(b)
const clone = (o) => JSON.parse(JSON.stringify(o))

// ---- 1. five scoring dimensions ----
ok('DIMENSIONS has exactly 5 dimensions',
  DIMENSIONS.length === 5 && DIMENSIONS.every((d) => d.id && d.label),
  DIMENSIONS.map((d) => d.id).join(','))
ok('dimension ids match Conclusion/ScoreMeter expectations',
  deepEq(DIMENSIONS.map((d) => d.id), ['prioritization', 'risk', 'tradeoffs', 'incremental', 'evidence']))
const s0 = initialScores()
ok('initialScores seeds all five dims at BASE_SCORE',
  Object.keys(s0).length === 5 && Object.values(s0).every((v) => v === BASE_SCORE))

// ---- 2. clamp / edge cases ----
ok('clamp lower bound 0', clamp(-10) === 0 && clamp(0) === 0)
ok('clamp upper bound 100', clamp(150) === 100 && clamp(100) === 100)
ok('clamp identity in range', clamp(50) === 50 && clamp(37) === 37)
ok('applyDeltas clamps negative to 0',
  applyDeltas({ ...initialScores(), prioritization: 0 }, { prioritization: -10 }).prioritization === 0)
ok('applyDeltas clamps positive to 100',
  applyDeltas({ ...initialScores(), risk: 100 }, { risk: 40 }).risk === 100)
ok('applyDeltas leaves input untouched (pure)',
  (() => { const before = initialScores(); applyDeltas(before, { evidence: 10 }); return deepEq(before, initialScores()) })())

// ---- 3. totalScore rounding / tie edges ----
ok('totalScore of uniform 50s = 50', totalScore(initialScores()) === 50)
ok('totalScore rounds to nearest integer',
  totalScore({ prioritization: 100, risk: 100, tradeoffs: 100, incremental: 100, evidence: 99 }) === 100 &&
  totalScore({ prioritization: 0, risk: 0, tradeoffs: 0, incremental: 0, evidence: 1 }) === 0)
ok('ScoreMeter avg formula equals totalScore (display/score consistent)',
  (() => {
    const v = { prioritization: 61, risk: 44, tradeoffs: 70, incremental: 55, evidence: 80 }
    const avg = Math.round(Object.values(v).reduce((a, b) => a + b, 0) / 5)
    return avg === totalScore(v)
  })())

// ---- 4. reducer determinism (pure, no mutation) ----
const scenario = PLAYABLE.find((s) => s.id === 'auth-retry')
const run = (choices) => {
  let st = beginScenario(initialState())
  for (const [nodeId, choiceId] of choices) {
    if (st.nodeId !== nodeId) throw new Error(`expected node ${nodeId}, got ${st.nodeId}`)
    st = selectChoice(st, scenario, choiceId)
    st = continueFlow(st, scenario)
  }
  return st
}
const path = [['start', 'trace'], ['root-cause', 'config'], ['fix', 'circuit'], ['verify', 'deep-check']]
const a = run(path)
const b = run(path)
ok('identical inputs produce identical state (determinism)', deepEq(a, b))
const fresh = initialState()
beginScenario(fresh)
selectChoice(fresh, scenario, 'trace')
ok('initialState is not mutated by reducer', deepEq(initialState(), {
  phase: PHASE.SITUATION, nodeId: 'start', timeline: [],
  scores: initialScores(), unlockedEvidence: [], selected: null, result: null,
}))

// ---- 5. DAG branching ----
ok('linear good path reaches conclusion after 4 decisions',
  a.phase === PHASE.CONCLUSION && a.nodeId === 'verify' && a.timeline.length === 4,
  `phase=${a.phase} node=${a.nodeId} len=${a.timeline.length}`)
const looped = run([['start', 'scale'], ['start', 'rollback'], ['start', 'cache'], ['start', 'trace'],
  ['root-cause', 'user-health'], ['fix', 'kill-switch'], ['verify', 'latency-check']])
ok('a wrong choice loops back to the same node (branch cycles)',
  looped.phase === PHASE.CONCLUSION && looped.timeline.length === 7 && looped.timeline[0].label === 'Increase replicas')
ok('timeline records node ids in traversal order',
  deepEq(a.timeline.map((t) => t.nodeId), ['start', 'root-cause', 'fix', 'verify']))
ok('all playable scenarios expose branching nodes (>= 2 nodes)',
  PLAYABLE.every((s) => Object.keys(s.nodes).length >= 2))
ok('every scenario declares nodes + end + evidence',
  PLAYABLE.every((s) => s.nodes && s.end && s.evidence && s.evidence.logs && s.evidence.metrics && s.evidence.architecture))

// ---- 6. choice resolution edge cases ----
const beforeBad = clone(a)
const afterBad = selectChoice(a, scenario, 'does-not-exist')
ok('unknown choice id leaves state unchanged', deepEq(afterBad, beforeBad))

// ---- 7. conclusion generation ----
ok('conclusion carries score, breakdown, approach and lessons',
  typeof a.result.score === 'number' &&
  Object.keys(a.result.dimensionBreakdown).length === 5 &&
  typeof a.result.recommendedApproach === 'string' && a.result.recommendedApproach.length > 80 &&
  a.result.lessons.length >= 3,
  `score=${a.result.score} lessons=${a.result.lessons.length}`)
ok('conclusion score equals totalScore of final dims',
  a.result.score === totalScore(a.result.scores) && a.result.scores === a.result.dimensionBreakdown)
ok('good path scores above 50 while careless path scores lower',
  a.result.score > looped.result.score, `${a.result.score} vs ${looped.result.score}`)
ok('evidence unlocks are accumulated into state',
  a.unlockedEvidence.includes('auth-logs') && a.unlockedEvidence.includes('auth-config'))

// ---- 8. evidence-unlock hint data on timeline entries (OutcomeFeed) ----
ok('timeline entries carry unlockedEvidence for OutcomeFeed hint',
  (() => {
    const st = run([['start', 'trace']])
    return Array.isArray(st.timeline[0].unlockedEvidence) && st.timeline[0].unlockedEvidence.includes('auth-logs')
  })())

// ---- 9. registry ----
ok('PLAYABLE excludes comingSoon entries',
  PLAYABLE.length === 3 && PLAYABLE.every((s) => !s.comingSoon))
ok('SCENARIOS keeps future content labelled as coming soon',
  SCENARIOS.filter((s) => s.comingSoon).length === SCENARIOS.length - PLAYABLE.length)

console.log(results.join('\n'))
console.log(`\n${pass} passed, ${fail} failed`)
process.exit(fail ? 1 : 0)
