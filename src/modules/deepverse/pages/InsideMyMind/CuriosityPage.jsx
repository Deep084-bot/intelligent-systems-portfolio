import { motion } from 'framer-motion'
import useBrainStore from './store'

export default function CuriosityPage() {
  const closeCuriosity = useBrainStore((s) => s.closeCuriosity)

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center"
      style={{ background: 'rgba(10,10,13,0.7)', backdropFilter: 'blur(20px)' }}
      onClick={closeCuriosity}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 8 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        onClick={(e) => e.stopPropagation()}
        className="max-w-md mx-6 px-8 py-10 rounded-2xl text-center"
        style={{
          background: 'rgba(16,14,10,0.9)',
          border: '1px solid rgba(212,175,55,0.22)',
          boxShadow: '0 24px 80px rgba(0,0,0,0.6), 0 0 60px rgba(212,175,55,0.06)',
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: 'easeOut', delay: 0.15 }}
          className="text-2xl mb-6"
        >
          ✦
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.35 }}
          className="text-[11px] uppercase tracking-[0.3em] mb-3"
          style={{ color: 'rgba(212,175,55,0.6)' }}
        >
          Curiosity
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="text-lg text-neutral-200 leading-relaxed mb-8"
          style={{ fontFamily: 'Georgia, serif' }}
        >
          Every project begins with a question.
        </motion.p>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.2, delay: 0.9 }}
        >
          <div
            className="text-[13px] text-neutral-500"
            style={{
              fontFamily: "'Segoe Script', 'Bradley Hand', 'Comic Sans MS', cursive",
              transform: 'rotate(-2deg)',
            }}
          >
            The day I stop being curious is the day I stop growing.
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}
