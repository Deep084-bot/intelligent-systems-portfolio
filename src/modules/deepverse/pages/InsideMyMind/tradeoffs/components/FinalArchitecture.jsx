import { motion } from 'framer-motion'
import ArchitectureView from './ArchitectureView'

export default function FinalArchitecture({ scenario, choiceIds, architecture, onReview }) {
  const chosen = scenario.decisions.map((d, i) => ({
    question: d.question,
    choice: d.choices.find((c) => c.id === choiceIds[i]),
  }))

  return (
    <motion.div
      className="flex flex-col h-full"
      initial="hidden"
      animate="show"
      exit="hidden"
      variants={{ show: { transition: { staggerChildren: 0.09 } } }}
    >
      <div className="text-[9px] font-mono uppercase tracking-[0.25em] text-neutral-600 mb-1">Final Architecture</div>
      <motion.h3 variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }} className="text-[17px] font-medium text-neutral-100 mb-1">
        {scenario.title} — the system you designed
      </motion.h3>
      <motion.p variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }} className="text-[11.5px] text-neutral-500 mb-4">
        Every choice reshaped the system. This is what your {choiceIds.length} decisions produced.
      </motion.p>

      <motion.div
        variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}
        className="rounded-xl p-4 mb-4"
        style={{ background: 'rgba(16,16,20,0.7)', border: '1px solid rgba(255,255,255,0.06)' }}
      >
        <ArchitectureView architecture={architecture} />
      </motion.div>

      <div className="space-y-2 mb-5">
        {chosen.map(({ question, choice }, i) => (
          <motion.div
            key={i}
            variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}
            className="px-3.5 py-2.5 rounded-xl"
            style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}
          >
            <div className="text-[9px] font-mono uppercase tracking-wider text-neutral-600 mb-1">
              Decision {i + 1} · {choice.title}
            </div>
            <p className="text-[11.5px] text-neutral-400 leading-snug">{question}</p>
          </motion.div>
        ))}
      </div>

      <motion.div variants={{ hidden: { opacity: 0 }, show: { opacity: 1 } }} className="mt-auto">
        <button
          onClick={onReview}
          className="px-4 py-2 rounded-lg text-[12px] font-medium text-neutral-200 transition-all hover:scale-[1.02] active:scale-[0.98]"
          style={{ background: 'rgba(109,92,252,0.9)' }}
        >
          Engineering review →
        </button>
      </motion.div>
    </motion.div>
  )
}
