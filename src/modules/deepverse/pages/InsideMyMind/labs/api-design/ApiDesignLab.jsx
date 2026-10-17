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

const STEPS = ['Brief', 'Design', 'Contract', 'Review']

export default function ApiDesignLab({ onBack }) {
  const recordLabResult = useBrainStore((s) => s.recordLabResult)
  const labProgress = useBrainStore((s) => s.labProgress['api-design'])

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
    const contract = []
    scenario.decisions.forEach((d, i) => {
      const ch = d.choices.find((c) => c.id === choiceIds[i])
      if (!ch) return
      dims = applyDeltas(dims, DIMENSIONS, ch.dims)
      if (ch.contract) contract.push(...ch.contract)
    })
    return { dims, contract, score: totalScore(dims, DIMENSIONS) }
  }, [scenario, choiceIds])

  const handleSelect = (s) => { recordedRef.current = false; prevBestRef.current = null; setScenario(s); setIndex(0); setChoiceIds([]); setShowOutcome(false); setPhase('intro') }
  const handleChoose = (id) => { setChoiceIds((prev) => { const next = [...prev]; next[index] = id; return next }); setShowOutcome(true) }
  const handleContinue = () => {
    setShowOutcome(false)
    if (index < scenario.decisions.length - 1) setIndex((i) => i + 1)
    else {
      prevBestRef.current = useBrainStore.getState().labProgress['api-design']?.[scenario.id]?.bestScore ?? null
      setPhase('contract')
    }
  }
  const handleReview = () => {
    if (!recordedRef.current) { recordedRef.current = true; recordLabResult('api-design', scenario.id, computed.score, { metGoal: computed.score >= 70 }) }
    setPhase('result')
  }
  const backLabel = phase === 'menu' ? '← Back to Brain OS' : '← Menu'
  const handleBack = () => (phase === 'menu' ? onBack() : setPhase('menu'))
  const stepIndex = phase === 'result' ? 3 : phase === 'contract' ? 2 : showOutcome ? 2 : 1

  return (
    <LabShell
      title={scenario?.title || 'API Design Lab'}
      tag={scenario?.tag}
      steps={STEPS}
      currentStep={phase === 'intro' || phase === 'menu' ? 0 : stepIndex}
      onBack={handleBack}
      backLabel={backLabel}
      size="w-[min(960px,95vw)] h-[min(700px,92vh)]"
    >
      <AnimatePresence mode="wait">
        {phase === 'menu' && (
          <motion.div key="menu" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }} className="h-full overflow-y-auto px-6 py-5">
            <LabMenu
              heading="API Architecture Lab"
              blurb="Design an API decision by decision and watch the contract assemble. Every convention you pick compounds — for better or worse."
              scenarios={SCENARIOS}
              progress={labProgress}
              onSelect={handleSelect}
            />
          </motion.div>
        )}

        {phase === 'intro' && (
          <motion.div key="intro" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }} className="h-full px-6 py-5">
            <LabIntro eyebrow="API Architecture Lab" scenario={scenario} onBegin={() => setPhase('decide')} />
          </motion.div>
        )}

        {phase === 'decide' && current && (
          <motion.div key={`decide-${index}-${showOutcome}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }} className="h-full overflow-y-auto px-6 py-5">
            {!showOutcome ? (
              <div className="max-w-2xl">
                <div className="flex items-center gap-2 mb-2">
                  <Chip tone="purple">Decision {index + 1} / {scenario.decisions.length}</Chip>
                </div>
                <h3 className="text-[15px] text-neutral-200 mb-1">{current.question}</h3>
                <p className="text-[12px] text-neutral-500 leading-relaxed mb-4">{current.framing}</p>
                <div className="space-y-2">
                  {current.choices.map((ch) => (
                    <button
                      key={ch.id}
                      onClick={() => handleChoose(ch.id)}
                      className="w-full text-left px-4 py-3 rounded-xl transition-all hover:translate-x-1 active:scale-[0.995]"
                      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
                    >
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
                {lastChoice?.contract && (
                  <div className="rounded-xl p-3 mb-4 font-mono text-[11px]" style={{ background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div className="text-neutral-600 mb-1">contract updated</div>
                    {lastChoice.contract.map((line, i) => <div key={i} className="text-[#98c379]">+ {line}</div>)}
                  </div>
                )}
                <PrimaryButton onClick={handleContinue}>{index < scenario.decisions.length - 1 ? 'Next decision' : 'Assemble contract →'}</PrimaryButton>
              </div>
            )}
          </motion.div>
        )}

        {phase === 'contract' && computed && (
          <motion.div key="contract" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }} className="h-full overflow-y-auto px-6 py-5">
            <SectionLabel className="mb-2">Generated API contract</SectionLabel>
            <p className="text-[12px] text-neutral-500 mb-3 max-w-2xl">Here is the surface your decisions produced. Read it as a partner would — is it consistent, predictable and safe?</p>
            <div className="rounded-xl p-4 mb-5 font-mono text-[12px] max-w-2xl" style={{ background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(255,255,255,0.06)' }}>
              {computed.contract.map((line, i) => <div key={i} className="text-neutral-300 py-0.5">{line}</div>)}
            </div>
            <PrimaryButton onClick={handleReview}>Review decisions</PrimaryButton>
          </motion.div>
        )}

        {phase === 'result' && computed && (
          <motion.div key="result" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }} className="h-full px-6 py-5">
            <ResultScreen
              heading="API Review"
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
              <Card className="p-3.5 mb-4">
                <SectionLabel className="mb-2">Decisions</SectionLabel>
                <div className="space-y-2">
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
                </div>
              </Card>
            </ResultScreen>
          </motion.div>
        )}
      </AnimatePresence>
    </LabShell>
  )
}
