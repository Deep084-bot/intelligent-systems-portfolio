import { motion } from 'framer-motion'
import { SectionLabel, Bar } from './ui'

export default function ResultScreen({
  heading = 'Review',
  score,
  gradeText,
  dimensions = [],
  breakdown = {},
  narrativeTitle,
  narrative,
  lessons = [],
  badge,
  onReplay,
  onBack,
  children,
}) {
  const rounded = Math.round(score)
  const scoreColor = rounded >= 70 ? '#a78bfa' : rounded >= 55 ? '#d4af37' : '#f87171'

  return (
    <motion.div
      className="flex flex-col h-full overflow-y-auto pr-1"
      initial="hidden"
      animate="show"
      exit="hidden"
      variants={{ show: { transition: { staggerChildren: 0.07 } } }}
    >
      <SectionLabel className="mb-2">{heading}</SectionLabel>

      <motion.div variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }} className="flex items-end gap-4 mb-4">
        <div>
          <div className="text-[40px] leading-none font-medium" style={{ color: scoreColor }}>{rounded}</div>
          {gradeText && <div className="text-[11px] text-neutral-500 mt-1 font-mono">{gradeText}</div>}
        </div>
        {badge && (
          <span
            className="inline-flex self-start mb-1 items-center px-2.5 py-1 rounded-md text-[10px] font-mono"
            style={{ background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.3)', color: '#d4af37' }}
          >
            {badge}
          </span>
        )}
      </motion.div>

      {dimensions.length > 0 && (
        <motion.div
          variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}
          className="rounded-xl p-3.5 mb-4 grid grid-cols-2 gap-x-5 gap-y-2"
          style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}
        >
          {dimensions.map((d) => {
            const v = Math.round(breakdown[d.id] ?? 0)
            return (
              <div key={d.id}>
                <div className="flex justify-between text-[9px] font-mono text-neutral-500 mb-0.5">
                  <span>{d.label}</span>
                  <span>{v}</span>
                </div>
                <Bar value={v} tone={v >= 70 ? 'purple' : v >= 50 ? 'gold' : 'red'} />
              </div>
            )
          })}
        </motion.div>
      )}

      {narrative && (
        <motion.div
          variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}
          className="rounded-xl p-4 mb-4"
          style={{ background: 'rgba(212,175,55,0.05)', border: '1px solid rgba(212,175,55,0.15)' }}
        >
          {narrativeTitle && (
            <div className="text-[9px] font-mono uppercase tracking-[0.25em] mb-2" style={{ color: '#d4af37' }}>
              {narrativeTitle}
            </div>
          )}
          <p className="text-[12.5px] leading-relaxed text-neutral-300">{narrative}</p>
        </motion.div>
      )}

      {children}

      {lessons.length > 0 && (
        <motion.div
          variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}
          className="rounded-xl p-3.5 mb-4"
          style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}
        >
          <SectionLabel className="mb-2">Lessons</SectionLabel>
          <ul className="space-y-1">
            {lessons.map((l, i) => (
              <li key={i} className="flex gap-2 text-[12px] leading-relaxed text-neutral-400">
                <span style={{ color: '#6d5cfc' }}>›</span>
                {l}
              </li>
            ))}
          </ul>
        </motion.div>
      )}

      <motion.div variants={{ hidden: { opacity: 0 }, show: { opacity: 1 } }} className="flex gap-2 mt-auto pt-2 pb-1">
        {onReplay && (
          <button
            onClick={onReplay}
            className="px-4 py-2 rounded-lg text-[12px] font-medium text-neutral-200 transition-all hover:scale-[1.02] active:scale-[0.98]"
            style={{ background: 'rgba(109,92,252,0.9)' }}
          >
            Replay
          </button>
        )}
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
