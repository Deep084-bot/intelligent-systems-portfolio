import { motion } from 'framer-motion'
import { cn } from '../../../../utils'

const BADGE = {
  deeppet: { text: 'Meet DeepPet', ready: true },
  'vision-arena': { text: 'Play Now', ready: true },
  'cosmos': { text: 'Begin Journey', ready: true },
  'music-lab': { text: 'Play Now', ready: true },
  'reading-room': { text: 'Explore', ready: true },
  'system-design': { text: 'Open Playground', ready: true },
  'inside-my-mind': { text: 'Enter Brain OS', ready: true },
}

export default function ExperienceCard({ id, icon, title, subtitle, description, onClick }) {
  const badge = BADGE[id] || { text: 'Coming Soon', ready: false }
  const isReady = badge.ready
  const isPet = id === 'deeppet'

  return (
    <motion.button
      onClick={() => onClick(id)}
      whileHover={{ y: -6, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        'relative group w-full text-left overflow-hidden',
        'bg-neutral-800/60 border border-neutral-700/60 rounded-xl p-6 sm:p-8',
        isPet
          ? 'hover:border-green-400/50 hover:bg-neutral-800/80'
          : isReady
            ? 'hover:border-accent-500/50 hover:bg-neutral-800/80'
            : 'hover:border-primary-500/40 hover:bg-neutral-800/80',
        'transition-colors duration-300',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/60',
      )}
    >
      {/* DeepPet gets a restrained green bloom so the companion reads as the
          guide card, without breaking the portal's flat dark surfaces. */}
      {isPet && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full opacity-60"
          style={{
            background:
              'radial-gradient(circle, rgba(95,224,138,0.16) 0%, rgba(95,224,138,0.05) 40%, transparent 70%)',
          }}
        />
      )}

      <div className="relative flex h-16 items-center text-3xl sm:text-4xl mb-4">
        {typeof icon === 'string' ? <span>{icon}</span> : icon}
      </div>

      <h3 className="relative text-lg sm:text-xl font-semibold text-neutral-100">
        {title}
        {subtitle && (
          <span className="ml-2 text-xs font-medium uppercase tracking-wider text-green-300/70">
            {subtitle}
          </span>
        )}
      </h3>

      <p className="relative mt-2 text-sm sm:text-base text-neutral-400 leading-relaxed">
        {description}
      </p>

      <div
        className={cn(
          'relative mt-4 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono uppercase tracking-wider border',
          isPet
            ? 'bg-green-400/10 text-green-300 border-green-400/30'
            : isReady
              ? 'bg-accent-500/10 text-accent-400 border-accent-500/30'
              : 'bg-neutral-700/60 text-neutral-500 border-neutral-600/40',
        )}
      >
        {badge.text}
      </div>
    </motion.button>
  )
}
