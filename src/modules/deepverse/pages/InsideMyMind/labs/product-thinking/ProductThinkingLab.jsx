import { useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import LabShell from '../kit/LabShell'
import LabMenu from '../kit/LabMenu'
import LabIntro from '../kit/LabIntro'
import ResultScreen from '../kit/ResultScreen'
import { Card, SectionLabel, Chip, PrimaryButton } from '../kit/ui'
import { DIMENSIONS, SCENARIOS, rice, evaluateSelection } from './data'
import useBrainStore from '../../store'

const STEPS = ['Brief', 'Prioritize', 'Review']

export default function ProductThinkingLab({ onBack }) {
  const recordLabResult = useBrainStore((s) => s.recordLabResult)
  const labProgress = useBrainStore((s) => s.labProgress['product-thinking'])

  const [scenario, setScenario] = useState(null)
  const [phase, setPhase] = useState('menu')
  const [selected, setSelected] = useState([])
  const recordedRef = useRef(false)
  const prevBestRef = useRef(null)

  const result = useMemo(() => (scenario ? evaluateSelection(scenario, selected) : null), [scenario, selected])
  const overall = result ? Math.round(DIMENSIONS.reduce((s, d) => s + (result.dims[d.id] || 0), 0) / DIMENSIONS.length) : 0
  const overCapacity = result ? result.used > scenario.capacity : false

  const handleSelect = (s) => { recordedRef.current = false; prevBestRef.current = null; setScenario(s); setSelected([]); setPhase('intro') }
  const toggle = (id) => setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  const handleShip = () => {
    prevBestRef.current = useBrainStore.getState().labProgress['product-thinking']?.[scenario.id]?.bestScore ?? null
    if (!recordedRef.current) { recordedRef.current = true; recordLabResult('product-thinking', scenario.id, overall, { metGoal: result.metGoal }) }
    setPhase('result')
  }
  const backLabel = phase === 'menu' ? '← Back to Brain OS' : '← Menu'
  const handleBack = () => (phase === 'menu' ? onBack() : setPhase('menu'))

  return (
    <LabShell
      title={scenario?.title || 'Product Thinking Lab'}
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
              heading="Product Thinking Lab"
              blurb="Prioritization is choosing what not to do. Fund the backlog under a tight capacity, balance the portfolio, and fund the work that is not optional."
              scenarios={SCENARIOS}
              progress={labProgress}
              onSelect={handleSelect}
            />
          </motion.div>
        )}

        {phase === 'intro' && (
          <motion.div key="intro" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }} className="h-full px-6 py-5">
            <LabIntro eyebrow="Product Thinking Lab" scenario={scenario} onBegin={() => setPhase('board')} />
          </motion.div>
        )}

        {phase === 'board' && result && (
          <motion.div key="board" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }} className="h-full flex flex-col">
            <div className="shrink-0 px-5 pt-3 pb-2 flex items-center gap-4">
              <div className="flex-1">
                <div className="flex justify-between text-[10px] font-mono mb-1">
                  <span className="text-neutral-600">Capacity</span>
                  <span style={{ color: overCapacity ? '#f87171' : '#a1a1aa' }}>{result.used} / {scenario.capacity} person-weeks</span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                  <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(100, (result.used / scenario.capacity) * 100)}%`, background: overCapacity ? '#f87171' : 'linear-gradient(90deg,#6d5cfc,#a78bfa)' }} />
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-[9px] font-mono text-neutral-600">Value captured</div>
                <div className="text-[15px] font-mono" style={{ color: result.valueRatio >= 0.85 ? '#4ade80' : '#d4af37' }}>{Math.round(result.valueRatio * 100)}%</div>
              </div>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto px-5 py-2 space-y-2">
              {scenario.items.map((item) => {
                const on = selected.includes(item.id)
                return (
                  <button key={item.id} onClick={() => toggle(item.id)}
                    className="w-full text-left rounded-xl px-3.5 py-2.5 transition-all active:scale-[0.995]"
                    style={{ background: on ? 'rgba(109,92,252,0.1)' : 'rgba(255,255,255,0.03)', border: on ? '1px solid rgba(109,92,252,0.4)' : '1px solid rgba(255,255,255,0.06)' }}>
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-4 h-4 rounded-md flex items-center justify-center text-[9px] shrink-0" style={{ background: on ? '#6d5cfc' : 'rgba(255,255,255,0.06)', color: on ? '#fff' : '#71717a' }}>{on ? '✓' : ''}</span>
                        <span className="text-[12.5px] text-neutral-200 truncate">{item.title}</span>
                        <Chip tone="neutral">{item.tag}</Chip>
                      </div>
                      <div className="flex items-center gap-4 shrink-0 text-[10px] font-mono text-neutral-500">
                        <span>R {item.reach.toLocaleString()}</span>
                        <span>I {item.impact}</span>
                        <span>C {Math.round(item.confidence * 100)}%</span>
                        <span>E {item.effort}w</span>
                        <span className="text-[#a78bfa] w-12 text-right">{Math.round(rice(item))}</span>
                      </div>
                    </div>
                    <p className="text-[10.5px] text-neutral-600 mt-1 ml-6">{item.note}</p>
                  </button>
                )
              })}
            </div>

            <div className="shrink-0 px-5 py-2.5 border-t flex items-center justify-between gap-3" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
              <div className="flex flex-wrap gap-2">
                {result.reqResults.map((r) => (
                  <span key={r.label} className="text-[10px] font-mono" style={{ color: r.met ? '#4ade80' : '#d4af37' }}>
                    {r.met ? '✓' : '○'} {r.label}
                  </span>
                ))}
              </div>
              <PrimaryButton onClick={handleShip} disabled={overCapacity || selected.length === 0}>Commit plan</PrimaryButton>
            </div>
          </motion.div>
        )}

        {phase === 'result' && result && (
          <motion.div key="result" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }} className="h-full px-6 py-5">
            <ResultScreen
              heading="Roadmap Review"
              score={overall}
              gradeText={`${Math.round(result.valueRatio * 100)}% of the best possible value`}
              dimensions={DIMENSIONS}
              breakdown={result.dims}
              narrativeTitle="How I would sequence it"
              narrative={scenario.id === 'mvp' ? MVP_NARRATIVE : Q3_NARRATIVE}
              lessons={LESSONS}
              badge={prevBestRef.current === null ? 'First attempt' : `Previous best ${prevBestRef.current}`}
              onReplay={() => { recordedRef.current = false; setPhase('board') }}
              onBack={() => setPhase('menu')}
            >
              <Card className="p-3.5 mb-4">
                <SectionLabel className="mb-2">Funded ({result.used} / {scenario.capacity} w)</SectionLabel>
                <div className="space-y-1.5">
                  {result.sel.slice().sort((a, b) => rice(b) - rice(a)).map((i) => (
                    <div key={i.id} className="flex items-center justify-between text-[11px] font-mono">
                      <span className="text-neutral-400">{i.title}</span>
                      <span className="text-neutral-500">{i.effort}w · {Math.round(rice(i))}</span>
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

const LESSONS = [
  'Prioritization is the discipline of saying no.',
  'Non-negotiables (compliance, security) are funded first, not last.',
  'Balance the portfolio: all big bets or all tweaks is fragile.',
  'Confidence-weighted value beats raw ambition.',
]

const Q3_NARRATIVE = 'I would fund the compliance audit log first — it is non-negotiable — then spend the remaining capacity on the highest value-per-effort items: the quick wins (dark mode, saved filters) and the efficient growth and retention work (CSV import, push notifications). I would leave the billing rewrite out: its effort would consume the whole quarter for a single uncertain outcome. The goal is the most value for the ten weeks, with no fragile concentration in one kind of work.'
const MVP_NARRATIVE = 'For an MVP I optimize for learning speed, not polish. Frictionless signup and guided onboarding get users in and activated; a growth experiment and a felt performance win give me something to measure. I would resist the analytics dashboard and the polish pass — both feel productive but teach me little this early. Scope for the fastest honest signal.'
