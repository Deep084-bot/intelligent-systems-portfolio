import { useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { SCENARIOS } from '../registry'
import { initialState, startReview, advancePr, beginReview, openVerdict, cancelVerdict, addComment, submitVerdict, PHASE } from '../engine'
import useBrainStore from '../../store'
import ScenarioMenu from './ScenarioMenu'
import PullRequestScreen from './PullRequestScreen'
import ContextScreen from './ContextScreen'
import FileExplorer from './FileExplorer'
import CodeEditor from './CodeEditor'
import CommentPanel from './CommentPanel'
import ReviewSidebar from './ReviewSidebar'
import VerdictScreen from './VerdictScreen'
import ReviewSummary from './ReviewSummary'

const reducedMotion = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

export default function ReviewArena({ onBack }) {
  const recordReviewResult = useBrainStore((s) => s.recordReviewResult)
  const reviewProgress = useBrainStore((s) => s.reviewProgress)

  const [scenario, setScenario] = useState(null)
  const [state, setState] = useState(() => initialState())
  const [activePath, setActivePath] = useState(null)
  const [selectedLine, setSelectedLine] = useState(null)
  const [compose, setCompose] = useState(null)
  const [notes, setNotes] = useState('')
  const prevBestRef = useRef(null)

  const handleSelect = (s) => {
    prevBestRef.current = null
    setScenario(s)
    setState((st) => startReview(st, s))
    setActivePath(s.files[0].path)
    setSelectedLine(null)
    setCompose(null)
    setNotes('')
  }

  const handleNext = () => setState((st) => advancePr(st))
  const handleBegin = () => setState((st) => beginReview(st))

  const activeFile = scenario ? scenario.files.find((f) => f.path === activePath) : null

  const handleSelectLine = (num) => {
    if (!activeFile) return
    setSelectedLine(num)
    const line = activeFile.lines.find((l, i) => i + 1 === num)
    setCompose({ line: num, snippet: line ? line.text : '' })
  }

  const handleAddComment = (category, text) => {
    if (!scenario || !activeFile || !compose) return
    setState((st) => addComment(st, scenario, { file: activeFile.path, line: compose.line, category, text }))
    setCompose(null)
  }

  const handleVerdict = (verdict) => setState((st) => openVerdict(st, verdict))
  const handleVerdictCancel = () => setState((st) => cancelVerdict(st))

  const handleSubmitVerdict = (verdict, vNotes) => {
    prevBestRef.current = useBrainStore.getState().reviewProgress[scenario.id]?.bestScore ?? null
    setState((st) => {
      const next = submitVerdict(st, scenario, verdict, vNotes)
      if (!next.recorded) {
        next.recorded = true
        recordReviewResult(scenario.id, Math.round(next.result.score))
      }
      return next
    })
  }

  const handleReplay = () => handleSelect(scenario)
  const handleBack = () => (scenario ? setScenario(null) : onBack())
  const backLabel = scenario ? '← Menu' : '← Back to Brain OS'

  const phaseLabel = {
    [PHASE.PR]: 'inbox',
    [PHASE.CONTEXT]: 'context',
    [PHASE.REVIEW]: 'reviewing',
    [PHASE.VERDICT]: 'verdict',
    [PHASE.SUMMARY]: 'complete',
  }

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
        className="w-[min(1120px,95vw)] h-[min(720px,92vh)] flex flex-col rounded-2xl overflow-hidden"
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
                  style={{ background: 'rgba(109,92,252,0.1)', color: '#a78bfa', border: '1px solid rgba(109,92,252,0.2)' }}
                >
                  {scenario.tag}
                </span>
                <span className="text-[11px] text-neutral-300">{scenario.title}</span>
              </div>
            )}
          </div>
          {scenario && <div className="text-[9px] font-mono text-neutral-600">{phaseLabel[state.phase]}</div>}
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
                <ScenarioMenu scenarios={SCENARIOS} progress={reviewProgress} onSelect={handleSelect} />
              </motion.div>
            ) : (
              <motion.div
                key={scenario.id + state.phase}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="h-full px-5 py-4"
              >
                {state.phase === PHASE.PR && <PullRequestScreen scenario={scenario} onNext={handleNext} />}
                {state.phase === PHASE.CONTEXT && <ContextScreen scenario={scenario} onBegin={handleBegin} />}
                {state.phase === PHASE.REVIEW && (
                  <div className="h-full flex gap-3 min-h-0">
                    <div className="w-[190px] shrink-0">
                      <FileExplorer files={scenario.files} activePath={activePath} comments={state.comments} onSelect={setActivePath} />
                    </div>
                    <div className="flex-1 min-w-0 relative">
                      <CodeEditor file={activeFile} comments={state.comments} selectedLine={selectedLine} onSelectLine={handleSelectLine} />
                      <AnimatePresence>
                        {compose && activeFile && (
                          <div className="absolute right-0 top-0 bottom-0 w-[300px] overflow-y-auto p-3" style={{ pointerEvents: 'auto' }}>
                            <CommentPanel
                              file={activeFile.path}
                              line={compose.line}
                              snippet={compose.snippet}
                              onAdd={handleAddComment}
                              onCancel={() => setCompose(null)}
                            />
                          </div>
                        )}
                      </AnimatePresence>
                    </div>
                    <div className="w-[230px] shrink-0">
                      <ReviewSidebar scenario={scenario} state={state} notes={notes} setNotes={setNotes} onVerdict={handleVerdict} />
                    </div>
                  </div>
                )}
                {state.phase === PHASE.VERDICT && (
                  <VerdictScreen
                    scenario={scenario}
                    state={state}
                    notes={notes}
                    setNotes={setNotes}
                    onSubmit={handleSubmitVerdict}
                    onCancel={handleVerdictCancel}
                  />
                )}
                {state.phase === PHASE.SUMMARY && (
                  <ReviewSummary
                    scenario={scenario}
                    result={state.result}
                    prevBest={prevBestRef.current}
                    isNewBest={prevBestRef.current == null || state.result.score > prevBestRef.current}
                    onReplay={handleReplay}
                    onExit={handleBack}
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
