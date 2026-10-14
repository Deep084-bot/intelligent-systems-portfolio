import { AnimatePresence, motion } from 'framer-motion'

// DeepPet's voice, rendered as a speech bubble that belongs to the character
// rather than a detached toast. Animates in/out subtly; under reduced motion it
// only cross-fades. `role="status"` + aria-live announce new lines to AT.
export default function PetDialogue({ text, token, reduced = false, variant = 'floating' }) {
  return (
    <AnimatePresence>
      {text ? (
        <motion.div
          key={token || text}
          className={`deeppet-bubble deeppet-bubble--${variant}`}
          role="status"
          aria-live="polite"
          initial={reduced ? { opacity: 0 } : { opacity: 0, y: 8, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={reduced ? { opacity: 0 } : { opacity: 0, y: -6, scale: 0.98 }}
          transition={{ duration: reduced ? 0.2 : 0.26, ease: 'easeOut' }}
        >
          {text}
          <span className="deeppet-bubble-tail" aria-hidden="true" />
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
