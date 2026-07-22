import { useState } from 'react'
import { motion } from 'framer-motion'
import { cn } from '../../../../utils'

export default function ExperienceCard({ id, icon, title, description, onClick }) {
  const [clicked, setClicked] = useState(false)
  const isReady = id === 'vision-arena'

  const handleClick = () => {
    onClick(id)
    if (!isReady) {
      setClicked(true)
      setTimeout(() => setClicked(false), 2000)
    }
  }

  return (
    <motion.button
      onClick={handleClick}
      whileHover={{ y: -6, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        'relative group w-full text-left',
        'bg-neutral-800/60 border border-neutral-700/60 rounded-xl p-6 sm:p-8',
        isReady
          ? 'hover:border-accent-500/50 hover:bg-neutral-800/80'
          : 'hover:border-primary-500/40 hover:bg-neutral-800/80',
        'transition-colors duration-300',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/60',
      )}
    >
      <div className="text-3xl sm:text-4xl mb-4">{icon}</div>

      <h3 className="text-lg sm:text-xl font-semibold text-neutral-100 mb-2">
        {title}
      </h3>

      <p className="text-sm sm:text-base text-neutral-400 leading-relaxed">
        {description}
      </p>

      <div
        className={cn(
          'mt-4 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono uppercase tracking-wider border',
          isReady
            ? 'bg-accent-500/10 text-accent-400 border-accent-500/30'
            : 'bg-neutral-700/60 text-neutral-500 border-neutral-600/40',
        )}
      >
        {isReady ? 'Play Now' : 'Coming Soon'}
      </div>

      {!isReady && clicked && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="absolute inset-0 flex items-center justify-center bg-neutral-900/90 backdrop-blur-sm rounded-xl"
        >
          <span className="text-sm text-neutral-300 font-mono">
            Coming in the next milestone.
          </span>
        </motion.div>
      )}
    </motion.button>
  )
}
