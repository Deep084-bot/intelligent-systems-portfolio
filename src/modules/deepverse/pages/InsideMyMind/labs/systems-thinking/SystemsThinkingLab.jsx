import { useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import LabShell from '../kit/LabShell'
import LabMenu from '../kit/LabMenu'
import LabIntro from '../kit/LabIntro'
import ResultScreen from '../kit/ResultScreen'
import { Card, SectionLabel, Chip, PrimaryButton } from '../kit/ui'
import { DIMENSIONS, LEVEL_LABELS, SCENARIOS, evaluateSystem } from './data'
import useBrainStore from '../../store'

const STEPS = ['Brief', 'Intervene', 'Review']
const LEVEL_TONE = { param: 'red', structure: 'gold', feedback: 'blue', rules: 'purple', goal: 'green' }

export default function SystemsThinkingLab({ onBack }) {
  const recordLabResult = useBrainStore((s) => s.recordLabResult)
  const labProgress = useBrainStore((s) => s.labProgress['systems-thinking'])

  const [scenario, setScenario] = useState(null)
  const [phase, setPhase] = useState('menu')
  const [selected, setSelected] = useState([])
  const recordedRef = useRef(false)
  const prevBestRef = useRef(null)

  const result = useMemo(() => (scenario ? evaluateSystem(scenario, selected) : null), [scenario, selected])
  const overall = result ? Math.round(DIMENSIONS.reduce((s, d) => s + (result.dims[d.id] || 0), 0) / DIMENSIONS.length) : 0

  const handleSelect = (s) => { recordedRef.current = false; prevBestRef.current = null; setScenario(s); setSelected([]); setPhase('intro') }
  const toggle = (id) => setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  const handleShip = () => {
    prevBestRef.current = useBrainStore.getState().labProgress['systems-thinking']?.[scenario.id]?.bestScore ?? null
    if (!recordedRef.current) { recordedRef.current = true; recordLabResult('systems-thinking', scenario.id, overall, { metGoal: result.metGoal }) }
    setPhase('result')
  }
  const backLabel = phase === 'menu' ? '← Back to Brain OS' : '← Menu'
  const handleBack = () => (phase === 'menu' ? onBack() : setPhase('menu'))

  return (
    <LabShell
      title={scenario?.title || 'Systems Thinking Lab'}
      tag={scenario?.tag}
      steps={STEPS}
      currentStep={phase === 'result' ? 2 : phase === 'board' ? 1 : phase === 'intro' ? 0 : -1}
      onBack={handleBack}
      backLabel={backLabel}
      size="w-[min(1000px,95vw)] h-[min(720px,92vh)]"
    >
      <AnimatePresence mode="wait">
        {phase === 'menu' && (
          <motion.div key="menu" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }} className="h-full overflow-y-auto px-6 py-5">
            <LabMenu
              heading="Systems Thinking Lab"
              blurb="Some fixes change a system; most only push on its surface. Identify the high-leverage interventions — the ones that alter rules and goals — and see why the obvious fixes keep failing."
              scenarios={SCENARIOS}
              progress={labProgress}
              onSelect={handleSelect}
            />
          </motion.div>
        )}

        {phase === 'intro' && (
          <motion.div key="intro" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }} className="h-full px-6 py-5">
            <LabIntro eyebrow="Systems Thinking Lab" scenario={scenario} onBegin={() => setPhase('board')} />
          </motion.div>
        )}

        {phase === 'board' && result && (
          <motion.div key="board" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }} className="h-full flex flex-col">
            <div className="shrink-0 px-5 pt-3 pb-2">
              <p className="text-[11.5px] text-neutral-500">Select the interventions you would make. Choose the ones that change the system's rules and goals, not just its symptoms.</p>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto px-5 py-2 space-y-2">
              {scenario.interventions.map((iv) => {
                const on = selected.includes(iv.id)
                return (
                  <button key={iv.id} onClick={() => toggle(iv.id)}
                    className="w-full text-left rounded-xl px-3.5 py-2.5 transition-all active:scale-[0.995]"
                    style={{ background: on ? 'rgba(109,92,252,0.1)' : 'rgba(255,255,255,0.03)', border: on ? '1px solid rgba(109,92,252,0.4)' : '1px solid rgba(255,255,255,0.06)' }}>
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-4 h-4 rounded-md flex items-center justify-center text-[9px] shrink-0" style={{ background: on ? '#6d5cfc' : 'rgba(255,255,255,0.06)', color: on ? '#fff' : '#71717a' }}>{on ? '✓' : ''}</span>
                        <span className="text-[12.5px] text-neutral-200">{iv.label}</span>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
            <div className="shrink-0 px-5 py-2.5 border-t flex items-center justify-between" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
              <span className="text-[11px] font-mono text-neutral-600">{selected.length} selected</span>
              <PrimaryButton onClick={handleShip} disabled={selected.length === 0}>Apply interventions</PrimaryButton>
            </div>
          </motion.div>
        )}

        {phase === 'result' && result && (
          <motion.div key="result" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }} className="h-full px-6 py-5">
            <ResultScreen
              heading="Systems Review"
              score={overall}
              gradeText={`${result.selItems.filter((i) => i.high).length} / ${scenario.interventions.filter((i) => i.high).length} high-leverage choices`}
              dimensions={DIMENSIONS}
              breakdown={result.dims}
              narrativeTitle="Where the leverage really is"
              narrative={scenario.id === 'slow-team' ? TEAM_NARRATIVE : SERVICE_NARRATIVE}
              lessons={LESSONS}
              badge={prevBestRef.current === null ? 'First attempt' : `Previous best ${prevBestRef.current}`}
              onReplay={() => { recordedRef.current = false; setPhase('board') }}
              onBack={() => setPhase('menu')}
            >
              <Card className="p-3.5 mb-4">
                <SectionLabel className="mb-2">Leverage by intervention</SectionLabel>
                <div className="space-y-2">
                  {scenario.interventions.map((iv) => {
                    const chosen = selected.includes(iv.id)
                    return (
                      <div key={iv.id} className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-[11px] shrink-0" style={{ color: chosen ? (iv.high ? '#4ade80' : '#d4af37') : '#52525b' }}>{chosen ? (iv.high ? '✓' : '•') : '○'}</span>
                          <span className="text-[11.5px] text-neutral-400 truncate">{iv.label}</span>
                        </div>
                        <Chip tone={LEVEL_TONE[iv.level]}>{LEVEL_LABELS[iv.level]}</Chip>
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
  'Parameter tweaks are the weakest leverage — easy to reach, easy to ignore.',
  'Rules and incentives change behavior at scale.',
  'Goals are deeper still: redefine the objective and the system reorganizes.',
  'The obvious fix is usually the shallowest one.',
]

const SERVICE_NARRATIVE = 'The alerts and the extra servers feel like action, but they push on parameters — the shallowest leverage in the system. The real change is a rule that constrains how code reaches production (progressive rollout with automatic rollback) and a goal that makes reliability a shared objective an error budget can gate. Once reliability is everyone’s goal and every change is safe to ship, the recurring outage stops being a matter of vigilance and becomes a property of the system.'
const TEAM_NARRATIVE = 'Working harder is a parameter, and the team is already at the limit — more pressure will produce less. The higher-leverage moves are rules: a single accountable owner per service, and a standing budget for debt so it never accumulates into a crisis. Above even those is the goal itself: shrinking scope to match real capacity. Redefining “done” removes the treadmill, and the team gets faster because the system stops fighting them.'
