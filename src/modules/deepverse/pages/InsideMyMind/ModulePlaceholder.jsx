import { motion } from 'framer-motion'
import { MODULE_DETAILS } from './nodes.config'

export default function ModulePlaceholder({ moduleId, onBack }) {
  const details = MODULE_DETAILS[moduleId]

  if (!details) return null

  const icon = details.title === 'Machine Learning' ? '🧠' : details.title === 'AI' ? '🤖' : details.title === 'Learning' ? '📖' : details.title === 'Tradeoffs' ? '⚖' : details.title === 'Debugging' ? '🔍' : details.title === 'Performance' ? '⚡' : details.title === 'Databases' ? '🗄' : details.title === 'Product Thinking' ? '🎯' : details.title === 'Systems Thinking' ? '∞' : details.title === 'Scalability' ? '📈' : details.title === 'API Design' ? '⇋' : details.title === 'Distributed Systems' ? '🌐' : details.title === 'Problem Solving' ? '🧩' : details.title === 'Architecture' ? '🏛' : '🧠'

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="absolute inset-0 z-30 flex items-center justify-center"
      style={{
        background: 'rgba(10,10,13,0.85)',
        backdropFilter: 'blur(32px)',
        WebkitBackdropFilter: 'blur(32px)',
      }}
    >
      <motion.div
        initial={{ scale: 0.85, y: 30, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.85, y: 30, opacity: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
        className="max-w-lg mx-auto px-6 text-center"
      >
        <div className="relative inline-flex mb-4">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, ease: 'easeOut', delay: 0.25 }}
            className="text-3xl"
          >
            {icon}
          </motion.div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.35 }}
            className="absolute inset-0"
            style={{
              background: 'radial-gradient(50% 50% at 50% 50%, rgba(109,92,252,0.15) 0%, transparent 70%)',
              filter: 'blur(8px)',
              transform: 'scale(2)',
            }}
          />
        </div>

        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="text-xl font-semibold text-neutral-200 mb-1"
        >
          {details.title}
        </motion.h2>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.35 }}
          className="text-[13px] text-neutral-500 mb-1 font-mono"
        >
          {details.subtitle}
        </motion.p>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.4 }}
          className="text-[13px] text-neutral-600 leading-relaxed mb-6 max-w-sm mx-auto"
        >
          {details.description}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.45 }}
          className="mb-8"
        >
          <p className="text-[10px] text-neutral-700 uppercase tracking-widest font-mono mb-3">Coming Experiences</p>
          <div className="flex flex-wrap justify-center gap-2">
            {details.future.map((item) => (
              <span
                key={item}
                className="px-2.5 py-1 rounded-full text-[10px] text-neutral-600 font-mono"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.04)' }}
              >
                {item}
              </span>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.5 }}
        >
          <div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] text-neutral-600 font-mono mb-6"
            style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}
          >
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#f59e0b' }} />
            Cognitive Module — Under Construction
          </div>
        </motion.div>

        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.55 }}
          onClick={onBack}
          className="px-4 py-2 rounded-lg text-[12px] font-medium transition-all"
          style={{
            background: 'rgba(255,255,255,0.04)',
            color: '#a1a1aa',
            border: '1px solid rgba(255,255,255,0.06)',
          }}
          whileHover={{ background: 'rgba(255,255,255,0.08)', scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          ← Back to Brain OS
        </motion.button>
      </motion.div>
    </motion.div>
  )
}
