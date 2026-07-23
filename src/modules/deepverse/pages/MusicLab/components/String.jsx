import { motion } from 'framer-motion'
import { useMemo } from 'react'

export default function String({
  index,
  isVibrating,
  onPlay,
  isHovered,
  hoverX,
  pluckX,
  vibrateIntensity = 1.0,
}) {
  // New coordinates aligned with premium guitar body
  // Strings span from nut (420) to bridge (600)
  const stringX1 = 420
  const stringX2 = 600
  const stringY = 295 + index * 38 // Matches tuning peg spacing

  // String thickness - bronze wound vs steel plain
  const isWoundString = index < 3 // E, A, D are wound
  const thickness = isWoundString ? 1.8 + index * 0.2 : 1.2 + (index - 3) * 0.15

  // String color - bronze vs steel
  const stringColor = isWoundString
    ? `rgba(155, 138, 111, ${0.95 - index * 0.05})` // Bronze patina
    : `rgba(192, 189, 184, ${0.9 - (index - 3) * 0.05})` // Steel satin

  // Expanded hit area (invisible)
  const hitAreaHeight = 32

  // Vibration animation based on intensity
  const vibrationKeyframes = useMemo(() => {
    const amplitude = vibrateIntensity * 2.5
    return [0, -amplitude, amplitude, -amplitude * 0.75, amplitude * 0.75, -amplitude * 0.5, amplitude * 0.5, 0]
  }, [vibrateIntensity])

  return (
    <g>
      <defs>
        {/* Gradient for hover glow - centered at cursor position */}
        {isHovered && hoverX && (
          <radialGradient
            id={`hover-gradient-${index}`}
            cx={`${((hoverX - stringX1) / (stringX2 - stringX1)) * 100}%`}
            cy="50%"
            r="30%"
            gradientUnits="objectBoundingBox"
          >
            <stop offset="0%" stopColor="rgba(251, 191, 36, 0.4)" />
            <stop offset="50%" stopColor="rgba(251, 191, 36, 0.15)" />
            <stop offset="100%" stopColor="rgba(251, 191, 36, 0)" />
          </radialGradient>
        )}

        {/* Gradient for active pluck glow - centered at pluck position */}
        {isVibrating && pluckX && (
          <radialGradient
            id={`pluck-gradient-${index}`}
            cx={`${((pluckX - stringX1) / (stringX2 - stringX1)) * 100}%`}
            cy="50%"
            r="25%"
            gradientUnits="objectBoundingBox"
          >
            <stop offset="0%" stopColor="rgba(251, 191, 36, 0.7)" />
            <stop offset="50%" stopColor="rgba(251, 191, 36, 0.25)" />
            <stop offset="100%" stopColor="rgba(251, 191, 36, 0)" />
          </radialGradient>
        )}
      </defs>

      {/* Invisible hit area for easier targeting */}
      <rect
        x={stringX1}
        y={stringY - hitAreaHeight / 2}
        width={stringX2 - stringX1}
        height={hitAreaHeight}
        fill="transparent"
        style={{ cursor: 'pointer' }}
        onMouseDown={(e) => {
          e.preventDefault()
          onPlay(index)
        }}
        onTouchStart={(e) => {
          e.preventDefault()
          onPlay(index)
        }}
      />

      {/* Hover glow effect - localized to cursor */}
      {isHovered && hoverX && (
        <motion.line
          x1={stringX1}
          y1={stringY}
          x2={stringX2}
          y2={stringY}
          stroke={`url(#hover-gradient-${index})`}
          strokeWidth={thickness + 5}
          strokeLinecap="round"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.1 }}
          style={{
            filter: 'blur(1.5px)',
            pointerEvents: 'none',
          }}
        />
      )}

      {/* Visible string */}
      <motion.line
        x1={stringX1}
        y1={stringY}
        x2={stringX2}
        y2={stringY}
        stroke={stringColor}
        strokeWidth={thickness}
        strokeLinecap="round"
        animate={
          isVibrating
            ? {
                y: vibrationKeyframes,
                opacity: [1, 0.9, 0.9, 0.95, 0.95, 0.97, 0.97, 1],
              }
            : { y: 0, opacity: 1 }
        }
        transition={{
          duration: 0.5 + (5 - index) * 0.05,
          ease: 'easeOut',
        }}
        style={{
          filter: isVibrating ? 'blur(0.4px)' : 'none',
          pointerEvents: 'none',
        }}
      />

      {/* Active glow when playing - localized to pluck position */}
      {isVibrating && pluckX && (
        <motion.line
          x1={stringX1}
          y1={stringY}
          x2={stringX2}
          y2={stringY}
          stroke={`url(#pluck-gradient-${index})`}
          strokeWidth={thickness + 3}
          strokeLinecap="round"
          initial={{ opacity: 1 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 0.35 }}
          style={{
            filter: 'blur(1.2px)',
            pointerEvents: 'none',
          }}
        />
      )}
    </g>
  )
}
