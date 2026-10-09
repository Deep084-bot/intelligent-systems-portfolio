import { useCallback, useEffect, useRef } from 'react'
import { motion, useMotionValue, useSpring } from 'framer-motion'
import { usePetStore } from './store'
import {
  pickIdleBehavior,
  worldEnterResponse,
  REACTION_PRIORITY,
} from './petState'
import { on, emit } from './events'
import useReducedMotion from './useReducedMotion'
import PetBody from './PetBody'
import PetParticles from './PetParticles'
import './DeepPet.css'

const IDLE_MIN_MS = 17000
const IDLE_MAX_MS = 31000
const ENTRANCE_DELAY = 0.45
// lands just after the entrance settles, so the greeting is not swallowed by it
const FIRST_GREET_MS = 1500

export default function DeepPet({ route, navigate }) {
  const reduced = useReducedMotion()

  const state = usePetStore((s) => s.state)
  const line = usePetStore((s) => s.line)
  const lineToken = usePetStore((s) => s.override)
  const setWorldFromRoute = usePetStore((s) => s.setWorldFromRoute)
  const react = usePetStore((s) => s.react)
  const releaseOverride = usePetStore((s) => s.releaseOverride)
  const setHovering = usePetStore((s) => s.setHovering)

  // lean toward the cursor without re-rendering: motion values bypass React
  const leanX = useMotionValue(0)
  const leanY = useMotionValue(0)
  const springX = useSpring(leanX, { stiffness: 140, damping: 18, mass: 0.6 })
  const springY = useSpring(leanY, { stiffness: 140, damping: 18, mass: 0.6 })

  const idleTimer = useRef(null)

  // Subscribe BEFORE the world effect below: a cold load that lands straight in
  // a non-default world changes the store and emits 'world-enter' on commit, so
  // the listeners must already be in place or that first acknowledgement is
  // dropped and the pet starts the visit on the wrong face.
  useEffect(() => {
    const unsubs = [
      on('greet', () => react('greet')),
      on('world-enter', (payload) =>
        react(worldEnterResponse(payload?.world), {
          priority: REACTION_PRIORITY['world-enter'],
        })
      ),
      on('success', () => react('success')),
      on('error', () => react('error')),
      on('discovery', () => react('discovery')),
      on('achievement', () => react('achievement')),
      on('poke', () => react('poke')),
      on('idle', (payload) =>
        react(payload?.behavior || pickIdleBehavior(), {
          priority: REACTION_PRIORITY.idle,
        })
      ),
    ]
    return () => unsubs.forEach((unsubscribe) => unsubscribe())
  }, [react])

  // world awareness
  useEffect(() => {
    setWorldFromRoute(route)
  }, [route, setWorldFromRoute])

  // rare autonomous micro-behaviours while the user is away
  const scheduleIdle = useCallback(() => {
    if (idleTimer.current) clearTimeout(idleTimer.current)
    const delay = IDLE_MIN_MS + Math.random() * (IDLE_MAX_MS - IDLE_MIN_MS)
    idleTimer.current = setTimeout(() => {
      if (!usePetStore.getState().hovering) {
        emit('idle', { behavior: pickIdleBehavior() })
      }
      scheduleIdle()
    }, delay)
  }, [])

  useEffect(() => {
    scheduleIdle()
    return () => {
      if (idleTimer.current) clearTimeout(idleTimer.current)
    }
  }, [scheduleIdle])

  // First appearance only. The ref is flipped inside the timer, not before it,
  // so a StrictMode mount -> cleanup -> mount cycle still ends up with exactly
  // one greeting instead of cancelling the timer and then refusing to re-arm.
  const greetedRef = useRef(false)
  useEffect(() => {
    if (greetedRef.current) return undefined
    const timer = setTimeout(() => {
      greetedRef.current = true
      emit('greet', { source: 'first-appearance' })
    }, FIRST_GREET_MS)
    return () => clearTimeout(timer)
  }, [])

  const handleEnter = () => {
    setHovering(true)
    scheduleIdle()
  }

  const handleLeave = () => {
    setHovering(false)
    leanX.set(0)
    leanY.set(0)
  }

  const handleMove = (e) => {
    if (reduced) return
    const rect = e.currentTarget.getBoundingClientRect()
    const dx = (e.clientX - (rect.left + rect.width / 2)) / (rect.width / 2)
    const dy = (e.clientY - (rect.top + rect.height / 2)) / (rect.height / 2)
    leanX.set(Math.max(-1, Math.min(1, dx)) * 7)
    leanY.set(Math.max(-1, Math.min(1, dy)) * 5)
  }

  const handleClick = () => {
    // Primary action is navigation to the companion's own world. Poke is kept as
    // a separate, secondary control (see the .deeppet-poke button below) so
    // clicking the pet never feels broken — it always does the more useful thing.
    if (navigate) navigate('/deepverse/deeppet')
    else emit('poke', { source: 'pointer' })
  }

  const handlePoke = () => {
    emit('poke', { source: 'pointer' })
    scheduleIdle()
  }

  const handleFocus = () => {
    emit('greet', { source: 'focus' })
    scheduleIdle()
  }

  const handleBlur = () => {
    // only tear down a focus greeting; a live reaction keeps playing
    releaseOverride('greet')
  }

  return (
    <motion.div
      className="deeppet"
      data-state={state}
      data-reduced={reduced ? 'true' : 'false'}
      initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.8, y: 14 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={
        reduced
          ? { duration: 0.5, delay: 0.2 }
          : { duration: 0.9, delay: ENTRANCE_DELAY, ease: [0.16, 1, 0.3, 1] }
      }
    >
      <div className="deeppet-stage">
        <motion.div
          style={{ x: springX, y: springY, width: '100%', height: '100%' }}
        >
          <PetParticles reduced={reduced} />
          <PetBody state={state} />
        </motion.div>

        <button
          type="button"
          className="deeppet-hit"
          aria-label="Open DeepPet world"
          onPointerEnter={handleEnter}
          onPointerLeave={handleLeave}
          onPointerMove={handleMove}
          onClick={handleClick}
          onFocus={handleFocus}
          onBlur={handleBlur}
        />

        <button
          type="button"
          className="deeppet-poke"
          aria-label="Poke DeepPet"
          tabIndex={0}
          onPointerEnter={handleEnter}
          onClick={handlePoke}
        >
          <span aria-hidden="true">✦</span>
        </button>

        <span className="deeppet-focusring" aria-hidden="true" />
        <span className="deeppet-hint" aria-hidden="true">
          Open DeepPet
        </span>

        <div aria-live="polite">
          {line && (
            <div className="deeppet-line" key={lineToken}>
              {line}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}