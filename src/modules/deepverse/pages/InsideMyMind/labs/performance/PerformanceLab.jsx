import { useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import LabShell from '../kit/LabShell'
import LabMenu from '../kit/LabMenu'
import LabIntro from '../kit/LabIntro'
import ResultScreen from '../kit/ResultScreen'
import { Card, SectionLabel, Chip, Bar, PrimaryButton } from '../kit/ui'
import { DIMENSIONS, SCENARIOS } from './data'
import { initialScores, applyDeltas, totalScore, grade, clamp } from '../kit/scoring'
import useBrainStore from '../../store'

const STEPS = ['Brief', 'Optimize', 'Review']

function computeMetrics(scenario, selected) {
  const m = { ...scenario.baseline }
  for (const id of selected) {
    const move = scenario.moves.find((x) => x.id === id)
    if (!move) continue
    for (const [k, d] of Object.entries(move.deltas)) m[k] = Math.max(0, m[k] + d)
  }
  return m
}

export default function PerformanceLab({ onBack }) {
  const recordLabResult = useBrainStore((s) => s.recordLabResult)
  const labProgress = useBrainStore((s) => s.labProgress.performance)

  const [scenario, setScenario] = useState(null)
  const [phase, setPhase] = useState('menu')
  const [selected, setSelected] = useState([])
  const recordedRef = useRef(false)
  const prevBestRef = useRef(null)

  const metrics = useMemo(() => (scenario ? computeMetrics(scenario, selected) : null), [scenario, selected])
  const result = useMemo(() => {
    if (!scenario || !metrics) return null
    let dims = initialScores(DIMENSIONS)
    for (const id of selected) {
      const move = scenario.moves.find((x) => x.id === id)
      if (move?.dims) dims = applyDeltas(dims, DIMENSIONS, move.dims)
    }
    if (metrics.latency <= scenario.target) dims.latency = clamp(dims.latency + 22)
    else dims.latency = clamp(dims.latency - 40)
    if (metrics.cost <= scenario.budget.cost) dims.cost = clamp(dims.cost + 14)
    else dims.cost = clamp(dims.cost - 40)
    if (metrics.complexity <= scenario.budget.complexity) dims.simplicity = clamp(dims.simplicity + 14)
    else dims.simplicity = clamp(dims.simplicity - 35)
    const metGoal = metrics.latency <= scenario.target && metrics.cost <= scenario.budget.cost
    return { dims, score: totalScore(dims, DIMENSIONS), metGoal }
  }, [scenario, metrics, selected])

  const toggle = (id) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))

  const handleSelect = (s) => {
    recordedRef.current = false
    prevBestRef.current = null
    setScenario(s)
    setSelected([])
    setPhase('intro')
  }

  const handleShip = () => {
    prevBestRef.current = useBrainStore.getState().labProgress.performance?.[scenario.id]?.bestScore ?? null
    if (!recordedRef.current) {
      recordedRef.current = true
      recordLabResult('performance', scenario.id, Math.round(result.score), { metGoal: result.metGoal })
    }
    setPhase('result')
  }

  const backLabel = phase === 'menu' ? '← Back to Brain OS' : '← Menu'
  const handleBack = () => (phase === 'menu' ? onBack() : setPhase('menu'))

  return (
    <LabShell
      title={scenario?.title || 'Performance Lab'}
      tag={scenario?.tag}
      steps={STEPS}
      currentStep={phase === 'result' ? 2 : phase === 'board' ? 1 : phase === 'intro' ? 0 : -1}
      onBack={handleBack}
      backLabel={backLabel}
      size="w-[min(1000px,95vw)] h-[min(700px,92vh)]"
    >
      <AnimatePresence mode="wait">
        {phase === 'menu' && (
          <motion.div key="menu" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }} className="h-full overflow-y-auto px-6 py-5">
            <LabMenu
              heading="Performance · Latency Lab"
              blurb="Find the bottleneck, then fix it within a budget. Every optimization has a cost — latency, money, and complexity pull against each other."
              scenarios={SCENARIOS}
              progress={labProgress}
              onSelect={handleSelect}
            />
          </motion.div>
        )}

        {phase === 'intro' && (
          <motion.div key="intro" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }} className="h-full px-6 py-5">
            <LabIntro eyebrow="Latency Optimization Lab" scenario={scenario} onBegin={() => setPhase('board')} />
          </motion.div>
        )}

        {phase === 'board' && (
          <motion.div key="board" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }} className="h-full flex flex-col">
            <div className="flex-1 min-h-0 grid md:grid-cols-[1.4fr_1fr] gap-4 px-5 py-4 overflow-hidden">
              <div className="min-h-0 overflow-y-auto pr-1 space-y-2">
                <SectionLabel className="mb-1">Optimizations</SectionLabel>
                {scenario.moves.map((move) => {
                  const on = selected.includes(move.id)
                  return (
                    <button
                      key={move.id}
                      onClick={() => toggle(move.id)}
                      className="w-full text-left px-3.5 py-2.5 rounded-xl transition-all active:scale-[0.995]"
                      style={{
                        background: on ? 'rgba(109,92,252,0.1)' : 'rgba(255,255,255,0.03)',
                        border: on ? '1px solid rgba(109,92,252,0.4)' : '1px solid rgba(255,255,255,0.06)',
                      }}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="w-3.5 h-3.5 rounded-md shrink-0 flex items-center justify-center text-[9px]" style={{ background: on ? '#6d5cfc' : 'rgba(255,255,255,0.06)', color: on ? '#fff' : 'transparent' }}>✓</span>
                          <span className="text-[12.5px] text-neutral-200 truncate">{move.label}</span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {move.deltas.latency ? <Chip tone="green">{move.deltas.latency > 0 ? '+' : ''}{move.deltas.latency}ms</Chip> : null}
                          {move.deltas.cost ? <Chip tone={move.deltas.cost > 0 ? 'red' : 'green'}>{move.deltas.cost > 0 ? '+' : ''}${move.deltas.cost}</Chip> : null}
                          {move.deltas.complexity ? <Chip tone="gold">cx {move.deltas.complexity > 0 ? '+' : ''}{move.deltas.complexity}</Chip> : null}
                        </div>
                      </div>
                      <p className="text-[11px] text-neutral-500 mt-1 leading-snug">{move.description}</p>
                    </button>
                  )
                })}
              </div>

              <div className="min-h-0 overflow-y-auto pr-1">
                <Card className="p-4 mb-3">
                  <SectionLabel className="mb-3">Live metrics</SectionLabel>
                  <div className="space-y-3">
                    <MetricRow label="p95 Latency" value={metrics.latency} unit="ms" target={scenario.target} lowerIsBetter />
                    <MetricRow label="Infra Cost" value={metrics.cost} unit="$/mo" target={scenario.budget.cost} lowerIsBetter />
                    <MetricRow label="Complexity" value={metrics.complexity} target={scenario.budget.complexity} lowerIsBetter />
                    <MetricRow label="CPU" value={metrics.cpu} unit="%" lowerIsBetter />
                  </div>
                </Card>
                <Card className="p-4" style={{ background: result?.metGoal ? 'rgba(74,222,128,0.06)' : 'rgba(248,113,113,0.05)', border: result?.metGoal ? '1px solid rgba(74,222,128,0.3)' : '1px solid rgba(248,113,113,0.2)' }}>
                  <div className="text-[11px] font-mono" style={{ color: result?.metGoal ? '#4ade80' : '#f87171' }}>
                    {metrics.latency <= scenario.target ? '✓' : '✗'} p95 target {scenario.target}ms
                  </div>
                  <div className="text-[11px] font-mono mt-1" style={{ color: metrics.cost <= scenario.budget.cost ? '#4ade80' : '#f87171' }}>
                    {metrics.cost <= scenario.budget.cost ? '✓' : '✗'} cost budget ${scenario.budget.cost}/mo
                  </div>
                </Card>
              </div>
            </div>
            <div className="shrink-0 px-5 py-3 border-t flex items-center justify-between" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
              <span className="text-[11px] font-mono text-neutral-600">{selected.length} optimization{selected.length === 1 ? '' : 's'} applied</span>
              <PrimaryButton onClick={handleShip}>Ship &amp; review</PrimaryButton>
            </div>
          </motion.div>
        )}

        {phase === 'result' && result && (
          <motion.div key="result" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }} className="h-full px-6 py-5">
            <ResultScreen
              heading="Performance Review"
              score={result.score}
              gradeText={grade(result.score)}
              dimensions={DIMENSIONS}
              breakdown={result.dims}
              narrativeTitle="What I would do"
              narrative={scenario.reference.narrative}
              lessons={scenario.reference.lessons}
              badge={prevBestRef.current === null ? 'First attempt' : `Previous best ${prevBestRef.current}`}
              onReplay={() => { recordedRef.current = false; setSelected([]); setPhase('board') }}
              onBack={() => setPhase('menu')}
            >
              <Card className="p-3.5 mb-4">
                <SectionLabel className="mb-2">Shipped configuration</SectionLabel>
                <div className="flex flex-wrap gap-1.5">
                  {selected.length === 0 && <span className="text-[11px] text-neutral-600 font-mono">No changes shipped</span>}
                  {selected.map((id) => {
                    const mv = scenario.moves.find((m) => m.id === id)
                    return <Chip key={id} tone="purple">{mv?.label}</Chip>
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

function MetricRow({ label, value, unit, target, lowerIsBetter }) {
  const met = target !== undefined ? (lowerIsBetter ? value <= target : value >= target) : null
  return (
    <div>
      <div className="flex justify-between items-baseline mb-1">
        <span className="text-[10px] font-mono text-neutral-500">{label}</span>
        <span className="text-[13px] font-mono" style={{ color: met === null ? '#e4e4e7' : met ? '#4ade80' : '#f87171' }}>
          {value}{unit ? <span className="text-[10px] text-neutral-600 ml-0.5">{unit}</span> : null}
        </span>
      </div>
      {target !== undefined && <Bar value={value} max={Math.max(value, target) * 1.4} tone={met ? 'green' : 'red'} height={3} />}
    </div>
  )
}
