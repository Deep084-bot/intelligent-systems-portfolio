import { useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { PLAYABLE } from '../scenarios/registry'
import { initialState, startIncident, beginInvestigation, performAction, proposeCause, PHASE } from '../engine'
import useBrainStore from '../../store'
import ScenarioMenu from './ScenarioMenu'
import IncidentBrief from './IncidentBrief'
import InvestigationRoom from './InvestigationRoom'
import HypothesisScreen from './HypothesisScreen'
import IncidentReview from './IncidentReview'

const reducedMotion = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

export default function DebuggingLab({ onBack }) {
  const recordDebuggingResult = useBrainStore((s) => s.recordDebuggingResult)
  const debuggingProgress = useBrainStore((s) => s.debuggingProgress)

  const [scenario, setScenario] = useState(null)
  const [state, setState] = useState(() => initialState())
  const prevBestRef = useRef(null)

  const handleSelect = (s) => {
    prevBestRef.current = null
    setScenario(s)
    setState((st) => startIncident(st, s))
  }

  const handleBegin = () => setState((st) => beginInvestigation(st))
  const handleAction = (actionId) => setState((st) => performAction(st, scenario, actionId))
  const handleProposeOpen = () => setState((st) => ({ ...st, phase: PHASE.HYPOTHESIS }))
  const handleProposeCancel = () => setState((st) => ({ ...st, phase: PHASE.INVESTIGATE }))

  const handlePropose = (causeId, reasoning) => {
    prevBestRef.current = useBrainStore.getState().debuggingProgress[scenario.id]?.bestScore ?? null
    setState((st) => {
      const next = proposeCause(st, scenario, causeId, reasoning)
      if (next.phase === PHASE.RESOLVED && !next.recorded) {
        next.recorded = true
        recordDebuggingResult(scenario.id, Math.round(next.result.score))
      }
      return next
    })
  }

  const handleReplay = () => handleSelect(scenario)
  const handleBack = () => (scenario ? setScenario(null) : onBack())
  const backLabel = scenario ? '← Menu' : '← Back to Brain OS'

  const lastActionId = state.actionsDone[state.actionsDone.length - 1]
  const lastAction = lastActionId && scenario ? scenario.actions.find((a) => a.id === lastActionId) : null
  const freshIds = lastAction?.reveals || []

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
                <span
                  className="text-[9px] font-mono px-1.5 py-0.5 rounded"
                  style={{ background: 'rgba(248,113,113,0.1)', color: '#f87171', border: '1px solid rgba(248,113,113,0.2)' }}
                >
                  {scenario.incident.severity}
                </span>
                <span className="text-[11px] text-neutral-300">{scenario.title}</span>
              </div>
            )}
          </div>
          {scenario && (
            <div className="text-[9px] font-mono text-neutral-600">
              {state.phase === PHASE.RESOLVED ? 'resolved' : state.phase === PHASE.HYPOTHESIS ? 'hypothesis' : 'on-call'}
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
                <ScenarioMenu scenarios={PLAYABLE} progress={debuggingProgress} onSelect={handleSelect} />
              </motion.div>
            ) : (
              <motion.div
                key={scenario.id + state.phase}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="h-full px-6 py-5"
              >
                {state.phase === PHASE.INCIDENT && <IncidentBrief scenario={scenario} onBegin={handleBegin} />}
                {state.phase === PHASE.INVESTIGATE && (
                  <InvestigationRoom
                    scenario={scenario}
                    state={state}
                    freshIds={freshIds}
                    onAction={handleAction}
                    onPropose={handleProposeOpen}
                  />
                )}
                {state.phase === PHASE.HYPOTHESIS && (
                  <HypothesisScreen scenario={scenario} onPropose={handlePropose} onCancel={handleProposeCancel} />
                )}
                {state.phase === PHASE.RESOLVED && (
                  <IncidentReview
                    scenario={scenario}
                    state={state}
                    progress={debuggingProgress[scenario.id]}
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
