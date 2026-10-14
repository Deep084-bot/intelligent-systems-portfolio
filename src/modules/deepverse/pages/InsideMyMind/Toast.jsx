import { motion, AnimatePresence } from 'framer-motion'
import useBrainStore from './store'

export default function Toast() {
  const toast = useBrainStore((s) => s.toast)

  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          key={toast.id}
          initial={{ opacity: 0, y: 12, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.97 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[70] pointer-events-none"
        >
          <div
            className="px-4 py-2 rounded-full text-[11px] font-mono tracking-wide text-neutral-300"
            style={{
              background: 'rgba(16,16,20,0.9)',
              border: '1px solid rgba(212,175,55,0.25)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.5), 0 0 24px rgba(212,175,55,0.08)',
              backdropFilter: 'blur(16px)',
            }}
          >
            {toast.text}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
