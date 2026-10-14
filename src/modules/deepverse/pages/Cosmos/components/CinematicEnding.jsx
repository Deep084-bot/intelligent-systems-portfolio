import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { endingState } from '../scenes/endingState'

// The closing narrative. Displayed one line at a time (never accumulated), on a
// sequentially controlled timeline so it reads as a deliberate cinematic
// conclusion regardless of how fast the visitor scrolled to the end.
const LINES = [
  { text: 'This is everything we have ever observed.' },
  { text: 'Somewhere inside it: one ordinary galaxy.' },
  { text: 'One ordinary star. One small blue planet.' },
  { text: 'On that planet, someone is looking at all of this.' },
  { text: 'That someone is you.' },
  { text: 'You are unimaginably small.' },
  { text: 'Yet your dreams and your kindness exist nowhere else.' },
  { text: 'The universe will never know your name.' },
  { text: "But someone's world might. So build something beautiful.", final: true },
]

const STEP = 1300 // ms each line holds before advancing
const HOLD = 1300 // ms pause after the final line before the return action
const FADE = 0.65 // s crossfade between lines
const ENTER_AT = 0.94 // progress at which the ending begins
const RESET_BELOW = 0.9 // progress at which the ending resets (hysteresis)
const TOTAL_MS = (LINES.length - 1) * STEP + HOLD

export default function CinematicEnding({ progress, reducedMotion, onReturn }) {
  const [index, setIndex] = useState(-1)
  const [done, setDone] = useState(false)
  const startedRef = useRef(false)
  const timersRef = useRef([])
  const rafRef = useRef(0)

  const clearTimers = () => {
    timersRef.current.forEach(clearTimeout)
    timersRef.current = []
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    rafRef.current = 0
  }

  const reset = () => {
    startedRef.current = false
    endingState.active = false
    endingState.dim = 0
    clearTimers()
    setIndex(-1)
    setDone(false)
  }

  const start = () => {
    startedRef.current = true
    endingState.active = true
    setDone(false)

    if (reducedMotion) {
      // Respect reduced motion: no crossfades, no y-drift, no long sequence.
      setIndex(LINES.length - 1)
      endingState.dim = 0.85
      timersRef.current.push(setTimeout(() => setDone(true), 900))
      return
    }

    setIndex(0)
    const scheduleFrom = (i) => {
      const t = setTimeout(() => {
        if (!startedRef.current) return
        if (i < LINES.length - 1) {
          setIndex(i + 1)
          scheduleFrom(i + 1)
        } else {
          timersRef.current.push(setTimeout(() => {
            if (startedRef.current) setDone(true)
          }, HOLD))
        }
      }, STEP)
      timersRef.current.push(t)
    }
    scheduleFrom(0)

    // Smoothly recede the scene across the whole sequence.
    const t0 = performance.now()
    const tick = (now) => {
      if (!startedRef.current) return
      endingState.dim = Math.min(1, (now - t0) / TOTAL_MS)
      if (endingState.dim < 1) rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
  }

  // Start / reset driven by scroll progress (with hysteresis so it does not
  // chatter at the boundary).
  useEffect(() => {
    if (progress >= ENTER_AT && !startedRef.current) start()
    else if (progress < RESET_BELOW && startedRef.current) reset()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [progress])

  // Keyboard skip: once the ending is playing, Enter/Space completes it so a
  // keyboard user is never forced to wait through the whole sequence.
  useEffect(() => {
    if (index < 0 || done) return
    const onKey = (e) => {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') {
        e.preventDefault()
        clearTimers()
        setIndex(LINES.length - 1)
        endingState.dim = Math.max(endingState.dim, 0.85)
        setDone(true)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [index, done])

  useEffect(() => () => reset(), []) // eslint-disable-line react-hooks/exhaustive-deps

  if (index < 0) return null
  const line = LINES[index]

  return (
    <>
      {/* Graded darkening: intentional, smooth approach to a near-black finale
          that still leaves the faintest hint of the Cosmic Web behind. */}
      <motion.div
        aria-hidden
        className="absolute inset-0 z-10 pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.92 }}
        transition={{ duration: reducedMotion ? 0.6 : TOTAL_MS / 1000, ease: 'linear' }}
        style={{
          background:
            'radial-gradient(130% 100% at 50% 42%, rgba(5,7,18,0.45) 0%, rgba(2,4,12,0.9) 68%, rgba(1,2,8,0.96) 100%)',
        }}
      />

      {/* Narrative — exactly one line on screen at a time, crossfaded in place. */}
      <div
        className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none"
        role="status"
        aria-live="polite"
      >
        <AnimatePresence initial={false}>
          <motion.div
            key={index}
            className="absolute inset-0 flex items-center justify-center px-7 sm:px-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reducedMotion ? 0.2 : FADE, ease: 'easeInOut' }}
          >
            <motion.p
              initial={{ opacity: 0, y: reducedMotion ? 0 : 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: reducedMotion ? 0.2 : FADE, ease: 'easeOut' }}
              className="text-center"
              style={{
                fontFamily: '"Cormorant Garamond", Georgia, "Times New Roman", serif',
                fontStyle: 'italic',
                fontWeight: line.final ? 400 : 300,
                fontSize: line.final ? 'clamp(26px, 4.8vw, 46px)' : 'clamp(19px, 3.4vw, 30px)',
                lineHeight: 1.5,
                letterSpacing: '0.012em',
                color: line.final ? 'rgba(255,255,255,0.92)' : 'rgba(255,255,255,0.78)',
                maxWidth: line.final ? '30rem' : '34rem',
                textWrap: 'balance',
              }}
            >
              {line.text}
            </motion.p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Return action — anchored to the bottom so it can never overlap the
          centred narrative. Appears only after the sequence + pause. */}
      {done && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.9, delay: reducedMotion ? 0 : 0.3 }}
          className="absolute inset-x-0 bottom-16 sm:bottom-20 z-30 flex justify-center px-6 pointer-events-none"
        >
          <button
            type="button"
            onClick={onReturn}
            data-testid="cosmos-return"
            className="pointer-events-auto rounded-full border border-white/20 bg-white/5 px-7 py-3 text-[12px] tracking-[0.22em] uppercase text-white/75 hover:text-white hover:border-white/45 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
          >
            Return to DeepVerse
          </button>
        </motion.div>
      )}
    </>
  )
}
