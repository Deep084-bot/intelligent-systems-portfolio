import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { endingState } from '../scenes/endingState'

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

const FADE = 0.65
const ENTER_AT = 0.94
const RESET_BELOW = 0.9
const FADE_OUT_SCENE_MS = 1600
const UNIVERSE_HOLD_MS = 5000
const SHORT_QUOTE_MIN_MS = 4000
const NARRATIVE_MIN_MS = 3000
const FINAL_QUOTE_MIN_MS = 8000

function getNarrativeMin(i) {
  const text = LINES[i] ? LINES[i].text : ''
  // Give longer lines more time
  const base = NARRATIVE_MIN_MS
  const extra = Math.min(2000, Math.max(0, (text.length - 80) * 15))
  return base + extra
}

export default function CinematicEnding({ progress, reducedMotion, onReturn, onSceneHide, onQuoteOnly }) {
  const [phase, setPhase] = useState('idle') // idle | holdingUniverse | fadingScene | narrative | quoteOnly
  const [index, setIndex] = useState(-1)
  const [showQuote, setShowQuote] = useState(false)
  const [showControls, setShowControls] = useState(false)
  const startedRef = useRef(false)
  const timersRef = useRef([])
  const rafRef = useRef(0)
  const enterTimeRef = useRef(0)

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
    setPhase('idle')
    setIndex(-1)
    setShowQuote(false)
    setShowControls(false)
    enterTimeRef.current = 0
    if (onSceneHide) onSceneHide(false)
    if (onQuoteOnly) onQuoteOnly(false)
  }

  const beginFadeToNarrative = () => {
    if (!startedRef.current) return
    setPhase('fadingScene')
    setIndex(-1)
    setShowQuote(false)
    setShowControls(false)
    if (onQuoteOnly) onQuoteOnly(false)

    const duration = reducedMotion ? 800 : FADE_OUT_SCENE_MS
    const t0 = performance.now()
    const tick = (now) => {
      if (!startedRef.current) return
      const p = Math.min(1, (now - t0) / duration)
      endingState.dim = p
      if (p < 1) {
        rafRef.current = requestAnimationFrame(tick)
      } else {
        endingState.dim = 1
        if (onSceneHide) onSceneHide(false) // keep scene visible during narrative on black screen
        setPhase('narrative')
        startNarrative()
      }
    }
    rafRef.current = requestAnimationFrame(tick)
  }

  const start = () => {
    startedRef.current = true
    endingState.active = true
    enterTimeRef.current = Date.now()
    // Hold universe stage visible for at least 5 seconds before transitioning
    setPhase('holdingUniverse')
    setIndex(-1)
    setShowQuote(false)
    setShowControls(false)
    endingState.dim = 0
    if (onSceneHide) onSceneHide(false)
    if (onQuoteOnly) onQuoteOnly(false)
    const t = setTimeout(() => {
      if (!startedRef.current) return
      // Only transition if still in holding phase
      if (phaseRef.current === 'holdingUniverse') {
        beginFadeToNarrative()
      }
    }, UNIVERSE_HOLD_MS)
    timersRef.current.push(t)
  }

  const phaseRef = useRef('idle')
  useEffect(() => { phaseRef.current = phase }, [phase])

  const startNarrative = () => {
    if (reducedMotion) {
      setIndex(LINES.length - 1)
      timersRef.current.push(setTimeout(() => {
        if (!startedRef.current) return
        goToQuoteOnly()
      }, Math.max(4000, NARRATIVE_MIN_MS)))
      return
    }
    setIndex(0)
    scheduleNarrativeLine(0)
  }

  const scheduleNarrativeLine = (i) => {
    const minDisplay = getNarrativeMin(i)
    const t = setTimeout(() => {
      if (!startedRef.current) return
      if (i < LINES.length - 1) {
        setIndex(i + 1)
        scheduleNarrativeLine(i + 1)
      } else {
        timersRef.current.push(setTimeout(() => {
          if (startedRef.current) goToQuoteOnly()
        }, Math.max(minDisplay, NARRATIVE_MIN_MS)))
      }
    }, minDisplay)
    timersRef.current.push(t)
  }

  const goToQuoteOnly = () => {
    if (!startedRef.current) return
    setPhase('quoteOnly')
    if (onSceneHide) onSceneHide(true)
    if (onQuoteOnly) onQuoteOnly(true)
    timersRef.current.push(setTimeout(() => {
      if (!startedRef.current) return
      setShowQuote(true)
      timersRef.current.push(setTimeout(() => {
        if (!startedRef.current) return
        setShowControls(true)
      }, reducedMotion ? 200 : 500))
    }, reducedMotion ? 200 : 300))
  }

  useEffect(() => {
    if (progress >= ENTER_AT && !startedRef.current) start()
    else if (progress < RESET_BELOW && startedRef.current) reset()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [progress])

  useEffect(() => {
    if (phase !== 'narrative' && phase !== 'quoteOnly') return
    const onKey = (e) => {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') {
        e.preventDefault()
        clearTimers()
        if (phase === 'narrative') {
          goToQuoteOnly()
        } else if (phase === 'quoteOnly') {
          onReturn && onReturn()
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [phase, onReturn])

  useEffect(() => () => reset(), []) // eslint-disable-line react-hooks/exhaustive-deps

  if (phase === 'idle') return null

  if (phase === 'fadingScene') {
    return (
      <motion.div
        aria-hidden
        className="absolute inset-0 z-40 pointer-events-none bg-black"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: reducedMotion ? 0.6 : FADE_OUT_SCENE_MS / 1000, ease: 'linear' }}
      />
    )
  }

  if (phase === 'holdingUniverse') {
    return null
  }

  if (phase === 'narrative') {
    if (index < 0) return null
    const line = LINES[index]
    return (
      <>
        <div className="absolute inset-0 z-50 bg-black" aria-hidden />
        <div
          className="absolute inset-0 z-[60] flex items-center justify-center px-7 sm:px-10"
          role="status"
          aria-live="polite"
        >
          <AnimatePresence initial={false} mode="wait">
            <motion.div
              key={index}
              className="absolute inset-0 flex items-center justify-center px-7 sm:px-10"
              initial={{ opacity: reducedMotion ? 1 : 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: reducedMotion ? 1 : 0 }}
              transition={{ duration: reducedMotion ? 0 : FADE, ease: 'easeInOut' }}
            >
              <motion.p
                initial={{ opacity: reducedMotion ? 1 : 0, y: reducedMotion ? 0 : 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: reducedMotion ? 0 : FADE, ease: 'easeOut' }}
                className="text-center"
                style={{
                  fontFamily: '"Cormorant Garamond", Georgia, "Times New Roman", serif',
                  fontStyle: 'italic',
                  fontWeight: line.final ? 400 : 300,
                  fontSize: line.final ? 'clamp(26px, 4.8vw, 46px)' : 'clamp(19px, 3.4vw, 30px)',
                  lineHeight: 1.6,
                  letterSpacing: '0.012em',
                  color: line.final ? 'rgba(255,255,255,0.98)' : 'rgba(255,255,255,0.92)',
                  maxWidth: line.final ? '34rem' : '38rem',
                  textWrap: 'balance',
                  padding: '0 1rem',
                }}
              >
                {line.text}
              </motion.p>
            </motion.div>
          </AnimatePresence>
        </div>
      </>
    )
  }

  if (phase === 'quoteOnly') {
    return (
      <>
        <div className="absolute inset-0 z-50 bg-black" aria-hidden />
        <div
          className="absolute inset-0 z-[60] flex items-center justify-center px-7 sm:px-10"
          role="status"
          aria-live="polite"
        >
          {showQuote && (
            <motion.p
              initial={{ opacity: reducedMotion ? 1 : 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: reducedMotion ? 0 : 0.8, ease: 'easeIn' }}
              className="text-center"
              style={{
                fontFamily: '"Cormorant Garamond", Georgia, "Times New Roman", serif',
                fontStyle: 'italic',
                fontWeight: 400,
                fontSize: 'clamp(26px, 4.8vw, 46px)',
                lineHeight: 1.6,
                letterSpacing: '0.012em',
                color: 'rgba(255,255,255,0.98)',
                maxWidth: '34rem',
                textWrap: 'balance',
                padding: '0 1rem',
              }}
            >
              But someone's world might. So build something beautiful.
            </motion.p>
          )}
        </div>
        {showControls && (
          <motion.div
            initial={{ opacity: reducedMotion ? 1 : 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="absolute inset-x-0 bottom-16 sm:bottom-20 z-[70] flex justify-center px-6 pointer-events-none"
          >
            <button
              type="button"
              onClick={onReturn}
              data-testid="cosmos-return"
              className="pointer-events-auto rounded-full border border-white/40 bg-black/60 px-7 py-3 text-[12px] tracking-[0.22em] uppercase text-white/95 hover:text-white hover:border-white/80 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
            >
              Return to DeepVerse
            </button>
          </motion.div>
        )}
      </>
    )
  }

  return null
}
