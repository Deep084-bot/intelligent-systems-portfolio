import { motion } from 'framer-motion'
import { DIMENSIONS, incidentGrade } from '../scoring'

function clockAt(startClock, minutes) {
  const [h, m] = startClock.split(':').map(Number)
  const total = h * 60 + m + minutes
  const hh = String(Math.floor(total / 60) % 24).padStart(2, '0')
  const mm = String(total % 60).padStart(2, '0')
  return `${hh}:${mm}`
}

function Timeline({ scenario, entries }) {
  return (
    <div className="pt-1">
      {entries.map((e) => {
        const at = clockAt(scenario.incident.startClock, e.at)
        const color = e.kind === 'observation' ? '#f87171' : e.kind === 'hypothesis' ? '#d4af37' : '#6d5cfc'
        return (
          <div key={e.id} className="relative pl-5 pb-3">
            <span className="absolute left-0 top-[5px] w-1.5 h-1.5 rounded-full" style={{ background: color }} />
            <span className="absolute left-[3px] top-[14px] bottom-0 w-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
            <div className="text-[9px] font-mono text-neutral-600">{at}</div>
            <div className="text-[11.5px] leading-snug mt-0.5 text-neutral-300">{e.text}</div>
            {e.detail && <div className="text-[10px] text-neutral-500 mt-0.5 leading-snug">{e.detail}</div>}
          </div>
        )
      })}
    </div>
  )
}

export default function IncidentReview({ scenario, state, progress, prevBest, onReplay, onBack }) {
  const result = state.result
  const score = Math.round(result.score)
  const grade = incidentGrade(score)
  const isBest = prevBest === null || score > prevBest
  const cause = state.selectedCause

  return (
    <motion.div
      className="flex flex-col h-full overflow-y-auto pr-1"
      initial="hidden"
      animate="show"
      variants={{ show: { transition: { staggerChildren: 0.07 } } }}
    >
      <div className="text-[9px] font-mono uppercase tracking-[0.25em] text-neutral-600 mb-2">Incident Review</div>

      <motion.div
        variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}
        className="rounded-xl p-3.5 mb-4"
        style={{ background: 'rgba(16,16,20,0.7)', border: '1px solid rgba(255,255,255,0.06)' }}
      >
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <span
              className="text-[9px] font-mono px-2 py-0.5 rounded"
              style={{ background: 'rgba(248,113,113,0.1)', color: '#f87171', border: '1px solid rgba(248,113,113,0.2)' }}
            >
              {scenario.incident.severity}
            </span>
            <span className="text-[13px] font-medium text-neutral-100">{scenario.incident.title}</span>
          </div>
          <span className="text-[10px] font-mono text-neutral-500">resolved in {result.time}m</span>
        </div>
        <p className="text-[12px] text-neutral-400 leading-relaxed">{scenario.incident.symptom}</p>
      </motion.div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <motion.div
          variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}
          className="rounded-xl p-3.5"
          style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}
        >
          <div className="flex items-end justify-between mb-3">
            <div>
              <div className="text-[9px] font-mono uppercase tracking-[0.25em] text-neutral-600 mb-1">Investigation score</div>
              <div className="text-[34px] leading-none font-medium" style={{ color: score >= 70 ? '#a78bfa' : score >= 55 ? '#d4af37' : '#f87171' }}>
                {score}
              </div>
            </div>
            <div className="text-right mb-1">
              <div className="text-[11px] text-neutral-400 font-mono">{grade}</div>
              {isBest && progress?.completed && (
                <div className="text-[9px] font-mono mt-1" style={{ color: '#d4af37' }}>
                  ★ NEW BEST · attempt {progress.attempts}
                </div>
              )}
              {!progress?.completed && (
                <div className="text-[9px] font-mono mt-1" style={{ color: '#a78bfa' }}>
                  ◈ incident logged
                </div>
              )}
            </div>
          </div>
          <div className="space-y-2">
            {DIMENSIONS.map((d) => {
              const v = Math.round(result.breakdown[d.id] ?? 0)
              return (
                <div key={d.id}>
                  <div className="flex justify-between text-[9px] font-mono text-neutral-500 mb-0.5">
                    <span>{d.label}</span>
                    <span>{v}</span>
                  </div>
                  <div className="h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
                    <div
                      className="h-1 rounded-full transition-all duration-1000"
                      style={{ width: `${v}%`, background: 'linear-gradient(90deg,#6d5cfc,#a78bfa)' }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </motion.div>

        <motion.div
          variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}
          className="rounded-xl p-3.5"
          style={{ background: 'rgba(212,175,55,0.05)', border: '1px solid rgba(212,175,55,0.15)' }}
        >
          <div className="text-[9px] font-mono uppercase tracking-[0.25em] mb-2" style={{ color: '#d4af37' }}>
            Root cause
          </div>
          <div className="text-[14px] font-medium text-neutral-100 mb-2">{cause.label}</div>
          {state.reasoning && (
            <div className="mb-2">
              <div className="text-[8px] font-mono uppercase tracking-wider text-neutral-500 mb-0.5">Your reasoning</div>
              <p className="text-[11.5px] text-neutral-300 italic leading-relaxed">“{state.reasoning}”</p>
            </div>
          )}
          <div className="text-[8px] font-mono uppercase tracking-wider text-neutral-500 mb-0.5">Engineering reasoning</div>
          <p className="text-[11.5px] text-neutral-400 leading-relaxed">{cause.explanation}</p>
        </motion.div>
      </div>

      <motion.div
        variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}
        className="rounded-xl p-3.5 mb-4"
        style={{ background: 'rgba(16,16,20,0.7)', border: '1px solid rgba(255,255,255,0.06)' }}
      >
        <div className="text-[9px] font-mono uppercase tracking-[0.25em] text-neutral-600 mb-2">Investigation timeline</div>
        <div className="max-h-[180px] overflow-y-auto pr-1">
          <Timeline scenario={scenario} entries={result.timeline} />
        </div>
      </motion.div>

      <motion.div
        variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}
        className="rounded-xl p-3.5 mb-4"
        style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}
      >
        <div className="text-[9px] font-mono uppercase tracking-[0.25em] text-neutral-600 mb-2">My investigation process</div>
        <p className="text-[12.5px] text-neutral-300 leading-relaxed">{scenario.review.process}</p>
      </motion.div>

      <motion.div
        variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}
        className="rounded-xl p-3.5 mb-4"
        style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}
      >
        <div className="text-[9px] font-mono uppercase tracking-[0.25em] text-neutral-600 mb-2">Lessons learned</div>
        <ul className="space-y-1">
          {scenario.review.lessons.map((l, i) => (
            <li key={i} className="flex gap-2 text-[12px] leading-relaxed text-neutral-400">
              <span style={{ color: '#6d5cfc' }}>›</span>
              {l}
            </li>
          ))}
        </ul>
      </motion.div>

      <motion.div variants={{ hidden: { opacity: 0 }, show: { opacity: 1 } }} className="flex gap-2 mt-auto pb-1">
        <button
          onClick={onReplay}
          className="px-4 py-2 rounded-lg text-[12px] font-medium text-neutral-200 transition-all hover:scale-[1.02] active:scale-[0.98]"
          style={{ background: 'rgba(109,92,252,0.9)' }}
        >
          Replay
        </button>
        <button
          onClick={onBack}
          className="px-4 py-2 rounded-lg text-[12px] font-medium text-neutral-300 transition-all hover:scale-[1.02] active:scale-[0.98]"
          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          Back to menu
        </button>
      </motion.div>
    </motion.div>
  )
}
