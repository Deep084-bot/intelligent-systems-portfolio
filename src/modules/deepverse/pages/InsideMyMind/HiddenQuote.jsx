import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import useBrainStore from './store'

const QUOTES = [
  'Build first. Perfect later.',
  'Curiosity scales.',
  'Debugging teaches humility.',
  'Systems remember everything.',
  'Every abstraction has a cost.',
  'Measure before optimizing.',
]

export default function HiddenQuote() {
  const [quote, setQuote] = useState(null)
  const recordDiscovery = useBrainStore((s) => s.recordDiscovery)
  const recordedRef = useRef(false)

  useEffect(() => {
    const text = QUOTES[Math.floor(Math.random() * QUOTES.length)]
    const q = {
      text,
      x: 8 + Math.random() * 70,
      y: 15 + Math.random() * 60,
    }
    setQuote(q)
    const t = setTimeout(() => {
      if (!recordedRef.current) {
        recordedRef.current = true
        recordDiscovery('quote')
      }
    }, 2000)
    const clear = setTimeout(() => setQuote(null), 7000)
    return () => { clearTimeout(t); clearTimeout(clear) }
  }, [recordDiscovery])

  return (
    <AnimatePresence>
      {quote && (
        <motion.div
          key={quote.text}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.6, ease: 'easeInOut' }}
          className="fixed z-[1] pointer-events-none"
          style={{
            left: `${quote.x}%`,
            top: `${quote.y}%`,
            maxWidth: 240,
          }}
        >
          <div
            className="text-[11px] leading-relaxed tracking-wide text-neutral-500"
            style={{ fontStyle: 'italic', opacity: 0.35 }}
          >
            “{quote.text}”
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
