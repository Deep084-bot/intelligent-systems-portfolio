import { motion } from 'framer-motion'
import { DIMENSIONS, reviewGrade } from '../scoring'
import { CATEGORIES } from '../engine'

const CAT_COLOR = (id) => {
  const map = {
    performance: '#d19a66',
    security: '#f87171',
    scalability: '#38bdf8',
    architecture: '#a78bfa',
    readability: '#34d399',
    maintainability: '#d4af37',
    correctness: '#4ade80',
    testing: '#f59e0b',
  }
  return map[id] || '#a1a1aa'
}

export default function ReviewSummary({ scenario, result, prevBest, isNewBest, onReplay, onExit }) {
  const { score, breakdown, verdict } = result
  const grade = reviewGrade(score)
  const approve = verdict === 'approve'
  const missed = scenario.issues.filter((i) => !result.found.includes(i.id))
  const criticalMissed = missed.filter((i) => i.severity === 'critical')
  const totalWeight = scenario.issues.reduce((s, i) => s + i.importance, 0)

  return (
    <motion.div
      className="flex flex-col h-full"
      initial="hidden"
      animate="show"
      variants={{ show: { transition: { staggerChildren: 0.07 } } }}
    >
      <div className="text-[9px] font-mono uppercase tracking-[0.25em] text-neutral-600 mb-1">Review complete</div>

      <div className="grid grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] gap-4 flex-1 min-h-0">
        <div className="flex flex-col gap-3 min-h-0 overflow-y-auto pr-1">
          <motion.div
            variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}
            className="rounded-xl p-4"
            style={{ background: 'rgba(16,16,20,0.9)', border: '1px solid rgba(255,255,255,0.07)' }}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-[10px] font-mono uppercase tracking-wider text-neutral-600">{scenario.title}</div>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-[34px] leading-none font-semibold" style={{ color: score >= 70 ? '#4ade80' : score >= 55 ? '#d4af37' : '#f87171' }}>
                    {score}
                  </span>
                  <span className="text-[12px] text-neutral-400">{grade}</span>
                </div>
                {isNewBest && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="inline-block text-[9px] font-mono px-2 py-0.5 rounded mt-1"
                    style={{ background: 'rgba(212,175,55,0.12)', color: '#d4af37', border: '1px solid rgba(212,175,55,0.3)' }}
                  >
                    ★ NEW BEST
                  </motion.div>
                )}
              </div>
              <div className="text-right shrink-0">
                <div
                  className="text-[10px] font-mono px-2.5 py-1 rounded-md"
                  style={{
                    background: approve ? 'rgba(52,211,153,0.12)' : 'rgba(248,113,113,0.12)',
                    color: approve ? '#4ade80' : '#f87171',
                    border: `1px solid ${approve ? 'rgba(52,211,153,0.3)' : 'rgba(248,113,113,0.3)'}`,
                  }}
                >
                  {approve ? 'APPROVED' : 'CHANGES REQUESTED'}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-1.5 mt-4">
              {DIMENSIONS.map((d) => {
                const v = breakdown[d.id]
                return (
                  <div key={d.id} className="rounded-lg px-2.5 py-2" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div className="flex items-baseline justify-between mb-1">
                      <span className="text-[8.5px] text-neutral-500 leading-tight">{d.label}</span>
                      <span className="text-[11px] font-mono" style={{ color: v >= 70 ? '#4ade80' : v >= 55 ? '#d4af37' : '#f87171' }}>
                        {v}
                      </span>
                    </div>
                    <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${v}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                        className="h-full rounded-full"
                        style={{ background: v >= 70 ? '#4ade80' : v >= 55 ? '#d4af37' : '#f87171' }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>

            {criticalMissed.length > 0 && (
              <div className="mt-3 text-[11px] font-mono rounded-md px-3 py-2" style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.25)', color: '#f87171' }}>
                ⚠ You approved this PR while missing {criticalMissed.length} critical issue{criticalMissed.length > 1 ? 's' : ''} — it would have shipped broken.
              </div>
            )}
          </motion.div>

          <motion.div
            variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}
            className="rounded-xl p-4"
            style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}
          >
            <div className="text-[9px] font-mono uppercase tracking-[0.25em] text-neutral-600 mb-2">Your review timeline</div>
            <div className="space-y-1.5">
              {result.comments.length === 0 && <div className="text-[11px] text-neutral-600">You left no comments on this review.</div>}
              {result.comments.map((c) => (
                <div key={c.id} className="flex items-center gap-2 text-[10.5px] font-mono rounded-md px-2.5 py-1.5" style={{ background: 'rgba(255,255,255,0.02)' }}>
                  <span className="text-neutral-500 shrink-0">{c.file.split('/').pop()}:{c.line}</span>
                  {c.category && (
                    <span className="shrink-0 text-[8px] px-1.5 py-0.5 rounded" style={{ background: CAT_COLOR(c.category) + '1a', color: CAT_COLOR(c.category) }}>
                      {CATEGORIES.find((x) => x.id === c.category)?.label}
                    </span>
                  )}
                  <span className="text-[10px] text-neutral-500 truncate flex-1">{c.text || (c.hit ? 'Found it.' : 'Note.')}</span>
                  <span
                    className="shrink-0 text-[8px] px-1.5 py-0.5 rounded"
                    style={{
                      background: c.hit ? 'rgba(74,222,128,0.1)' : 'rgba(255,255,255,0.04)',
                      color: c.hit ? '#4ade80' : '#52525b',
                      border: `1px solid ${c.hit ? 'rgba(74,222,128,0.2)' : 'transparent'}`,
                    }}
                  >
                    {c.hit ? 'HIT' : 'NOTE'}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        <div className="flex flex-col gap-3 min-h-0 overflow-y-auto pr-1">
          <motion.div
            variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}
            className="rounded-xl p-4"
            style={{ background: 'rgba(16,16,20,0.9)', border: '1px solid rgba(109,92,252,0.25)' }}
          >
            <div className="text-[9px] font-mono uppercase tracking-[0.25em] text-neutral-600 mb-2">My actual review</div>
            <p className="text-[12px] text-neutral-300 leading-relaxed">{scenario.review.feedback}</p>
          </motion.div>

          <motion.div
            variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}
            className="rounded-xl p-4"
            style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}
          >
            <div className="text-[9px] font-mono uppercase tracking-[0.25em] text-neutral-600 mb-2">Weighted findings</div>
            <div className="space-y-1">
              {scenario.issues.map((i) => {
                const found = result.found.includes(i.id)
                const pct = Math.round(100 * i.importance / totalWeight)
                return (
                  <div key={i.id} className="flex items-center gap-2 text-[10px] font-mono rounded-md px-2.5 py-1" style={{ background: 'rgba(255,255,255,0.02)' }}>
                    <span style={{ color: found ? '#4ade80' : '#52525b' }}>{found ? '✓' : '○'}</span>
                    <span className="text-neutral-400 truncate flex-1">{i.severity} · {i.reason}</span>
                    <span className="text-[8px] text-neutral-600 shrink-0">{pct}%</span>
                  </div>
                )
              })}
            </div>
          </motion.div>

          <motion.div variants={{ hidden: { opacity: 0 }, show: { opacity: 1 } }} className="mt-auto flex gap-2">
            <button
              onClick={onReplay}
              className="px-4 py-2 rounded-lg text-[12px] font-medium text-neutral-300 transition-all hover:scale-[1.02] active:scale-[0.98]"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              ↻ Review again
            </button>
            <button
              onClick={onExit}
              className="px-4 py-2 rounded-lg text-[12px] font-medium text-neutral-200 transition-all hover:scale-[1.02] active:scale-[0.98]"
              style={{ background: 'rgba(109,92,252,0.9)' }}
            >
              Back to menu
            </button>
          </motion.div>
        </div>
      </div>
    </motion.div>
  )
}
