import { motion } from 'framer-motion'
import ArchitectureView from './ArchitectureView'

export default function ConstraintsBoard({ scenario, onBegin }) {
  const weights = { High: '#6d5cfc', Medium: '#d4af37', Low: '#52525b' }

  return (
    <motion.div
      className="flex flex-col h-full"
      initial="hidden"
      animate="show"
      variants={{ show: { transition: { staggerChildren: 0.07 } } }}
    >
      <div className="text-[9px] font-mono uppercase tracking-[0.25em] text-neutral-600 mb-1">System Constraints</div>
      <motion.p variants={{ show: { opacity: 1, y: 0 } }} className="text-[13px] text-neutral-400 leading-relaxed mb-4">
        These constraints are the only thing that makes a choice 'right'. Judge every decision against them.
      </motion.p>

      <div className="grid grid-cols-2 gap-2 mb-4">
        {scenario.constraints.map((c) => (
          <motion.div
            key={c.label}
            variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}
            className="px-3 py-2.5 rounded-xl"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-[12px] font-medium text-neutral-200">{c.label}</span>
              <span
                className="text-[8px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded"
                style={{ background: 'rgba(255,255,255,0.04)', color: weights[c.weight] || '#a1a1aa' }}
              >
                {c.weight}
              </span>
            </div>
            <p className="text-[10.5px] text-neutral-500 leading-relaxed">{c.detail}</p>
          </motion.div>
        ))}
      </div>

      <motion.div
        variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}
        className="rounded-xl p-3 mb-4"
        style={{ background: 'rgba(16,16,20,0.7)', border: '1px solid rgba(255,255,255,0.06)' }}
      >
        <div className="text-[9px] font-mono uppercase tracking-[0.25em] text-neutral-600 mb-1">Starting system</div>
        <ArchitectureView architecture={scenario.architecture.base} />
      </motion.div>

      <motion.div variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }} className="mt-auto">
        <button
          onClick={onBegin}
          className="px-4 py-2 rounded-lg text-[12px] font-medium text-neutral-200 transition-all hover:scale-[1.02] active:scale-[0.98]"
          style={{ background: 'rgba(109,92,252,0.9)' }}
        >
          Start the debate →
        </button>
      </motion.div>
    </motion.div>
  )
}
