import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import EvidenceCard from './EvidenceCard'

function clockAt(startClock, minutes) {
  const [h, m] = startClock.split(':').map(Number)
  const total = h * 60 + m + minutes
  const hh = String(Math.floor(total / 60) % 24).padStart(2, '0')
  const mm = String(total % 60).padStart(2, '0')
  return `${hh}:${mm}`
}

const CATEGORY_TAG = {
  Logs: '#a78bfa',
  Metrics: '#6d5cfc',
  Traces: '#d4af37',
  Architecture: '#34d399',
  Database: '#38bdf8',
  Timeline: '#f59e0b',
}

function Entry({ entry, startClock }) {
  const at = clockAt(startClock, entry.at)
  const style =
    entry.kind === 'observation'
      ? { color: '#f87171' }
      : entry.kind === 'hypothesis'
      ? { color: '#d4af37' }
      : { color: '#a1a1aa' }
  const dot =
    entry.kind === 'observation'
      ? '#f87171'
      : entry.kind === 'hypothesis'
      ? '#d4af37'
      : '#6d5cfc'

  return (
    <div className="relative pl-4 pb-3">
      <span className="absolute left-0 top-[5px] w-1.5 h-1.5 rounded-full" style={{ background: dot }} />
      <div className="text-[9px] font-mono text-neutral-600">{at}</div>
      <div className="text-[11.5px] leading-snug mt-0.5" style={style}>
        {entry.text}
      </div>
      {entry.detail && <div className="text-[10px] text-neutral-500 mt-0.5 leading-snug">{entry.detail}</div>}
    </div>
  )
}

export default function InvestigationRoom({ scenario, state, freshIds, onAction, onPropose }) {
  const [tab, setTab] = useState('evidence')
  const done = state.actionsDone
  const discoveredSet = new Set(state.discovered)
  const available = scenario.actions.filter((a) => !done.includes(a.id))
  const grouped = scenario.categories
    .map((cat) => ({
      cat,
      items: Object.entries(scenario.evidence).filter(([id, ev]) => discoveredSet.has(id) && ev.category === cat),
    }))
    .filter((g) => g.items.length > 0)

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-1 pb-3 border-b mb-3 shrink-0" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
        <div className="flex items-center gap-4">
          <div>
            <div className="text-[8px] font-mono uppercase tracking-wider text-neutral-600">Incident clock</div>
            <div className="text-[14px] font-mono text-neutral-200">{clockAt(scenario.incident.startClock, state.time)}</div>
          </div>
          <div>
            <div className="text-[8px] font-mono uppercase tracking-wider text-neutral-600">Elapsed</div>
            <div className="text-[14px] font-mono text-neutral-200">{state.time}m</div>
          </div>
          <div>
            <div className="text-[8px] font-mono uppercase tracking-wider text-neutral-600">Evidence</div>
            <div className="text-[14px] font-mono text-neutral-200">{state.discovered.length}/{Object.keys(scenario.evidence).length}</div>
          </div>
        </div>
        <button
          onClick={onPropose}
          className="px-3.5 py-1.5 rounded-lg text-[11px] font-medium text-neutral-200 transition-all hover:scale-[1.02] active:scale-[0.98]"
          style={{ background: 'rgba(109,92,252,0.9)' }}
        >
          Propose root cause
        </button>
      </div>

      {state.lastFeedback && (
        <div
          className="px-3.5 py-2.5 rounded-xl mb-3 text-[12px] leading-relaxed"
          style={{ background: 'rgba(212,175,55,0.07)', border: '1px solid rgba(212,175,55,0.25)', color: '#d4af37' }}
        >
          {state.lastFeedback}
        </div>
      )}

      <div className="flex-1 min-h-0 grid grid-cols-[38%_62%] gap-3">
        <div className="flex flex-col min-h-0">
          <div className="text-[9px] font-mono uppercase tracking-[0.25em] text-neutral-600 mb-2 shrink-0">Investigation</div>
          <div className="flex-1 overflow-y-auto space-y-2 pr-0.5">
            <AnimatePresence initial={false}>
              {available.map((a) => (
                <motion.button
                  key={a.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  onClick={() => onAction(a.id)}
                  className="w-full text-left px-3 py-2.5 rounded-xl transition-all hover:translate-x-0.5 active:scale-[0.99]"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-[8px] font-mono uppercase tracking-wider" style={{ color: CATEGORY_TAG[a.category] }}>
                      {a.category}
                    </span>
                    <span className="text-[9px] font-mono text-neutral-600">{a.timeCost}m</span>
                  </div>
                  <div className="text-[11.5px] text-neutral-200 leading-snug">{a.label}</div>
                </motion.button>
              ))}
            </AnimatePresence>
            <AnimatePresence initial={false}>
              {done.slice().reverse().map((id) => {
                const a = scenario.actions.find((x) => x.id === id)
                return (
                  <motion.div
                    key={id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.45 }}
                    className="w-full px-3 py-2 rounded-xl flex items-center justify-between gap-2"
                    style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.03)' }}
                  >
                    <span className="text-[11px] text-neutral-500 line-through">{a.label}</span>
                    <span className="text-[10px] text-neutral-700">✓</span>
                  </motion.div>
                )
              })}
            </AnimatePresence>
            {available.length === 0 && (
              <div className="text-[11px] text-neutral-500 text-center py-4">No actions left — propose a root cause.</div>
            )}
          </div>
        </div>

        <div className="flex flex-col min-h-0 rounded-xl" style={{ background: 'rgba(16,16,20,0.5)', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div className="flex items-center gap-0.5 px-2 py-2 border-b shrink-0" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
            {['evidence', 'log'].map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className="px-2.5 py-1 rounded-md text-[9px] font-mono uppercase tracking-wider transition-colors"
                style={{
                  background: tab === t ? 'rgba(109,92,252,0.14)' : 'transparent',
                  color: tab === t ? '#e4e4e7' : '#52525b',
                }}
              >
                {t === 'evidence' ? `Evidence (${state.discovered.length})` : 'Investigation log'}
              </button>
            ))}
          </div>
          <div className="flex-1 overflow-y-auto p-3">
            {tab === 'evidence' ? (
              <div className="space-y-3">
                {grouped.length === 0 && (
                  <div className="text-[11px] text-neutral-600 text-center py-8">
                    No evidence yet. Perform an investigation action to unlock evidence.
                  </div>
                )}
                {grouped.map(({ cat, items }) => (
                  <div key={cat}>
                    <div className="text-[8px] font-mono uppercase tracking-[0.25em] mb-1.5" style={{ color: CATEGORY_TAG[cat] }}>
                      {cat}
                    </div>
                    <div className="space-y-2">
                      {items.map(([id, ev]) => (
                        <EvidenceCard key={id} evidence={ev} fresh={freshIds.includes(id)} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="pt-1">
                {state.timeline.map((e) => (
                  <Entry key={e.id} entry={e} startClock={scenario.incident.startClock} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
