import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import useBrainStore from './store'

const LINES = [
  { text: 'Initializing Brain OS...', delay: 200 },
  { text: 'Loading Memory Graph...', delay: 300 },
  { text: 'Loading Engineering Principles...', delay: 350 },
  { text: 'Synchronizing Cognitive Modules...', delay: 400 },
  { text: 'Building Decision Tree...', delay: 300 },
  { text: '████████████████████ 100%', delay: 500 },
]

export default function BootSequence({ onComplete }) {
  const [visibleLines, setVisibleLines] = useState(0)
  const [showCursor, setShowCursor] = useState(true)
  const [skipped, setSkipped] = useState(false)
  const [skipVisible, setSkipVisible] = useState(false)

  const completeBoot = useBrainStore((s) => s.completeBoot)

  useEffect(() => {
    const timer = setTimeout(() => setSkipVisible(true), 1000)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (skipped) return
    let idx = 0
    let timers = []

    const showNext = () => {
      if (idx >= LINES.length) {
        const t = setTimeout(() => {
          completeBoot()
          onComplete?.()
        }, 600)
        timers.push(t)
        return
      }
      setVisibleLines(idx + 1)
      idx++
      const delay = LINES[idx - 1]?.delay || 300
      const t = setTimeout(showNext, delay)
      timers.push(t)
    }

    showNext()

    return () => timers.forEach(clearTimeout)
  }, [skipped, completeBoot, onComplete])

  useEffect(() => {
    if (visibleLines >= LINES.length) {
      setShowCursor(false)
      return
    }
    const c = setInterval(() => setShowCursor((s) => !s), 530)
    return () => clearInterval(c)
  }, [visibleLines])

  const handleSkip = useCallback(() => {
    setSkipped(true)
    setVisibleLines(LINES.length)
    const t = setTimeout(() => {
      completeBoot()
      onComplete?.()
    }, 300)
    return () => clearTimeout(t)
  }, [completeBoot, onComplete])

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8, ease: 'easeInOut' }}
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: '#0a0a0d' }}
    >
      <div className="font-mono text-sm leading-relaxed select-none">
        {LINES.slice(0, visibleLines).map((line, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.15 }}
            className={i === visibleLines - 1 ? 'text-primary-400' : 'text-neutral-500'}
          >
            <span className="text-neutral-700">{'> '}</span>
            {line.text}
          </motion.div>
        ))}
        {visibleLines <= LINES.length && (
          <motion.span
            animate={{ opacity: showCursor ? 1 : 0 }}
            className="text-primary-400 ml-1"
          >
            _
          </motion.span>
        )}
      </div>
      <AnimatePresence>
        {skipVisible && visibleLines < LINES.length && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleSkip}
            className="absolute bottom-12 text-[11px] text-neutral-700 hover:text-neutral-500 transition-colors font-mono"
          >
            Skip →
          </motion.button>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
