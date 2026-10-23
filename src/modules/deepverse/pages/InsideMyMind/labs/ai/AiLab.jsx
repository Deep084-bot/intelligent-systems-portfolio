import { useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import LabShell from '../kit/LabShell'
import LabMenu from '../kit/LabMenu'
import LabIntro from '../kit/LabIntro'
import ResultScreen from '../kit/ResultScreen'
import { Card, SectionLabel, Chip, PrimaryButton } from '../kit/ui'
import { DIMENSIONS, SCENARIOS } from './data'
import { initialScores, applyDeltas, totalScore, grade } from '../kit/scoring'
import useBrainStore from '../../store'

const STEPS = ['Brief', 'Design', 'Architecture', 'Review']

export default function AiLab({ onBack }) {
  const recordLabResult = useBrainStore((s) => s.recordLabResult)
  const labProgress = useBrainStore((s) => s.labProgress.ai)

  const [scenario, setScenario] = useState(null)
  const [phase, setPhase] = useState('menu')
  const [index, setIndex] = useState(0)
  const [choiceIds, setChoiceIds] = useState([])
  const [showOutcome, setShowOutcome] = useState(false)
  const recordedRef = useRef(false)
  const prevBestRef = useRef(null)

  const current = scenario ? scenario.decisions[index] : null
  const lastChoice = useMemo(() => {
    if (!scenario || !current || !showOutcome) return null
    return current.choices.find((c) => c.id === choiceIds[index])
  }, [scenario, current, choiceIds, index, showOutcome])

  const computed = useMemo(() => {
    if (!scenario) return null
    let dims = initialScores(DIMENSIONS)
    const lines = []
    scenario.decisions.forEach((d, i) => {
      const ch = d.choices.find((c) => c.id === choiceIds[i])
      if (!ch) return
      dims = applyDeltas(dims, DIMENSIONS, ch.dims)
      if (ch.contract) lines.push(...ch.contract)
    })
    return { dims, contract: lines, score: totalScore(dims, DIMENSIONS) }
  }, [scenario, choiceIds])

  const handleSelect = (s) => { recordedRef.current = false; prevBestRef.current = null; setScenario(s); setIndex(0); setChoiceIds([]); setShowOutcome(false); setPhase('intro') }
  const handleChoose = (id) => { setChoiceIds((prev) => { const next = [...prev]; next[index] = id; return next }); setShowOutcome(true) }
  const handleContinue = () => {
    setShowOutcome(false)
    if (index < scenario.decisions.length - 1) setIndex((i) => i + 1)
    else {
      prevBestRef.current = useBrainStore.getState().labProgress.ai?.[scenario.id]?.bestScore ?? null
      setPhase('architecture')
    }
  }
  const handleReview = () => {
    if (!recordedRef.current) { recordedRef.current = true; recordLabResult('ai', scenario.id, computed.score, { metGoal: computed.score >= 70 }) }
    setPhase('result')
  }
  const backLabel = phase === 'menu' ? '← Back to Brain OS' : '← Menu'
  const handleBack = () => (phase === 'menu' ? onBack() : setPhase('menu'))

  return (
    <LabShell
      title={scenario?.title || 'AI Lab'}
      tag={scenario?.tag}
      steps={STEPS}
      currentStep={phase === 'result' ? 3 : phase === 'architecture' ? 2 : phase === 'decide' ? (showOutcome ? 2 : 1) : phase === 'intro' ? 0 : -1}
      onBack={handleBack}
      backLabel={backLabel}
      size="w-[min(960px,95vw)] h-[min(700px,92vh)]"
    >
      <AnimatePresence mode="wait">
        {phase === 'menu' && (
          <motion.div key="menu" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }} className="h-full overflow-y-auto px-6 py-5">
            <LabMenu
              heading="AI Systems Lab"
              blurb="An AI feature is a system, not a model. Design the parts around the model — grounding, guardrails, evaluation, rollout — and watch how each choice changes what you can trust."
              scenarios={SCENARIOS}
              progress={labProgress}
              onSelect={handleSelect}
            />
          </motion.div>
        )}

        {phase === 'intro' && (
          <motion.div key="intro" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }} className="h-full px-6 py-5">
            <LabIntro eyebrow="AI Systems Lab" scenario={scenario} onBegin={() => setPhase('decide')} />
          </motion.div>
        )}

        {phase === 'decide' && current && (
          <motion.div key={`decide-${index}-${showOutcome}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }} className="h-full overflow-y-auto px-6 py-5">
            {!showOutcome ? (
              <div className="max-w-2xl">
                <Chip tone="purple">Decision {index + 1} / {scenario.decisions.length}</Chip>
                <h3 className="text-[15px] text-neutral-200 mt-2 mb-1">{current.question}</h3>
                <p className="text-[12px] text-neutral-500 leading-relaxed mb-4">{current.framing}</p>
                <div className="space-y-2">
                  {current.choices.map((ch) => (
                    <button key={ch.id} onClick={() => handleChoose(ch.id)}
                      className="w-full text-left px-4 py-3 rounded-xl transition-all hover:translate-x-1 active:scale-[0.995]"
                      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', pointerEvents: 'auto', cursor: 'pointer' }}>
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-[13px] text-neutral-200">{ch.label}</span>
                        <span className="text-[10px] font-mono text-neutral-600">{ch.subtitle}</span>
                      </div>
                      <p className="text-[11px] text-neutral-500 mt-1">{ch.summary}</p>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="max-w-2xl">
                <div className="flex items-center gap-2 mb-3">
                  <Chip tone="gold">{lastChoice?.label}</Chip>
                  <span className="text-[10px] font-mono text-neutral-600">{lastChoice?.subtitle}</span>
                </div>
                <p className="text-[13px] text-neutral-300 leading-relaxed mb-4">{lastChoice?.feedback}</p>
                <PrimaryButton onClick={handleContinue}>{index < scenario.decisions.length - 1 ? 'Next decision' : 'Assemble architecture →'}</PrimaryButton>
              </div>
            )}
          </motion.div>
        )}

        {phase === 'architecture' && computed && (
          <motion.div key="architecture" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }} className="h-full overflow-y-auto px-6 py-5">
            <SectionLabel className="mb-2">System architecture</SectionLabel>
            <p className="text-[12px] text-neutral-500 mb-3 max-w-2xl">This is the AI system your decisions describe. Read it end to end — every part has to hold up for the whole to be trustworthy.</p>
            <div className="rounded-xl p-4 mb-5 max-w-2xl space-y-1.5" style={{ background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(255,255,255,0.06)' }}>
              {computed.contract.map((line, i) => (
                <div key={i} className="flex items-start gap-2 text-[12px] font-mono">
                  <span className="text-[#6d5cfc]">▸</span>
                  <span className="text-neutral-300">{line}</span>
                </div>
              ))}
            </div>
            <PrimaryButton onClick={handleReview}>Review decisions</PrimaryButton>
          </motion.div>
        )}

        {phase === 'result' && computed && (
          <motion.div key="result" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }} className="h-full px-6 py-5">
            <ResultScreen
              heading="AI Systems Review"
              score={computed.score}
              gradeText={grade(computed.score)}
              dimensions={DIMENSIONS}
              breakdown={computed.dims}
              narrativeTitle="How I would design it"
              narrative={scenario.reference.narrative}
              lessons={scenario.reference.lessons}
              badge={prevBestRef.current === null ? 'First attempt' : `Previous best ${prevBestRef.current}`}
              onReplay={() => { recordedRef.current = false; setIndex(0); setChoiceIds([]); setShowOutcome(false); setPhase('decide') }}
              onBack={() => setPhase('menu')}
            >
              <Card className="p-3.5 mb-4 space-y-2">
                <SectionLabel className="mb-1">Decisions</SectionLabel>
                {scenario.decisions.map((d, i) => {
                  const ch = d.choices.find((c) => c.id === choiceIds[i])
                  const preferred = scenario.reference.preferredIds.includes(choiceIds[i])
                  return (
                    <div key={d.id} className="flex items-center justify-between gap-3 text-[11px] font-mono">
                      <span className="text-neutral-500 truncate">{d.question}</span>
                      <span className="shrink-0" style={{ color: preferred ? '#4ade80' : '#d4af37' }}>{ch?.label}</span>
                    </div>
                  )
                })}
              </Card>
            </ResultScreen>
          </motion.div>
        )}
      </AnimatePresence>
    </LabShell>
  )
}
