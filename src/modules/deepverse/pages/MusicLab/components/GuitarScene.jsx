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
      {/* Mobile message — guitar is desktop-only */}
      <div className="sm:hidden flex items-center justify-center min-h-[200px] px-8 text-center">
        <p className="text-sm text-neutral-500 leading-relaxed">
          Music Lab is best experienced on desktop.
        </p>
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
