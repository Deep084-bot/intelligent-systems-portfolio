import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import StarField from '../components/portal/StarField'

export default function Portal({ onEnter }) {
  const [exiting, setExiting] = useState(false)

  const handleEnter = () => {
    setExiting(true)
    setTimeout(() => onEnter(), 900)
  }

  return (
    <AnimatePresence>
      <motion.div
        key="portal"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.6 }}
        className="fixed inset-0 bg-neutral-950 overflow-hidden"
      >
        <StarField />

        <div className="absolute inset-0 bg-gradient-to-b from-neutral-950/40 via-transparent to-neutral-950/90 pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_0%,_rgb(10_10_10_/_0.6)_100%)] pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={
              exiting
                ? { opacity: 0, y: -24, scale: 0.98 }
                : { opacity: 1, y: 0, scale: 1 }
            }
            transition={{ duration: 0.8, ease: 'easeInOut' }}
            className="max-w-xl"
          >
            <p className="text-neutral-300 text-base sm:text-lg md:text-xl leading-relaxed">
              Curiosity has always driven me.
            </p>

            <p className="text-neutral-300 text-base sm:text-lg md:text-xl leading-relaxed mt-5">
              Whether it&rsquo;s understanding distributed systems, wondering how galaxies formed, or trying to recreate a guitar with nothing more than a webcam&hellip;
            </p>

            <p className="text-neutral-100 text-base sm:text-lg md:text-xl leading-relaxed mt-6 font-medium">
              DeepVerse is where those curiosities live.
            </p>

            <motion.div
              initial={{ opacity: 0 }}
              animate={exiting ? { opacity: 0 } : { opacity: 1 }}
              transition={{ delay: 1.2, duration: 0.6 }}
              className="mt-12"
            >
              <button
                onClick={handleEnter}
                className={`
                  relative inline-flex items-center gap-2
                  px-8 py-3.5 rounded-lg text-sm font-medium
                  border border-primary-500/40 text-primary-300
                  hover:bg-primary-500/10 hover:border-primary-500/60
                  focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/50
                  transition-all duration-300
                  group
                `}
              >
                <span>Enter DeepVerse</span>
                <span className="transition-transform duration-300 group-hover:translate-x-1">
                  →
                </span>
              </button>
            </motion.div>
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
