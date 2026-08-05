import { motion } from 'framer-motion'

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
}

export default function CompanyBrief({ scenario, onNext }) {
  const { brief } = scenario

  return (
    <motion.div
      className="flex flex-col h-full"
      initial="hidden"
      animate="show"
      variants={{ show: { transition: { staggerChildren: 0.08 } } }}
    >
      <div className="text-[9px] font-mono uppercase tracking-[0.25em] text-neutral-600 mb-1">Company Brief</div>
      <motion.h3 variants={item} className="text-[20px] font-medium text-neutral-100 mb-1">
        {brief.company}
      </motion.h3>
      <motion.p variants={item} className="text-[11px] font-mono text-neutral-500 mb-5">
        {brief.headline}
      </motion.p>

      <motion.div variants={item} className="mb-5">
        <div className="text-[9px] font-mono uppercase tracking-[0.25em] text-neutral-600 mb-2">Business goals</div>
        <ul className="space-y-1.5">
          {brief.goals.map((g, i) => (
            <li key={i} className="flex gap-2.5 text-[13px] text-neutral-300 leading-relaxed">
              <span style={{ color: '#6d5cfc' }}>›</span>
              {g}
            </li>
          ))}
        </ul>
      </motion.div>

      <motion.div variants={item} className="mb-5">
        <div className="text-[9px] font-mono uppercase tracking-[0.25em] text-neutral-600 mb-2">Engineering limitations</div>
        <ul className="space-y-1.5">
          {brief.limitations.map((l, i) => (
            <li key={i} className="flex gap-2.5 text-[13px] text-neutral-400 leading-relaxed">
              <span style={{ color: '#d4af37' }}>›</span>
              {l}
            </li>
          ))}
        </ul>
      </motion.div>

      <motion.div variants={item} className="mt-auto">
        <button
          onClick={onNext}
          className="px-4 py-2 rounded-lg text-[12px] font-medium text-neutral-200 transition-all hover:scale-[1.02] active:scale-[0.98]"
          style={{ background: 'rgba(109,92,252,0.9)' }}
        >
          Review constraints →
        </button>
      </motion.div>
    </motion.div>
  )
}
