import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const LINES = [
  { text: 'And yet\u2026', delay: 1500 },
  { text: 'you are the only one\nwho will ever read this.', delay: 3500 },
  { text: 'What will you build\nwith all this space?', delay: 10000 },
]

export default function EndingSequence({ visible, onScrollUp }) {
  const [lineIndex, setLineIndex] = useState(-1)

  useEffect(() => {
    if (!visible) {
      setLineIndex(-1)
      return
    }

    const timers = []
    for (let i = 0; i < LINES.length; i++) {
      timers.push(setTimeout(() => setLineIndex(i), LINES[i].delay))
    }

    return () => timers.forEach(clearTimeout)
  }, [visible])

  useEffect(() => {
    if (!visible) return

    function handleWheel(e) {
      if (e.deltaY < -10) {
        onScrollUp?.()
      }
    }

    window.addEventListener('wheel', handleWheel, { passive: true })
    return () => window.removeEventListener('wheel', handleWheel)
  }, [visible, onScrollUp])

  if (!visible) return null

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 2, ease: 'easeOut' }}
        className="absolute inset-0 bg-[#050505] pointer-events-none"
      />

      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <AnimatePresence mode="wait">
          {lineIndex >= 0 && (
            <motion.div
              key={lineIndex}
              initial={{ opacity: 0, y: 20 }}
              animate={{
                opacity: 1,
                y: 0,
                transition: { duration: 1.5, ease: 'easeOut' },
              }}
              exit={{
                opacity: 0,
                y: -8,
                transition: { duration: 1.8, ease: 'easeInOut' },
              }}
              className="text-center max-w-lg px-8"
            >
              <p
                style={{
                  color: 'rgba(255, 255, 255, 0.78)',
                  fontFamily: '"Cormorant Garamond", Georgia, "Times New Roman", serif',
                  fontStyle: 'italic',
                  fontWeight: 400,
                  fontSize: 'clamp(22px, 4.5vw, 38px)',
                  letterSpacing: '0.08em',
                  lineHeight: 1.6,
                  whiteSpace: 'pre-line',
                }}
              >
                {LINES[lineIndex].text}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {lineIndex >= LINES.length - 1 && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.35 }}
            transition={{ delay: 6, duration: 2 }}
            className="absolute bottom-16 text-sm tracking-widest"
            style={{
              color: 'rgba(255, 255, 255, 0.35)',
              fontWeight: 200,
              letterSpacing: '0.12em',
            }}
          >
            SCROLL UP TO RETURN
          </motion.p>
        )}
      </div>
    </>
  )
}
