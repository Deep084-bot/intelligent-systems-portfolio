import { useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import LabShell from '../kit/LabShell'
import LabMenu from '../kit/LabMenu'
import LabIntro from '../kit/LabIntro'
import ResultScreen from '../kit/ResultScreen'
import { Card, SectionLabel, Chip, PrimaryButton } from '../kit/ui'
import { DIMENSIONS, SCENARIOS } from './data'
import { clamp } from '../kit/scoring'
import useBrainStore from '../../store'

const STEPS = ['Brief', 'Assign', 'Review']

function scoreFor(workload, engineId) {
  if (!engineId) return 0
  if (engineId === workload.best) return 100
  if (workload.acceptable?.includes(engineId)) return 70
  return 20
}

export default function DatabasesLab({ onBack }) {
  const recordLabResult = useBrainStore((s) => s.recordLabResult)
  const labProgress = useBrainStore((s) => s.labProgress.databases)

  const [scenario, setScenario] = useState(null)
  const [phase, setPhase] = useState('menu')
  const [assign, setAssign] = useState({})
  const recordedRef = useRef(false)
  const prevBestRef = useRef(null)

  const result = useMemo(() => {
    if (!scenario) return null
    const scores = scenario.workloads.map((wl) => ({ wl, engineId: assign[wl.id], score: scoreFor(wl, assign[wl.id]) }))
    const avg = (list) => (list.length ? Math.round(list.reduce((s, x) => s + x, 0) / list.length) : 50)
    const dim = (key) => {
      const list = scores.filter((s) => s.wl.dims?.includes(key)).map((s) => s.score)
      return list.length ? avg(list) : 50
    }
    const dims = {
      fit: avg(scores.map((s) => s.score)),
      modeling: dim('modeling'),
      performance: dim('performance'),
      search: dim('search'),
      consistency: dim('consistency'),
    }
    const allAssigned = scenario.workloads.every((wl) => assign[wl.id])
    const bestCount = scores.filter((s) => s.score === 100).length
    const metGoal = allAssigned && bestCount >= Math.ceil(scenario.workloads.length * 0.8)
    const overall = Math.round(DIMENSIONS.reduce((s, d) => s + clamp(dims[d.id]), 0) / DIMENSIONS.length)
    return { scores, dims, overall, metGoal, bestCount, allAssigned }
  }, [scenario, assign])

  const handleSelect = (s) => { recordedRef.current = false; prevBestRef.current = null; setScenario(s); setAssign({}); setPhase('intro') }
  const handleShip = () => {
    prevBestRef.current = useBrainStore.getState().labProgress.databases?.[scenario.id]?.bestScore ?? null
    if (!recordedRef.current) { recordedRef.current = true; recordLabResult('databases', scenario.id, result.overall, { metGoal: result.metGoal }) }
    setPhase('result')
  }
  const backLabel = phase === 'menu' ? '← Back to Brain OS' : '← Menu'
  const handleBack = () => (phase === 'menu' ? onBack() : setPhase('menu'))

  return (
    <LabShell
      title={scenario?.title || 'Databases Lab'}
      tag={scenario?.tag}
      steps={STEPS}
      currentStep={phase === 'result' ? 2 : phase === 'board' ? 1 : phase === 'intro' ? 0 : -1}
      onBack={handleBack}
      backLabel={backLabel}
      size="w-[min(1040px,95vw)] h-[min(720px,92vh)]"
    >
      <AnimatePresence mode="wait">
        {phase === 'menu' && (
          <motion.div key="menu" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }} className="h-full overflow-y-auto px-6 py-5">
            <LabMenu
              heading="Data Architecture Lab"
              blurb="Every workload has a shape. Assign each data need to the storage engine that actually fits — schema, consistency and access pattern decide, not familiarity."
              scenarios={SCENARIOS}
              progress={labProgress}
              onSelect={handleSelect}
            />
          </motion.div>
        )}

        {phase === 'intro' && (
          <motion.div key="intro" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }} className="h-full px-6 py-5">
            <LabIntro eyebrow="Data Architecture Lab" scenario={scenario} onBegin={() => setPhase('board')} />
          </motion.div>
        )}

        {phase === 'board' && (
          <motion.div key="board" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }} className="h-full flex flex-col">
            <div className="flex-1 min-h-0 overflow-y-auto px-5 py-4 space-y-3">
              {scenario.workloads.map((wl) => (
                <Card key={wl.id} className="p-3.5">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="min-w-0">
                      <div className="text-[12.5px] text-neutral-200">{wl.label}</div>
                      <div className="text-[11px] text-neutral-500 mt-0.5">{wl.description}</div>
                    </div>
                    {assign[wl.id] && <Chip tone="purple">{scenario.engines.find((e) => e.id === assign[wl.id])?.label}</Chip>}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {scenario.engines.map((en) => {
                      const on = assign[wl.id] === en.id
                      return (
                        <button
                          key={en.id}
                          onClick={() => setAssign((prev) => ({ ...prev, [wl.id]: on ? null : en.id }))}
                          className="px-2.5 py-1.5 rounded-lg text-left transition-all active:scale-[0.97]"
                          style={{ background: on ? 'rgba(109,92,252,0.16)' : 'rgba(255,255,255,0.03)', border: on ? '1px solid rgba(109,92,252,0.45)' : '1px solid rgba(255,255,255,0.06)' }}
                        >
                          <div className="text-[11px] text-neutral-200">{en.label}</div>
                          <div className="text-[9px] font-mono text-neutral-600">{en.blurb}</div>
                        </button>
                      )
                    })}
                  </div>
                </Card>
              ))}
            </div>
            <div className="shrink-0 px-5 py-3 border-t flex items-center justify-between" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
              <span className="text-[11px] font-mono text-neutral-600">
                {Object.values(assign).filter(Boolean).length} / {scenario.workloads.length} assigned
              </span>
              <PrimaryButton onClick={handleShip} disabled={!result.allAssigned}>Review architecture</PrimaryButton>
            </div>
          </motion.div>
        )}

        {phase === 'result' && result && (
          <motion.div key="result" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }} className="h-full px-6 py-5">
            <ResultScreen
              heading="Data Architecture Review"
              score={result.overall}
              gradeText={`${result.bestCount} / ${scenario.workloads.length} best-fit matches`}
              dimensions={DIMENSIONS}
              breakdown={result.dims}
              narrativeTitle="How I would map it"
              narrative={scenario.reference.narrative}
              lessons={scenario.reference.lessons}
              badge={prevBestRef.current === null ? 'First attempt' : `Previous best ${prevBestRef.current}`}
              onReplay={() => { recordedRef.current = false; setPhase('board') }}
              onBack={() => setPhase('menu')}
            >
              <Card className="p-3.5 mb-4 space-y-2">
                <SectionLabel className="mb-1">Match detail</SectionLabel>
                {result.scores.map(({ wl, engineId, score }) => {
                  const best = scenario.engines.find((e) => e.id === wl.best)
                  const chosen = scenario.engines.find((e) => e.id === engineId)
                  const tone = score === 100 ? '#4ade80' : score === 70 ? '#d4af37' : '#f87171'
                  return (
                    <div key={wl.id} className="flex items-center justify-between gap-3 text-[11px] font-mono">
                      <span className="text-neutral-400 truncate">{wl.label}</span>
                      <span className="shrink-0" style={{ color: tone }}>
                        {chosen?.label} {score === 100 ? '✓' : `→ best: ${best?.label}`}
                      </span>
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
