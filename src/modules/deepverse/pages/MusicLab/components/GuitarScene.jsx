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
    <motion.div
      className="relative w-full max-w-6xl mx-auto"
      style={{
        aspectRatio: '1200 / 800',
      }}
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{
        opacity: 1,
        scale: 1,
      }}
      transition={{
        opacity: { duration: 1.2, ease: 'easeOut' },
        scale: { duration: 1.2, ease: 'easeOut' },
      }}
    >
      {/* Layer 1: Background */}
      <div className="absolute inset-0" style={{ zIndex: 0 }}>
        <BackgroundLayer />
      </div>

      {/* Layer 2: Guitar Context (body, fretboard) */}
      <div
        className="absolute inset-0"
        style={{
          zIndex: 10,
          filter: 'drop-shadow(0 16px 32px rgba(0, 0, 0, 0.4))',
        }}
      >
        <GuitarContextLayer />
      </div>

      {/* Layer 3: Interactive Strings */}
      <div
        className="absolute inset-0"
        style={{
          zIndex: 20,
          filter: 'drop-shadow(0 12px 24px rgba(0, 0, 0, 0.5))',
        }}
      >
        <InteractionLayer orchestrator={orchestrator} />
      </div>

      {/* Layer 4: Effects (future - particles, hand visualization, etc.) */}
      <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 30 }}>
        {/* Reserved for future effects layer */}
      </div>
    </motion.div>
  )
}
