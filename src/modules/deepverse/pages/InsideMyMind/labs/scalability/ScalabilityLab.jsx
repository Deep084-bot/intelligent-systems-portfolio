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

const STEPS = ['Brief', 'Plan', 'Review']
const REDUNDANT = ['load-balancer', 'lb']

function simulate(scenario, selected) {
  let capacity = scenario.baseline.capacity
  let cost = scenario.baseline.cost
  let complexity = scenario.baseline.complexity
  for (const id of selected) {
    const mv = scenario.moves.find((m) => m.id === id)
    if (!mv) continue
    capacity += mv.adds.capacity
    cost += mv.adds.cost
    complexity += mv.adds.complexity
  }
  const util = scenario.maxLoad / capacity
  const latency = Math.round(scenario.baseline.latency * (0.6 + util * 1.2))
  let availability
  if (util > 1) availability = 0
  else if (util > 0.9) availability = 99.0
  else if (util > 0.75) availability = 99.9
  else availability = 99.99
  const hasRedundancy = selected.some((id) => REDUNDANT.includes(id))
  if (!hasRedundancy) availability = Math.min(availability, 99.0)
  return { capacity, cost, complexity, util, latency, availability: Math.round(availability * 100) / 100 }
}

export default function ScalabilityLab({ onBack }) {
  const recordLabResult = useBrainStore((s) => s.recordLabResult)
  const labProgress = useBrainStore((s) => s.labProgress.scalability)

  const [scenario, setScenario] = useState(null)
  const [phase, setPhase] = useState('menu')
  const [selected, setSelected] = useState([])
  const recordedRef = useRef(false)
  const prevBestRef = useRef(null)

  const sim = useMemo(() => (scenario ? simulate(scenario, selected) : null), [scenario, selected])

  const result = useMemo(() => {
    if (!scenario || !sim) return null
    let dims = initialScores(DIMENSIONS)
    for (const id of selected) {
      const mv = scenario.moves.find((m) => m.id === id)
      if (mv?.dims) dims = applyDeltas(dims, DIMENSIONS, mv.dims)
    }
    if (sim.availability >= scenario.target.availability) dims.availability = clamp(dims.availability + 18)
    else dims.availability = clamp(dims.availability - 45)
    if (sim.latency <= scenario.target.latency) dims.capacity = clamp(dims.capacity + 20)
    else dims.capacity = clamp(dims.capacity - 30)
    if (sim.cost <= scenario.budget.cost) dims.cost = clamp(dims.cost + 14)
    else dims.cost = clamp(dims.cost - 40)
    if (sim.complexity <= scenario.budget.complexity) dims.simplicity = clamp(dims.simplicity + 14)
    else dims.simplicity = clamp(dims.simplicity - 35)
    const metGoal = sim.availability >= scenario.target.availability && sim.latency <= scenario.target.latency && sim.cost <= scenario.budget.cost
    return { dims, score: totalScore(dims, DIMENSIONS), metGoal }
  }, [scenario, sim, selected])

  const toggle = (id) => setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))

  const handleSelect = (s) => { recordedRef.current = false; prevBestRef.current = null; setScenario(s); setSelected([]); setPhase('intro') }
  const handleShip = () => {
    prevBestRef.current = useBrainStore.getState().labProgress.scalability?.[scenario.id]?.bestScore ?? null
    if (!recordedRef.current) { recordedRef.current = true; recordLabResult('scalability', scenario.id, Math.round(result.score), { metGoal: result.metGoal }) }
    setPhase('result')
  }
  const backLabel = phase === 'menu' ? '← Back to Brain OS' : '← Menu'
  const handleBack = () => (phase === 'menu' ? onBack() : setPhase('menu'))

  const fmt = (n) => (n >= 1000 ? `${(n / 1000).toFixed(n >= 100000 ? 0 : 0)}k` : n)

  return (
    <LabShell
      title={scenario?.title || 'Scalability Lab'}
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
              heading="Scalability · Capacity Lab"
              blurb="Traffic is coming. Choose a capacity strategy that holds availability and latency without wasting the budget or drowning your team in operational complexity."
              scenarios={SCENARIOS}
              progress={labProgress}
              onSelect={handleSelect}
            />
          </motion.div>
        )}

        {phase === 'intro' && (
          <motion.div key="intro" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }} className="h-full px-6 py-5">
            <LabIntro eyebrow="Scaling Lab" scenario={scenario} onBegin={() => setPhase('board')} />
          </motion.div>
        )}

        {phase === 'board' && (
          <motion.div key="board" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }} className="h-full flex flex-col">
            <div className="flex-1 min-h-0 grid md:grid-cols-[1.4fr_1fr] gap-4 px-5 py-4 overflow-hidden">
              <div className="min-h-0 overflow-y-auto pr-1 space-y-2">
                <SectionLabel className="mb-1">Scaling strategies</SectionLabel>
                {scenario.moves.map((mv) => {
                  const on = selected.includes(mv.id)
                  return (
                    <button
                      key={mv.id}
                      onClick={() => toggle(mv.id)}
                      className="w-full text-left px-3.5 py-2.5 rounded-xl transition-all active:scale-[0.995]"
                      style={{ background: on ? 'rgba(109,92,252,0.1)' : 'rgba(255,255,255,0.03)', border: on ? '1px solid rgba(109,92,252,0.4)' : '1px solid rgba(255,255,255,0.06)' }}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="w-3.5 h-3.5 rounded-md shrink-0 flex items-center justify-center text-[9px]" style={{ background: on ? '#6d5cfc' : 'rgba(255,255,255,0.06)', color: on ? '#fff' : 'transparent' }}>✓</span>
                          <span className="text-[12.5px] text-neutral-200 truncate">{mv.label}</span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <Chip tone="blue">+{fmt(mv.adds.capacity)} cap</Chip>
                          <Chip tone="red">+${mv.adds.cost}</Chip>
                        </div>
                      </div>
                      <p className="text-[11px] text-neutral-500 mt-1 leading-snug">{mv.description}</p>
                    </button>
                  )
                })}
              </div>

              <div className="min-h-0 overflow-y-auto pr-1">
                <Card className="p-4 mb-3">
                  <SectionLabel className="mb-3">At {fmt(scenario.maxLoad)} users</SectionLabel>
                  <div className="space-y-3">
                    <Row label="Capacity" value={fmt(sim.capacity)} />
                    <Row label="Utilization" value={`${Math.round(sim.util * 100)}%`} met={sim.util <= 0.9} />
                    <Row label="p95 Latency" value={`${sim.latency}ms`} met={sim.latency <= scenario.target.latency} />
                    <Row label="Availability" value={`${sim.availability.toFixed(2)}%`} met={sim.availability >= scenario.target.availability} />
                    <Row label="Cost" value={`$${sim.cost}/mo`} met={sim.cost <= scenario.budget.cost} />
                    <Row label="Complexity" value={sim.complexity} met={sim.complexity <= scenario.budget.complexity} />
                  </div>
                  <div className="mt-3">
                    <Bar value={Math.min(100, sim.util * 100)} tone={sim.util <= 0.75 ? 'green' : sim.util <= 0.9 ? 'gold' : 'red'} />
                  </div>
                </Card>
                <Card className="p-4">
                  <div className="text-[11px] font-mono" style={{ color: sim.util > 1 ? '#f87171' : '#4ade80' }}>
                    {sim.util > 1 ? '✗ Over capacity — requests are failing' : '✓ Within capacity'}
                  </div>
                  <div className="text-[11px] font-mono mt-1 text-neutral-500">
                    Redundant tier: {selected.some((id) => REDUNDANT.includes(id)) ? <span style={{ color: '#4ade80' }}>yes</span> : <span style={{ color: '#f87171' }}>no — single point of failure</span>}
                  </div>
                </Card>
              </div>
            </div>
            <div className="shrink-0 px-5 py-3 border-t flex items-center justify-between" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
              <span className="text-[11px] font-mono text-neutral-600">{selected.length} strateg{selected.length === 1 ? 'y' : 'ies'} selected</span>
              <PrimaryButton onClick={handleShip}>Launch &amp; review</PrimaryButton>
            </div>
          </motion.div>
        )}

        {phase === 'result' && result && (
          <motion.div key="result" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }} className="h-full px-6 py-5">
            <ResultScreen
              heading="Capacity Review"
              score={result.score}
              gradeText={grade(result.score)}
              dimensions={DIMENSIONS}
              breakdown={result.dims}
              narrativeTitle="How I would scale it"
              narrative={scenario.reference.narrative}
              lessons={scenario.reference.lessons}
              badge={prevBestRef.current === null ? 'First attempt' : `Previous best ${prevBestRef.current}`}
              onReplay={() => { recordedRef.current = false; setSelected([]); setPhase('board') }}
              onBack={() => setPhase('menu')}
            >
              <Card className="p-3.5 mb-4">
                <SectionLabel className="mb-2">Outcome</SectionLabel>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {selected.map((id) => <Chip key={id} tone="purple">{scenario.moves.find((m) => m.id === id)?.label}</Chip>)}
                  {selected.length === 0 && <span className="text-[11px] text-neutral-600 font-mono">No strategies selected</span>}
                </div>
                <div className="text-[11px] font-mono text-neutral-500">
                  {fmt(sim.capacity)} capacity · {Math.round(sim.util * 100)}% utilized · {sim.availability.toFixed(2)}% availability · ${sim.cost}/mo
                </div>
              </Card>
            </ResultScreen>
          </motion.div>
        )}
      </AnimatePresence>
    </LabShell>
  )
}

function Row({ label, value, met }) {
  return (
    <div className="flex justify-between items-baseline">
      <span className="text-[10px] font-mono text-neutral-500">{label}</span>
      <span className="text-[13px] font-mono" style={{ color: met === undefined ? '#e4e4e7' : met ? '#4ade80' : '#f87171' }}>{value}</span>
    </div>
  )
}
