/**
 * GuitarScene - Composes independent visual layers
 *
 * Layer architecture (bottom to top):
 * 1. Background - ambient glow and depth
 * 2. Guitar Context - body, fretboard, visual foundation
 * 3. Interaction - strings and collision detection
 * 4. Effects - future layer for particles, trails, etc.
 *
 * Each layer is independent and replaceable without affecting others.
 */

import { motion } from 'framer-motion'
import BackgroundLayer from '../layers/BackgroundLayer'
import GuitarContextLayer from '../layers/GuitarContextLayer'
import InteractionLayer from '../layers/InteractionLayer'

export default function GuitarScene({ orchestrator }) {
  return (
    <>
      {/* Mobile message — the full-width fretboard and drag gesture need a
          pointer-sized viewport, so we point people to a larger screen rather
          than shipping a cramped, broken guitar. */}
      <div className="sm:hidden flex items-center justify-center px-6 py-10">
        <div className="max-w-xs text-center rounded-2xl border border-neutral-800 bg-neutral-900/60 px-6 py-8">
          <svg
            className="mx-auto mb-4 opacity-60"
            width="40"
            height="40"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <rect x="2" y="4" width="20" height="13" rx="2" />
            <path d="M8 21h8M12 17v4" />
          </svg>
          <p className="text-sm font-medium text-neutral-300 mb-2">
            Best on a bigger screen
          </p>
          <p className="text-sm text-neutral-500 leading-relaxed">
            The guitar stretches wide and you play it by dragging across the
            strings — open this on a tablet or desktop to hear it.
          </p>
        </div>
      </div>

      <motion.div
        className="relative w-full max-w-[1400px] mx-auto hidden sm:block"
        style={{ aspectRatio: '1600 / 560' }}
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{
          opacity: { duration: 1.2, ease: 'easeOut' },
          scale:   { duration: 1.2, ease: 'easeOut' },
        }}
      >
        {/* Layer 1: Background */}
        <div className="absolute inset-0" style={{ zIndex: 0 }}>
          <BackgroundLayer />
        </div>

        {/* Layer 2: Guitar Context (body, fretboard) */}
        <div className="absolute inset-0" style={{ zIndex: 10 }}>
          <GuitarContextLayer />
        </div>

        {/* Layer 3: Interactive Strings */}
        <div className="absolute inset-0" style={{ zIndex: 20 }}>
          <InteractionLayer orchestrator={orchestrator} />
        </div>

        {/* Layer 4: Effects (reserved) */}
        <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 30 }} />
      </motion.div>
    </>
  )
}
