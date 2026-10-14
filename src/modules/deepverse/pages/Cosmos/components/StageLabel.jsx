import { motion } from 'framer-motion'

export default function StageLabel({ text, progress, stageStart, stageEnd }) {
  const localProgress = (progress - stageStart) / (stageEnd - stageStart)
  const opacity = Math.min(1, Math.max(0,
    localProgress < 0.08 ? localProgress / 0.08 :
    1 - (localProgress - 0.7) / 0.3
  ))

  if (!text || opacity < 0.01) return null

  return (
    <motion.p
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="pointer-events-none select-none text-center px-6"
      style={{
        color: 'rgba(255, 255, 255, 0.92)',
        fontWeight: 200,
        fontSize: 'clamp(28px, 6vw, 56px)',
        letterSpacing: '0.02em',
        lineHeight: 1.2,
      }}
    >
      {text}
    </motion.p>
  )
}
