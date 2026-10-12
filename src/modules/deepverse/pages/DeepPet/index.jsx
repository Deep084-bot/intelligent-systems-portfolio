import { useEffect, useMemo, useRef } from 'react'
import { motion, useMotionValue, useSpring } from 'framer-motion'
import {
  PET_STATE_LIST,
  PET_STATES,
  EXPLICIT_PRIORITY,
} from '../../components/DeepPet/petState'
import { usePetStore } from '../../components/DeepPet/store'
import { greetingLine } from '../../components/DeepPet/petPersona'
import useReducedMotion from '../../components/DeepPet/useReducedMotion'
import PetBody from '../../components/DeepPet/PetBody'
import PetParticles from '../../components/DeepPet/PetParticles'
import PetDialogue from '../../components/DeepPet/PetDialogue'
import PetConversation from '../../components/DeepPet/PetConversation'
import MusicControls from '../../audio/MusicControls'
import '../../components/DeepPet/DeepPet.css'

// What each expression means, shown next to the controls so the test area is
// also a quiet explainer of the companion's emotional vocabulary.
const EXPRESSIONS = [
  { state: PET_STATES.IDLE, label: 'Idle', hint: 'Resting, keeping you company.' },
  { state: PET_STATES.CURIOUS, label: 'Curious', hint: 'Something caught its eye.' },
  { state: PET_STATES.HAPPY, label: 'Happy', hint: 'Content and pleased.' },
  { state: PET_STATES.EXCITED, label: 'Excited', hint: 'Buzzing with energy.' },
  { state: PET_STATES.CONFUSED, label: 'Confused', hint: 'Trying to work it out.' },
  { state: PET_STATES.SLEEPY, label: 'Sleepy', hint: 'Drifting off.' },
]

// The events other worlds can fire at the pet. Surfaced here so the reactions
// can be tried by hand without needing the rest of DeepVerse.
const REACTIONS = [
  { event: 'greet', label: 'Greet' },
  { event: 'poke', label: 'Poke' },
  { event: 'success', label: 'Success' },
  { event: 'error', label: 'Error' },
  { event: 'discovery', label: 'Discovery' },
  { event: 'achievement', label: 'Achievement' },
]

const OTHER_WORLDS = [
  { label: 'Cosmos', path: '/deepverse/cosmos' },
  { label: 'Vision Arena', path: '/deepverse/vision-arena' },
  { label: 'Music Lab', path: '/deepverse/music-lab' },
  { label: 'Inside My Mind', path: '/deepverse/inside-my-mind' },
  { label: 'Reading Room', path: '/deepverse/reading-room' },
  { label: 'System Design', path: '/deepverse/system-design' },
]

export default function DeepPetWorld({ navigate }) {
  const reduced = useReducedMotion()

  const state = usePetStore((s) => s.state)
  const line = usePetStore((s) => s.line)
  const lineToken = usePetStore((s) => s.override)
  const setState = usePetStore((s) => s.setState)
  const react = usePetStore((s) => s.react)
  const setWorld = usePetStore((s) => s.setWorld)

  // The floating companion is hidden inside this world, so nothing else sets the
  // ambient mood here. Establish it, then greet once on arrival.
  useEffect(() => {
    setWorld('deeppet')
  }, [setWorld])

  useEffect(() => {
    const t = setTimeout(() => {
      react('greet', { force: true, hold: 6000, line: greetingLine() })
    }, 900)
    return () => clearTimeout(t)
  }, [react])

  const active = useMemo(
    () => EXPRESSIONS.find((e) => e.state === state) || EXPRESSIONS[1],
    [state]
  )

  // Lean toward the pointer without re-rendering React.
  const leanX = useMotionValue(0)
  const leanY = useMotionValue(0)
  const springX = useSpring(leanX, { stiffness: 120, damping: 18, mass: 0.7 })
  const springY = useSpring(leanY, { stiffness: 120, damping: 18, mass: 0.7 })
  const stageRef = useRef(null)

  const handleMove = (e) => {
    if (reduced) return
    const rect = e.currentTarget.getBoundingClientRect()
    const dx = (e.clientX - (rect.left + rect.width / 2)) / (rect.width / 2)
    const dy = (e.clientY - (rect.top + rect.height / 2)) / (rect.height / 2)
    leanX.set(Math.max(-1, Math.min(1, dx)) * 9)
    leanY.set(Math.max(-1, Math.min(1, dy)) * 6)
  }

  const resetLean = () => {
    leanX.set(0)
    leanY.set(0)
  }

  // Explicit, forced reactions so the test area always shows the face you asked
  // for, even right after an explicit expression override.
  const fireReaction = (event) => {
    react(event, { force: true, priority: EXPLICIT_PRIORITY })
  }

  return (
    <div className="relative min-h-screen bg-neutral-950 text-neutral-100 overflow-hidden">
      {/* ambient environment — same dark DeepVerse palette, gently lit */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 60% 50% at 30% 20%, rgba(95,224,138,0.10) 0%, transparent 60%), radial-gradient(ellipse 50% 50% at 80% 80%, rgba(93,110,255,0.10) 0%, transparent 65%)',
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)',
          backgroundSize: '44px 44px',
          maskImage: 'radial-gradient(ellipse at center, black 30%, transparent 75%)',
          WebkitMaskImage: 'radial-gradient(ellipse at center, black 30%, transparent 75%)',
        }}
      />

      <div className="relative z-10 mx-auto flex min-h-screen max-w-6xl flex-col px-6 py-8">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/deepverse')}
              className="inline-flex items-center gap-1.5 rounded px-2 py-1 -ml-2 text-sm text-neutral-500 transition-colors hover:text-neutral-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/50"
            >
              <span aria-hidden="true">←</span>
              <span>DeepVerse</span>
            </button>
            <span className="text-neutral-700" aria-hidden="true">/</span>
            <h1 className="text-sm font-semibold text-neutral-200">DeepPet</h1>
          </div>

          <nav aria-label="Worlds" className="flex flex-wrap items-center gap-1.5">
            {OTHER_WORLDS.map((w) => (
              <button
                key={w.path}
                onClick={() => navigate(w.path)}
                className="rounded-full border border-neutral-800 bg-neutral-900/60 px-3 py-1 text-xs text-neutral-400 transition-colors hover:border-green-400/40 hover:text-neutral-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/50"
              >
                {w.label}
              </button>
            ))}
          </nav>
        </header>

        <main className="mt-8 grid flex-1 gap-8 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-center">
          {/* ---- centrepiece ---- */}
          <section aria-label="DeepPet" className="flex flex-col items-center">
            <motion.div
              ref={stageRef}
              initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.9, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: reduced ? 0.4 : 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="relative flex w-full items-center justify-center py-6"
              onPointerMove={handleMove}
              onPointerLeave={resetLean}
              onClick={() => fireReaction('poke')}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  fireReaction('poke')
                }
              }}
              aria-label="Poke DeepPet"
            >
              {/* holo platform */}
              <div
                aria-hidden="true"
                className="deeppet--embedded deeppet"
                data-state={state}
                data-reduced={reduced ? 'true' : 'false'}
                style={{ width: 'clamp(260px, 46vw, 440px)', height: 'clamp(260px, 46vw, 440px)' }}
              >
                <div className="deeppet-stage">
                  <motion.div style={{ x: springX, y: springY, width: '100%', height: '100%' }}>
                    <PetParticles reduced={reduced} />
                    <PetBody state={state} />
                  </motion.div>

                  <PetDialogue text={line} token={lineToken} reduced={reduced} variant="embedded" />
                </div>
              </div>

              {/* platform shadow */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute bottom-4 h-6 w-3/5 rounded-full"
                style={{
                  background:
                    'radial-gradient(ellipse at center, rgba(95,224,138,0.22) 0%, transparent 70%)',
                }}
              />
            </motion.div>

            <div className="mt-2 text-center">
              <p className="text-xs font-mono uppercase tracking-[0.2em] text-green-300/70">
                {active.label}
              </p>
              <p className="mt-1 text-sm text-neutral-400">{active.hint}</p>
            </div>
          </section>

          {/* ---- side panel ---- */}
          <section className="flex flex-col gap-6">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight text-neutral-50">
                Meet DeepPet
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-neutral-400">
                Your AI companion: a small, curious robot that lives in every
                DeepVerse world. It watches what you explore, learns the mood of
                each place, and reacts to what happens. For now it is a companion
                and a personality — a mind will come later.
              </p>
            </div>

            {/* expressions */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-xs font-mono uppercase tracking-wider text-neutral-500">
                  Expressions
                </h3>
                <button
                  onClick={() => setState(PET_STATES.CURIOUS)}
                  className="text-[11px] text-neutral-500 transition-colors hover:text-neutral-300"
                >
                  Reset
                </button>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {EXPRESSIONS.map((e) => {
                  const isActive = e.state === state
                  return (
                    <button
                      key={e.state}
                      onClick={() => setState(e.state)}
                      aria-pressed={isActive}
                      className={
                        'rounded-lg border px-3 py-2 text-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/50 ' +
                        (isActive
                          ? 'border-green-400/50 bg-green-400/10 text-green-200'
                          : 'border-neutral-800 bg-neutral-900/60 text-neutral-300 hover:border-neutral-700 hover:bg-neutral-800/60')
                      }
                    >
                      {e.label}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* reactions */}
            <div>
              <h3 className="mb-2 text-xs font-mono uppercase tracking-wider text-neutral-500">
                Reactions
              </h3>
              <div className="grid grid-cols-3 gap-2">
                {REACTIONS.map((r) => (
                  <button
                    key={r.event}
                    onClick={() => fireReaction(r.event)}
                    className="rounded-lg border border-neutral-800 bg-neutral-900/60 px-3 py-2 text-sm text-neutral-300 transition-colors hover:border-primary-500/40 hover:bg-neutral-800/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/50"
                  >
                    {r.label}
                  </button>
                ))}
              </div>
              <p className="mt-2 text-[11px] leading-relaxed text-neutral-600">
                These are the same events the other worlds fire at the pet.
              </p>
            </div>

            {/* conversation */}
            <PetConversation navigate={navigate} reduced={reduced} />

            {/* music — the same shared engine the Music Lab uses */}
            <MusicControls variant="compact" />
          </section>
        </main>
      </div>
    </div>
  )
}
