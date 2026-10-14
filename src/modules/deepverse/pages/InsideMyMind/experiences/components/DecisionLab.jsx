import { useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { PLAYABLE } from '../scenarios/registry'
import { initialState, beginScenario, selectChoice, continueFlow, PHASE } from '../engine'
import useBrainStore from '../../store'
import ScenarioMenu from './ScenarioMenu'
import EvidencePanel from './EvidencePanel'
import DecisionPrompt from './DecisionPrompt'
import OutcomeFeed from './OutcomeFeed'
import ScoreMeter from './ScoreMeter'
import TimelineRail from './TimelineRail'
import ConclusionScreen from './ConclusionScreen'

const reducedMotion = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

export default function DecisionLab({ onBack }) {
  const recordScenarioResult = useBrainStore((s) => s.recordScenarioResult)
  const scenarioProgress = useBrainStore((s) => s.scenarioProgress)

  const [scenario, setScenario] = useState(null)
  const [state, setState] = useState(() => initialState())
  const [scoresVisible, setScoresVisible] = useState(false)
  const recordedRef = useRef(false)

  const node = useMemo(() => (scenario ? scenario.nodes[state.nodeId] : null), [scenario, state.nodeId])
  const lastEntry = state.timeline[state.timeline.length - 1]

  const handleSelect = (s) => {
    recordedRef.current = false
    setScoresVisible(false)
    setScenario(s)
    setState(initialState())
    setState((st) => beginScenario(st))
  }

  const handleChoose = (choiceId) => {
    setState((st) => {
      const next = selectChoice(st, scenario, choiceId)
      setScoresVisible(true)
      return next
    })
  }

  const handleContinue = () => {
    setState((st) => {
      const next = continueFlow(st, scenario)
      if (next.phase === PHASE.CONCLUSION && !recordedRef.current) {
        recordedRef.current = true
        recordScenarioResult(scenario.id, Math.round(next.result.score))
      }
      return next
    })
  }

  const handleReplay = () => handleSelect(scenario)
  const handleBack = () => (scenario ? setScenario(null) : onBack())

  const backLabel = scenario ? '← Menu' : '← Back to Brain OS'

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
        className="w-[min(900px,94vw)] h-[min(640px,88vh)] flex flex-col rounded-2xl overflow-hidden"
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
          {scenario && <TimelineRail phase={state.phase} />}
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
                <ScenarioMenu scenarios={PLAYABLE} progress={scenarioProgress} onSelect={handleSelect} />
              </motion.div>
            ) : (
              <motion.div
                key={scenario.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="h-full flex gap-4 px-6 py-5"
              >
                <div className="w-[calc(50%-8px)] flex flex-col min-h-0">
                  {state.phase === PHASE.CONCLUSION ? (
                    <ConclusionScreen
                      result={state.result}
                      progress={scenarioProgress[scenario.id]}
                      onReplay={handleReplay}
                      onBack={handleBack}
                    />
                  ) : (
                    <AnimatePresence mode="wait">
                      {state.phase === PHASE.DECIDE ? (
                        <motion.div
                          key={state.nodeId}
                          initial={{ opacity: 0, x: -12 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 12 }}
                          transition={{ duration: 0.3 }}
                          className="min-h-0 overflow-y-auto"
                        >
                          <DecisionPrompt node={node} onChoose={handleChoose} />
                        </motion.div>
                      ) : (
                        <motion.div
                          key="outcome"
                          initial={{ opacity: 0, x: 12 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -12 }}
                          transition={{ duration: 0.3 }}
                          className="min-h-0 overflow-y-auto"
                        >
                          <OutcomeFeed entry={lastEntry} onContinue={handleContinue} />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  )}
                </div>

                <div className="w-[calc(50%-8px)] flex flex-col min-h-0 gap-4">
                  <ScoreMeter scores={Object.values(state.scores)} show={scoresVisible} />
                  <div className="flex-1 min-h-0">
                    <EvidencePanel evidence={scenario.evidence} unlockedEvidence={state.unlockedEvidence} />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  )
}
