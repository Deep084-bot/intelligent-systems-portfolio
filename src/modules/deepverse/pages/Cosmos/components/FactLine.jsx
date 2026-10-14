import { motion } from 'framer-motion'

export default function FactLine({ text, visible }) {
  if (!visible || !text) return null

  return (
    <motion.p
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 3 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="pointer-events-none select-none text-center px-6"
      style={{
        color: 'rgba(255, 255, 255, 0.62)',
        fontWeight: 200,
        fontSize: 'clamp(14px, 2vw, 18px)',
        letterSpacing: '0.03em',
        lineHeight: 1.5,
      }}
    >
      {text}
    </motion.p>
  )
}
