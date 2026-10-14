import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export default function Onboarding() {
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    function handleInteraction() {
      setDismissed(true)
    }

    window.addEventListener('wheel', handleInteraction, { once: true })
    window.addEventListener('touchstart', handleInteraction, { once: true })
    window.addEventListener('keydown', handleInteraction, { once: true })

    return () => {
      window.removeEventListener('wheel', handleInteraction)
      window.removeEventListener('touchstart', handleInteraction)
      window.removeEventListener('keydown', handleInteraction)
    }
  }, [])

  return (
    <AnimatePresence>
      {!dismissed && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.2, delay: 0.5 }}
          className="absolute inset-0 pointer-events-none flex flex-col items-center justify-end pb-24"
        >
          <div className="flex flex-col items-center gap-2">
            <motion.p
              animate={{ y: [0, 4, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              className="text-xs tracking-widest"
              style={{
                color: 'rgba(255, 255, 255, 0.35)',
                fontWeight: 200,
                letterSpacing: '0.15em',
              }}
            >
              SCROLL TO BEGIN
            </motion.p>
            <motion.span
              animate={{ y: [0, 6, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              style={{ color: 'rgba(255, 255, 255, 0.25)' }}
              className="text-lg"
            >
              ↓
            </motion.span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
