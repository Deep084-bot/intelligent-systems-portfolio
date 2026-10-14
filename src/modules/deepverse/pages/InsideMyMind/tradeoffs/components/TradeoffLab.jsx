import { useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { PLAYABLE } from '../scenarios/registry'
import { initialState, startScenario, advanceBrief, beginDecisions, choose, continueAfterConsequence, enterReview, buildArchitecture, PHASE } from '../engine'
import useBrainStore from '../../store'
import ScenarioMenu from './ScenarioMenu'
import CompanyBrief from './CompanyBrief'
import ConstraintsBoard from './ConstraintsBoard'
import DecisionScreen from './DecisionScreen'
import ConsequenceDeck from './ConsequenceDeck'
import FinalArchitecture from './FinalArchitecture'
import EngineeringReview from './EngineeringReview'

const reducedMotion = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

const PHASE_STEPS = { brief: 0, constraints: 1, decide: 2, consequence: 3, final: 4, review: 5 }
const STEP_LABELS = ['Brief', 'Constraints', 'Debate', 'Outcome', 'Architecture', 'Review']

export default function TradeoffLab({ onBack }) {
  const recordTradeoffResult = useBrainStore((s) => s.recordTradeoffResult)
  const tradeoffProgress = useBrainStore((s) => s.tradeoffProgress)

  const [scenario, setScenario] = useState(null)
  const [state, setState] = useState(() => initialState())
  const recordedRef = useRef(false)
  const prevBestRef = useRef(null)

  const handleSelect = (s) => {
    recordedRef.current = false
    prevBestRef.current = null
    setScenario(s)
    setState((st) => startScenario(st, s))
  }

  const handleAdvanceBrief = () => setState((st) => advanceBrief(st))
  const handleBeginDecisions = () => setState((st) => beginDecisions(st))

  const handleChoose = (choiceId) => setState((st) => choose(st, scenario, choiceId))

  const handleContinue = () => setState((st) => continueAfterConsequence(st, scenario))

  const handleReview = () => {
    prevBestRef.current = useBrainStore.getState().tradeoffProgress[scenario.id]?.bestScore ?? null
    setState((st) => {
      const next = enterReview(st, scenario)
      if (!recordedRef.current) {
        recordedRef.current = true
        recordTradeoffResult(scenario.id, Math.round(next.result.score))
      }
      return next
    })
  }

  const handleReplay = () => handleSelect(scenario)
  const handleBack = () => (scenario ? setScenario(null) : onBack())
  const backLabel = scenario ? '← Menu' : '← Back to Brain OS'

  const decision = scenario ? scenario.decisions[state.decisionIndex] : null
  const lastChoiceId = state.choiceIds[state.choiceIds.length - 1]
  const lastChoice = scenario && lastChoiceId
    ? scenario.decisions[state.decisionIndex].choices.find((c) => c.id === lastChoiceId)
    : null

  const prevValues = {}
  if (scenario && lastChoice) {
    for (const [k, v] of Object.entries(state.metrics)) {
      prevValues[k] = k in lastChoice.deltas ? v - lastChoice.deltas[k] : v
    }
  }

  const currentStep = scenario ? PHASE_STEPS[state.phase] : -1
  const isFinalDecision = scenario && state.decisionIndex === scenario.decisions.length - 1

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="absolute inset-0 z-30 flex items-center justify-center"
      style={{
        background: 'rgba(10,10,13,0.85)',
        backdropFilter: 'blur(32px)',
        WebkitBackdropFilter: 'blur(32px)',
      }}
    >
      <motion.div
        initial={{ scale: 0.92, y: 24, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.92, y: 24, opacity: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: reducedMotion ? 0 : 0.1 }}
        className="w-[min(920px,94vw)] h-[min(680px,90vh)] flex flex-col rounded-2xl overflow-hidden"
        style={{
          background: 'rgba(16,16,20,0.9)',
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 30px 80px rgba(0,0,0,0.6)',
        }}
      >
        <div className="flex items-center justify-between px-5 py-3 border-b shrink-0" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <div className="flex items-center gap-3">
            <button
              onClick={handleBack}
              className="px-3 py-1.5 rounded-lg text-[11px] font-medium text-neutral-400 transition-all hover:text-neutral-200"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              {backLabel}
            </button>
            {scenario && (
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-neutral-300">{scenario.title}</span>
                <span className="text-[9px] font-mono text-neutral-600">{scenario.tag}</span>
              </div>
            )}
          </div>
          {scenario && (
            <div className="flex items-center gap-1.5">
              {STEP_LABELS.map((label, i) => {
                const active = i === currentStep
                const done = i < currentStep
                return (
                  <div key={label} className="flex items-center gap-1.5">
                    <div
                      className="w-1.5 h-1.5 rounded-full transition-all"
                      style={{
                        background: done ? '#6d5cfc' : active ? '#d4af37' : 'rgba(255,255,255,0.12)',
                        boxShadow: active ? '0 0 8px rgba(212,175,55,0.6)' : 'none',
                      }}
                    />
                    <span
                      className="text-[8px] font-mono uppercase tracking-wider hidden sm:block"
                      style={{ color: active ? '#e4e4e7' : done ? '#a1a1aa' : '#52525b' }}
                    >
                      {label}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="flex-1 min-h-0">
          <AnimatePresence mode="wait">
            {!scenario ? (
              <motion.div
                key="menu"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="h-full overflow-y-auto px-6 py-5"
              >
                <ScenarioMenu scenarios={PLAYABLE} progress={tradeoffProgress} onSelect={handleSelect} />
              </motion.div>
            ) : (
              <motion.div
                key={scenario.id + state.phase + state.decisionIndex}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="h-full px-6 py-5"
              >
                {state.phase === PHASE.BRIEF && <CompanyBrief scenario={scenario} onNext={handleAdvanceBrief} />}
                {state.phase === PHASE.CONSTRAINTS && <ConstraintsBoard scenario={scenario} onBegin={handleBeginDecisions} />}
                {state.phase === PHASE.DECIDE && (
                  <DecisionScreen
                    decision={decision}
                    decisionIndex={state.decisionIndex}
                    total={scenario.decisions.length}
                    onChoose={handleChoose}
                  />
                )}
                {state.phase === PHASE.CONSEQUENCE && (
                  <ConsequenceDeck
                    scenario={scenario}
                    choice={lastChoice}
                    prevValues={prevValues}
                    currentValues={state.metrics}
                    architecture={buildArchitecture(scenario, state.choiceIds)}
                    isFinal={isFinalDecision}
                    onContinue={handleContinue}
                  />
                )}
                {state.phase === PHASE.FINAL && (
                  <FinalArchitecture
                    scenario={scenario}
                    choiceIds={state.choiceIds}
                    architecture={buildArchitecture(scenario, state.choiceIds)}
                    onReview={handleReview}
                  />
                )}
                {state.phase === PHASE.REVIEW && (
                  <EngineeringReview
                    scenario={scenario}
                    result={state.result}
                    progress={tradeoffProgress[scenario.id]}
                    prevBest={prevBestRef.current}
                    onReplay={handleReplay}
                    onBack={handleBack}
                  />
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  )
}
