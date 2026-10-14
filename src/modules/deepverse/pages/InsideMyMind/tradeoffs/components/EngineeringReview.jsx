import { motion } from 'framer-motion'
import { JUDGMENT_DIMENSIONS, judgmentGrade } from '../scoring'
import JudgmentRadar from './JudgmentRadar'

export default function EngineeringReview({ scenario, result, progress, prevBest, onReplay, onBack }) {
  const score = Math.round(result.score)
  const grade = judgmentGrade(score)
  const isBest = prevBest === null || score > prevBest

  return (
    <motion.div
      className="flex flex-col h-full overflow-y-auto pr-1"
      initial="hidden"
      animate="show"
      exit="hidden"
      variants={{ show: { transition: { staggerChildren: 0.08 } } }}
    >
      <div className="text-[9px] font-mono uppercase tracking-[0.25em] text-neutral-600 mb-2">Engineering Review</div>

      <motion.div variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }} className="flex items-end gap-4 mb-4">
        <div>
          <div className="text-[40px] leading-none font-medium" style={{ color: score >= 65 ? '#a78bfa' : score >= 50 ? '#d4af37' : '#f87171' }}>
            {score}
          </div>
          <div className="text-[11px] text-neutral-500 mt-1 font-mono">{grade}</div>
        </div>
        <div className="flex flex-col gap-1 mb-1">
          {isBest && progress?.completed && (
            <span
              className="inline-flex self-start items-center px-2.5 py-1 rounded-md text-[10px] font-mono"
              style={{ background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.3)', color: '#d4af37' }}
            >
              ★ NEW BEST — attempt {progress.attempts}
            </span>
          )}
          {!progress?.completed && (
            <span
              className="inline-flex self-start items-center px-2.5 py-1 rounded-md text-[10px] font-mono"
              style={{ background: 'rgba(109,92,252,0.1)', border: '1px solid rgba(109,92,252,0.3)', color: '#a78bfa' }}
            >
              ◈ First design — scored on judgment, not correctness
            </span>
          )}
        </div>
      </motion.div>

      <div className="grid grid-cols-2 gap-4 mb-5">
        <motion.div
          variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}
          className="rounded-xl p-3.5"
          style={{ background: 'rgba(16,16,20,0.7)', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <div className="text-[9px] font-mono uppercase tracking-[0.25em] text-neutral-600 mb-2">Judgment profile</div>
          <JudgmentRadar values={result.breakdown} />
        </motion.div>

        <motion.div variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }} className="rounded-xl p-3.5 flex flex-col justify-center" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div className="space-y-2">
            {JUDGMENT_DIMENSIONS.map((d) => {
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
      </div>

      <motion.div
        variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}
        className="rounded-xl p-4 mb-4"
        style={{ background: 'rgba(212,175,55,0.05)', border: '1px solid rgba(212,175,55,0.15)' }}
      >
        <div className="text-[9px] font-mono uppercase tracking-[0.25em] mb-2" style={{ color: '#d4af37' }}>
          My preferred solution
        </div>
        <p className="text-[12.5px] leading-relaxed text-neutral-300">{result.preferredNarrative}</p>
      </motion.div>

      <motion.div
        variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}
        className="rounded-xl p-3.5 mb-4"
        style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}
      >
        <div className="text-[9px] font-mono uppercase tracking-[0.25em] text-neutral-600 mb-2">Lessons</div>
        <ul className="space-y-1">
          {result.lessons.map((l, i) => (
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
