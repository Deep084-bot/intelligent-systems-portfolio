import { useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import LabShell from '../kit/LabShell'
import LabMenu from '../kit/LabMenu'
import LabIntro from '../kit/LabIntro'
import ResultScreen from '../kit/ResultScreen'
import { Card, SectionLabel, Chip, PrimaryButton } from '../kit/ui'
import { DIMENSIONS, SCENARIOS, shuffleStages, scorePipeline } from './data'
import useBrainStore from '../../store'

const STEPS = ['Brief', 'Order pipeline', 'Review']

export default function MachineLearningLab({ onBack }) {
  const recordLabResult = useBrainStore((s) => s.recordLabResult)
  const labProgress = useBrainStore((s) => s.labProgress['machine-learning'])

  const [scenario, setScenario] = useState(null)
  const [phase, setPhase] = useState('menu')
  const [order, setOrder] = useState([])
  const [excluded, setExcluded] = useState(() => new Set())
  const recordedRef = useRef(false)
  const prevBestRef = useRef(null)

  const byId = useMemo(() => (scenario ? Object.fromEntries(scenario.stages.map((s) => [s.id, s])) : {}), [scenario])
  const result = useMemo(() => (scenario ? scorePipeline(scenario, order, excluded) : null), [scenario, order, excluded])

  const handleSelect = (s) => {
    recordedRef.current = false; prevBestRef.current = null
    setScenario(s); setOrder(shuffleStages(s.stages)); setExcluded(new Set()); setPhase('intro')
  }
  const move = (i, dir) => {
    setOrder((prev) => {
      const j = i + dir
      if (j < 0 || j >= prev.length) return prev
      const next = [...prev]
      ;[next[i], next[j]] = [next[j], next[i]]
      return next
    })
  }
  const toggleExclude = (id) => {
    setExcluded((prev) => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next })
  }
  const handleShip = () => {
    prevBestRef.current = useBrainStore.getState().labProgress['machine-learning']?.[scenario.id]?.bestScore ?? null
    if (!recordedRef.current) {
      recordedRef.current = true
      const overall = Math.round(DIMENSIONS.reduce((s, d) => s + (result.dims[d.id] || 0), 0) / DIMENSIONS.length)
      recordLabResult('machine-learning', scenario.id, overall, { metGoal: result.metGoal })
    }
    setPhase('result')
  }
  const backLabel = phase === 'menu' ? '← Back to Brain OS' : '← Menu'
  const handleBack = () => (phase === 'menu' ? onBack() : setPhase('menu'))
  const overall = result ? Math.round(DIMENSIONS.reduce((s, d) => s + (result.dims[d.id] || 0), 0) / DIMENSIONS.length) : 0

  return (
    <LabShell
      title={scenario?.title || 'Machine Learning Lab'}
      tag={scenario?.tag}
      steps={STEPS}
      currentStep={phase === 'result' ? 2 : phase === 'build' ? 1 : phase === 'intro' ? 0 : -1}
      onBack={handleBack}
      backLabel={backLabel}
      size="w-[min(1000px,95vw)] h-[min(720px,92vh)]"
    >
      <AnimatePresence mode="wait">
        {phase === 'menu' && (
          <motion.div key="menu" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }} className="h-full overflow-y-auto px-6 py-5">
            <LabMenu
              heading="ML Engineering Lab"
              blurb="Build a training pipeline in the right order. The order is not cosmetic — data leakage, unreproducible runs and silent production failures all come from getting the sequence wrong."
              scenarios={SCENARIOS}
              progress={labProgress}
              onSelect={handleSelect}
            />
          </motion.div>
        )}

        {phase === 'intro' && (
          <motion.div key="intro" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }} className="h-full px-6 py-5">
            <LabIntro eyebrow="ML Engineering Lab" scenario={scenario} onBegin={() => setPhase('build')} />
          </motion.div>
        )}

        {phase === 'build' && (
          <motion.div key="build" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }} className="h-full flex flex-col">
            <div className="flex-1 min-h-0 overflow-y-auto px-5 py-4 space-y-2">
              {order.map((id, i) => {
                const s = byId[id]
                if (!s) return null
                const isExcluded = excluded.has(id)
                return (
                  <div key={id} className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 transition-all"
                    style={{ background: isExcluded ? 'rgba(248,113,113,0.06)' : 'rgba(255,255,255,0.03)', border: isExcluded ? '1px solid rgba(248,113,113,0.25)' : '1px solid rgba(255,255,255,0.06)', opacity: isExcluded ? 0.7 : 1 }}>
                    <span className="text-[11px] font-mono text-neutral-600 w-5 text-right shrink-0">{isExcluded ? '—' : i + 1}</span>
                    <span className="flex-1 text-[12.5px] text-neutral-300" style={{ textDecoration: isExcluded ? 'line-through' : 'none' }}>{s.label}</span>
                    <div className="flex items-center gap-1 shrink-0">
                      <IconBtn onClick={() => move(i, -1)} disabled={i === 0} label="↑" />
                      <IconBtn onClick={() => move(i, 1)} disabled={i === order.length - 1} label="↓" />
                      <button onClick={() => toggleExclude(id)}
                        className="px-2 py-1 rounded-md text-[10px] font-mono transition-all"
                        style={{ background: isExcluded ? 'rgba(248,113,113,0.15)' : 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: isExcluded ? '#f87171' : '#a1a1aa' }}>
                        {isExcluded ? 'include' : 'exclude'}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="shrink-0 px-5 py-3 border-t flex items-center justify-between" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
              <span className="text-[11px] font-mono text-neutral-600">
                {excluded.size} excluded · put the pipeline in order, then remove the anti-pattern
              </span>
              <PrimaryButton onClick={handleShip}>Run pipeline</PrimaryButton>
            </div>
          </motion.div>
        )}

        {phase === 'result' && result && (
          <motion.div key="result" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }} className="h-full px-6 py-5">
            <ResultScreen
              heading="Pipeline Review"
              score={overall}
              gradeText={`${result.matches} / ${result.validCount} stages in place${result.trapsRemoved ? ' · anti-pattern removed' : ''}`}
              dimensions={DIMENSIONS}
              breakdown={result.dims}
              narrativeTitle="The order that holds up"
              narrative={scenario.reference?.narrative || buildNarrative(scenario, result)}
              lessons={scenario.reference?.lessons || buildLessons(scenario)}
              badge={prevBestRef.current === null ? 'First attempt' : `Previous best ${prevBestRef.current}`}
              onReplay={() => { recordedRef.current = false; setPhase('build') }}
              onBack={() => setPhase('menu')}
            >
              <Card className="p-3.5 mb-4">
                <SectionLabel className="mb-2">Correct sequence</SectionLabel>
                <div className="space-y-1.5">
                  {scenario.stages.filter((s) => !s.trap).slice().sort((a, b) => a.order - b.order).map((s) => {
                    const inPlace = !excluded.has(s.id) && result.correctMap[s.id]
                    return (
                      <div key={s.id} className="flex items-start gap-2 text-[11px]">
                        <span style={{ color: inPlace ? '#4ade80' : '#d4af37' }}>{inPlace ? '✓' : '·'}</span>
                        <span className="text-neutral-400">{s.order}. {s.label}</span>
                      </div>
                    )
                  })}
                  {scenario.stages.filter((s) => s.trap).map((s) => (
                    <div key={s.id} className="flex items-start gap-2 text-[11px] pt-1">
                      <span style={{ color: excluded.has(s.id) ? '#4ade80' : '#f87171' }}>{excluded.has(s.id) ? '⊘ removed' : '✗ included'}</span>
                      <span className="text-neutral-500">{s.label}</span>
                    </div>
                  ))}
                </div>
              </Card>
            </ResultScreen>
          </motion.div>
        )}
      </AnimatePresence>
    </LabShell>
  )
}

function IconBtn({ onClick, disabled, label }) {
  return (
    <button onClick={onClick} disabled={disabled}
      className="w-6 h-6 rounded-md text-[11px] font-mono text-neutral-400 transition-all disabled:opacity-25 hover:text-neutral-200"
      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
      {label}
    </button>
  )
}

function buildNarrative(scenario, result) {
  return `The pipeline has a natural order, and each step depends on the ones before it: ${scenario.stages.filter((s) => !s.trap).slice().sort((a, b) => a.order - b.order).map((s) => s.label.toLowerCase()).join(', then ')}. You placed ${result.matches} of ${result.validCount} correctly${result.trapsRemoved ? ' and removed the anti-pattern' : ' and left the anti-pattern in the pipeline'}.`
}

function buildLessons() {
  return [
    'Split before you transform, or you leak the test set.',
    'Tune on validation, never on the test set.',
    'Version the model and its data for reproducibility.',
    'A deployed model needs monitoring, not just training.',
  ]
}
