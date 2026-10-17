import { useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import LabShell from '../kit/LabShell'
import LabMenu from '../kit/LabMenu'
import LabIntro from '../kit/LabIntro'
import ResultScreen from '../kit/ResultScreen'
import { Card, SectionLabel, PrimaryButton, Bar } from '../kit/ui'
import { OUTCOMES, CHANNELS, SCENARIOS, simulate } from './data'
import useBrainStore from '../../store'

const STEPS = ['Brief', 'Allocate hours', 'Review']

export default function LearningLab({ onBack }) {
  const recordLabResult = useBrainStore((s) => s.recordLabResult)
  const labProgress = useBrainStore((s) => s.labProgress.learning)

  const [scenario, setScenario] = useState(null)
  const [phase, setPhase] = useState('menu')
  const [hours, setHours] = useState({})
  const recordedRef = useRef(false)
  const prevBestRef = useRef(null)

  const H = scenario?.hours || 20
  const total = useMemo(() => CHANNELS.reduce((s, c) => s + (hours[c.id] || 0), 0), [hours])
  const outcomes = useMemo(() => (scenario ? simulate(hours, H) : null), [scenario, hours, H])
  const metGoal = useMemo(() => {
    if (!scenario || !outcomes) return false
    return Object.entries(scenario.targets).every(([k, v]) => (outcomes[k] || 0) >= v)
  }, [scenario, outcomes])
  const overall = outcomes ? Math.round(OUTCOMES.reduce((s, o) => s + (outcomes[o.id] || 0), 0) / OUTCOMES.length) : 0

  const handleSelect = (s) => { recordedRef.current = false; prevBestRef.current = null; setScenario(s); setHours({}); setPhase('intro') }
  const setHour = (id, val) => setHours((prev) => ({ ...prev, [id]: Math.max(0, Math.min(H, val)) }))
  const handleShip = () => {
    prevBestRef.current = useBrainStore.getState().labProgress.learning?.[scenario.id]?.bestScore ?? null
    if (!recordedRef.current) { recordedRef.current = true; recordLabResult('learning', scenario.id, overall, { metGoal }) }
    setPhase('result')
  }
  const backLabel = phase === 'menu' ? '← Back to Brain OS' : '← Menu'
  const handleBack = () => (phase === 'menu' ? onBack() : setPhase('menu'))

  return (
    <LabShell
      title={scenario?.title || 'Learning Lab'}
      tag={scenario?.tag}
      steps={STEPS}
      currentStep={phase === 'result' ? 2 : phase === 'allocate' ? 1 : phase === 'intro' ? 0 : -1}
      onBack={handleBack}
      backLabel={backLabel}
      size="w-[min(1040px,95vw)] h-[min(720px,92vh)]"
    >
      <AnimatePresence mode="wait">
        {phase === 'menu' && (
          <motion.div key="menu" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }} className="h-full overflow-y-auto px-6 py-5">
            <LabMenu
              heading="Learning Lab"
              blurb="Learning is deliberate practice, not time spent. Allocate your week across the ways engineers actually improve, and watch how the trade-offs play out over a quarter."
              scenarios={SCENARIOS}
              progress={labProgress}
              onSelect={handleSelect}
            />
          </motion.div>
        )}

        {phase === 'intro' && (
          <motion.div key="intro" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }} className="h-full px-6 py-5">
            <LabIntro eyebrow="Learning Lab" scenario={scenario} onBegin={() => setPhase('allocate')} />
          </motion.div>
        )}

        {phase === 'allocate' && outcomes && (
          <motion.div key="allocate" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }} className="h-full flex flex-col">
            <div className="flex-1 min-h-0 grid md:grid-cols-2 gap-4 px-5 py-4 overflow-hidden">
              <div className="min-h-0 overflow-y-auto pr-1">
                <div className="flex items-center justify-between mb-2">
                  <SectionLabel>Weekly budget</SectionLabel>
                  <span className="text-[11px] font-mono" style={{ color: total > H ? '#f87171' : '#a1a1aa' }}>{total} / {H} h</span>
                </div>
                <div className="space-y-3.5">
                  {CHANNELS.map((c) => (
                    <div key={c.id}>
                      <div className="flex items-baseline justify-between mb-1">
                        <span className="text-[12.5px] text-neutral-200">{c.label}</span>
                        <span className="text-[11px] font-mono text-neutral-500">{hours[c.id] || 0}h</span>
                      </div>
                      <p className="text-[10.5px] text-neutral-600 mb-1.5">{c.blurb}</p>
                      <input type="range" min={0} max={H} value={hours[c.id] || 0}
                        onChange={(e) => setHour(c.id, Number(e.target.value))} className="w-full accent-[#6d5cfc]" />
                    </div>
                  ))}
                </div>
              </div>

              <div className="min-h-0 overflow-y-auto pr-1">
                <SectionLabel className="mb-2">Projected after 12 weeks</SectionLabel>
                <Card className="p-4 space-y-3">
                  {OUTCOMES.map((o) => {
                    const v = outcomes[o.id] || 0
                    const target = scenario.targets[o.id]
                    const met = target !== undefined ? v >= target : null
                    return (
                      <div key={o.id}>
                        <div className="flex justify-between text-[10px] font-mono mb-1">
                          <span className="text-neutral-500">{o.label}{target !== undefined ? ` · target ${target}` : ''}</span>
                          <span style={{ color: met === false ? '#f87171' : met ? '#4ade80' : '#e4e4e7' }}>{v}</span>
                        </div>
                        <Bar value={v} tone={met === false ? 'red' : v >= 70 ? 'purple' : 'gold'} />
                      </div>
                    )
                  })}
                </Card>
                <p className="text-[10.5px] text-neutral-600 mt-3 leading-snug">
                  Passive study returns little; building, debugging, reviewing and spacing each feed different outcomes. Balance beats over-investing in one channel.
                </p>
              </div>
            </div>
            <div className="shrink-0 px-5 py-3 border-t flex items-center justify-between" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
              <span className="text-[11px] font-mono" style={{ color: metGoal ? '#4ade80' : '#d4af37' }}>
                {metGoal ? '✓ Targets met' : total > H ? '✗ Over budget' : 'Targets not yet met'}
              </span>
              <PrimaryButton onClick={handleShip} disabled={total > H || total === 0}>Commit plan</PrimaryButton>
            </div>
          </motion.div>
        )}

        {phase === 'result' && outcomes && (
          <motion.div key="result" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }} className="h-full px-6 py-5">
            <ResultScreen
              heading="Learning Plan Review"
              score={overall}
              gradeText={metGoal ? 'All targets met' : 'Some targets missed'}
              dimensions={OUTCOMES}
              breakdown={outcomes}
              narrativeTitle="How I would spend the week"
              narrative={referenceNarrative(scenario)}
              lessons={LESSONS}
              badge={prevBestRef.current === null ? 'First attempt' : `Previous best ${prevBestRef.current}`}
              onReplay={() => { recordedRef.current = false; setPhase('allocate') }}
              onBack={() => setPhase('menu')}
            >
              <Card className="p-3.5 mb-4">
                <SectionLabel className="mb-2">Targets</SectionLabel>
                <div className="space-y-1.5">
                  {Object.entries(scenario.targets).map(([k, v]) => {
                    const o = OUTCOMES.find((x) => x.id === k)
                    const val = outcomes[k] || 0
                    const ok = val >= v
                    return (
                      <div key={k} className="flex items-center justify-between text-[11px] font-mono">
                        <span className="text-neutral-400">{o?.label}</span>
                        <span style={{ color: ok ? '#4ade80' : '#f87171' }}>{val} / {v} {ok ? '✓' : '✗'}</span>
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

const LESSONS = [
  'Deliberate practice beats passive consumption.',
  'Spacing is what makes knowledge durable.',
  'Building and debugging turn knowledge into skill.',
  'Teaching forces the gaps in your understanding to surface.',
]

function referenceNarrative(scenario) {
  if (scenario.id === 'fundamentals') {
    return 'For depth I would weight building and debugging highest, because understanding survives when it has been applied, then pair that with spaced review so the knowledge does not decay, and a steady dose of reading and writing to keep it connected. Reading alone would look diligent and fade within weeks; building alone would leave shallow patches. The allocation that lasts is balanced but favors doing.'
  }
  return 'To ramp on a new stack I would spend most hours building and debugging — practical skill comes from shipping, not from reading, and retention follows the problems I actually had to solve. Spaced review keeps fundamentals from decaying, and reviewing others’ code gives me the breadth to move around the codebase quickly. Reading has a place, but as a small slice, not the default.'
}
