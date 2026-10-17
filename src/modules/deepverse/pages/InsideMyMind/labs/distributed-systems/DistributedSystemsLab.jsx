import { useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import LabShell from '../kit/LabShell'
import LabMenu from '../kit/LabMenu'
import LabIntro from '../kit/LabIntro'
import ResultScreen from '../kit/ResultScreen'
import { Card, SectionLabel, Chip, PrimaryButton } from '../kit/ui'
import { DIMENSIONS, GUARANTEES, N, TOPOLOGIES, SCENARIOS, evaluate, topoDims } from './data'
import { totalScore, clamp } from '../kit/scoring'
import useBrainStore from '../../store'

const STEPS = ['Brief', 'Configure', 'Review']

export default function DistributedSystemsLab({ onBack }) {
  const recordLabResult = useBrainStore((s) => s.recordLabResult)
  const labProgress = useBrainStore((s) => s.labProgress['distributed-systems'])

  const [scenario, setScenario] = useState(null)
  const [phase, setPhase] = useState('menu')
  const [topo, setTopo] = useState('sync')
  const [W, setW] = useState(2)
  const [R, setR] = useState(2)
  const recordedRef = useRef(false)
  const prevBestRef = useRef(null)

  const evalRes = useMemo(() => evaluate(topo, W, R), [topo, W, R])
  const dims = useMemo(() => topoDims(topo, W, R), [topo, W, R])

  const result = useMemo(() => {
    if (!scenario) return null
    let d = { ...dims }
    for (const g of scenario.required) {
      if (evalRes[g]) d = { ...d, [guaranteeDim(g)]: clamp((d[guaranteeDim(g)] || 0) + 10) }
      else d = { ...d, [guaranteeDim(g)]: clamp((d[guaranteeDim(g)] || 0) - 25) }
    }
    const met = scenario.required.every((g) => evalRes[g])
    return { dims: d, score: totalScore(d, DIMENSIONS), met }
  }, [scenario, dims, evalRes])

  const handleSelect = (s) => { recordedRef.current = false; prevBestRef.current = null; setScenario(s); setTopo(s.preferred[0]); setW(2); setR(2); setPhase('intro') }
  const handleShip = () => {
    prevBestRef.current = useBrainStore.getState().labProgress['distributed-systems']?.[scenario.id]?.bestScore ?? null
    if (!recordedRef.current) { recordedRef.current = true; recordLabResult('distributed-systems', scenario.id, result.score, { metGoal: result.met }) }
    setPhase('result')
  }
  const backLabel = phase === 'menu' ? '← Back to Brain OS' : '← Menu'
  const handleBack = () => (phase === 'menu' ? onBack() : setPhase('menu'))

  return (
    <LabShell
      title={scenario?.title || 'Distributed Systems Lab'}
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
              heading="Distributed Architecture Lab"
              blurb="Replication is a set of promises you make to your users. Pick a topology and quorum, then see exactly which guarantees survive a partition or a crash."
              scenarios={SCENARIOS}
              progress={labProgress}
              onSelect={handleSelect}
            />
          </motion.div>
        )}

        {phase === 'intro' && (
          <motion.div key="intro" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }} className="h-full px-6 py-5">
            <LabIntro eyebrow="Distributed Architecture Lab" scenario={scenario} onBegin={() => setPhase('board')} />
          </motion.div>
        )}

        {phase === 'board' && (
          <motion.div key="board" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }} className="h-full flex flex-col">
            <div className="flex-1 min-h-0 grid md:grid-cols-[1fr_1fr] gap-4 px-5 py-4 overflow-hidden">
              <div className="min-h-0 overflow-y-auto pr-1">
                <SectionLabel className="mb-2">Replication topology</SectionLabel>
                <div className="space-y-2 mb-4">
                  {TOPOLOGIES.map((t) => {
                    const on = topo === t.id
                    return (
                      <button key={t.id} onClick={() => setTopo(t.id)} className="w-full text-left px-3.5 py-2.5 rounded-xl transition-all active:scale-[0.995]"
                        style={{ background: on ? 'rgba(109,92,252,0.1)' : 'rgba(255,255,255,0.03)', border: on ? '1px solid rgba(109,92,252,0.4)' : '1px solid rgba(255,255,255,0.06)' }}>
                        <div className="text-[12.5px] text-neutral-200">{t.label}</div>
                        <div className="text-[11px] text-neutral-500 mt-0.5">{t.blurb}</div>
                      </button>
                    )
                  })}
                </div>

                {topo === 'quorum' && (
                  <Card className="p-3.5 mb-3">
                    <SectionLabel className="mb-2">Quorum (N = {N})</SectionLabel>
                    <Slider label="Write quorum W" value={W} setValue={setW} />
                    <Slider label="Read quorum R" value={R} setValue={setR} />
                    <div className="text-[11px] font-mono mt-2" style={{ color: R + W > N ? '#4ade80' : '#f87171' }}>
                      R + W = {R + W} {R + W > N ? '> N — strong' : '≤ N — may read stale'}
                    </div>
                  </Card>
                )}

                <Card className="p-3.5">
                  <SectionLabel className="mb-2">Cluster</SectionLabel>
                  <ClusterDiagram topo={topo} />
                </Card>
              </div>

              <div className="min-h-0 overflow-y-auto pr-1">
                <SectionLabel className="mb-2">Guarantees</SectionLabel>
                <div className="space-y-2">
                  {GUARANTEES.map((g) => {
                    const ok = evalRes[g.id]
                    const required = scenario.required.includes(g.id)
                    return (
                      <div key={g.id} className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.02)', border: required ? '1px solid rgba(212,175,55,0.3)' : '1px solid rgba(255,255,255,0.05)' }}>
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="text-[12px]" style={{ color: ok ? '#4ade80' : '#f87171' }}>{ok ? '✓' : '✗'}</span>
                            <span className="text-[12px] text-neutral-300">{g.label}</span>
                          </div>
                          {required && <Chip tone="gold">required</Chip>}
                        </div>
                        {!ok && <p className="text-[10.5px] text-neutral-500 mt-1 leading-snug">{evalRes.notes[g.id]}</p>}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
            <div className="shrink-0 px-5 py-3 border-t flex items-center justify-between" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
              <span className="text-[11px] font-mono" style={{ color: result.met ? '#4ade80' : '#d4af37' }}>
                {result.met ? '✓ All required guarantees hold' : 'Required guarantees not yet met'}
              </span>
              <PrimaryButton onClick={handleShip}>Commit strategy</PrimaryButton>
            </div>
          </motion.div>
        )}

        {phase === 'result' && result && (
          <motion.div key="result" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }} className="h-full px-6 py-5">
            <ResultScreen
              heading="Distributed Systems Review"
              score={result.score}
              gradeText={TOPOLOGIES.find((t) => t.id === topo)?.label}
              dimensions={DIMENSIONS}
              breakdown={result.dims}
              narrativeTitle="How I would approach it"
              narrative={scenario.reference.narrative}
              lessons={scenario.reference.lessons}
              badge={prevBestRef.current === null ? 'First attempt' : `Previous best ${prevBestRef.current}`}
              onReplay={() => { recordedRef.current = false; setPhase('board') }}
              onBack={() => setPhase('menu')}
            >
              <Card className="p-3.5 mb-4">
                <SectionLabel className="mb-2">Required guarantees</SectionLabel>
                <div className="space-y-1">
                  {scenario.required.map((g) => {
                    const label = GUARANTEES.find((x) => x.id === g)?.label
                    return (
                      <div key={g} className="flex items-center gap-2 text-[11px] font-mono">
                        <span style={{ color: evalRes[g] ? '#4ade80' : '#f87171' }}>{evalRes[g] ? '✓' : '✗'}</span>
                        <span className="text-neutral-400">{label}</span>
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

function Slider({ label, value, setValue }) {
  return (
    <div className="flex items-center gap-3 mb-1.5">
      <span className="text-[10px] font-mono text-neutral-500 w-28">{label}</span>
      <input type="range" min={1} max={N} value={value} onChange={(e) => setValue(Number(e.target.value))} className="flex-1 accent-[#6d5cfc]" />
      <span className="text-[11px] font-mono text-neutral-300 w-4 text-right">{value}</span>
    </div>
  )
}

function ClusterDiagram({ topo }) {
  const nodes = [
    { id: 'A', x: 50, y: 30 },
    { id: 'B', x: 20, y: 80 },
    { id: 'C', x: 80, y: 80 },
  ]
  const links = [['A', 'B'], ['A', 'C'], ['B', 'C']]
  const multi = topo === 'multi'
  return (
    <svg viewBox="0 0 120 110" className="w-full max-w-[200px] mx-auto">
      {links.map(([a, b], i) => {
        const na = nodes.find((n) => n.id === a)
        const nb = nodes.find((n) => n.id === b)
        const dashed = topo === 'quorum'
        return <line key={i} x1={na.x} y1={na.y} x2={nb.x} y2={nb.y} stroke={multi ? '#d4af37' : '#6d5cfc'} strokeWidth={0.8} strokeDasharray={dashed ? '3 2' : undefined} opacity={0.5} />
      })}
      {nodes.map((n) => {
        const leader = (topo === 'sync' || topo === 'async') && n.id === 'A'
        return (
          <g key={n.id}>
            <circle cx={n.x} cy={n.y} r={11} fill={leader ? 'rgba(212,175,55,0.18)' : 'rgba(109,92,252,0.14)'} stroke={leader ? '#d4af37' : '#6d5cfc'} strokeWidth={1} />
            <text x={n.x} y={n.y} textAnchor="middle" dominantBaseline="central" fontSize={9} fill="#e4e4e7">{n.id}</text>
          </g>
        )
      })}
    </svg>
  )
}

function guaranteeDim(g) {
  return { strongReads: 'consistency', partitionAvailable: 'availability', durability: 'durability', leaderLoss: 'partition', noConflicts: 'consistency' }[g] || 'consistency'
}
