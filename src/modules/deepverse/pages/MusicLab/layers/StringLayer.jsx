/**
 * StringLayer - Individual string component (presentation only)
 *
 * Renders a single string with its visual states.
 * No interaction logic - receives state from parent.
 */

import { motion } from 'framer-motion'
import { useMemo } from 'react'

export default function StringLayer({
  index,
  x1,
  x2,
  y,
  isVibrating,
  vibrateIntensity,
  isHovered,
  hoverX,
  pluckX,
}) {
  // String characteristics based on index
  const isWoundString = index < 3 // E, A, D are wound
  const thickness = isWoundString ? 2.5 + index * 0.15 : 2.0 + (index - 3) * 0.1

  // String color - bronze vs steel
  const stringColor = isWoundString
    ? `rgba(155, 138, 111, ${0.95 - index * 0.05})` // Bronze
    : `rgba(192, 189, 184, ${0.9 - (index - 3) * 0.05})` // Steel

  // Ambient glow at rest
  const ambientGlow = `rgba(251, 191, 36, ${0.05 + index * 0.01})`

  // Vibration animation
  const vibrationKeyframes = useMemo(() => {
    const amplitude = vibrateIntensity * 3
    return [0, -amplitude, amplitude, -amplitude * 0.75, amplitude * 0.75, -amplitude * 0.5, amplitude * 0.5, 0]
  }, [vibrateIntensity])

  return (
    <g>
      <defs>
        {/* Hover gradient - centered at cursor */}
        {isHovered && hoverX && (
          <radialGradient
            id={`hover-glow-${index}`}
            cx={`${((hoverX - x1) / (x2 - x1)) * 100}%`}
            cy="50%"
            r="15%"
            gradientUnits="objectBoundingBox"
          >
            <stop offset="0%" stopColor="rgba(251, 191, 36, 0.5)" />
            <stop offset="50%" stopColor="rgba(251, 191, 36, 0.2)" />
            <stop offset="100%" stopColor="rgba(251, 191, 36, 0)" />
          </radialGradient>
        )}

        {/* Pluck gradient - centered at pluck position */}
        {isVibrating && pluckX && (
          <radialGradient
            id={`pluck-glow-${index}`}
            cx={`${((pluckX - x1) / (x2 - x1)) * 100}%`}
            cy="50%"
            r="12%"
            gradientUnits="objectBoundingBox"
          >
            <stop offset="0%" stopColor="rgba(251, 191, 36, 0.8)" />
            <stop offset="50%" stopColor="rgba(251, 191, 36, 0.3)" />
            <stop offset="100%" stopColor="rgba(251, 191, 36, 0)" />
          </radialGradient>
        )}
      </defs>

      {/* Ambient glow layer (always visible) */}
      <line
        x1={x1}
        y1={y}
        x2={x2}
        y2={y}
        stroke={ambientGlow}
        strokeWidth={thickness + 6}
        strokeLinecap="round"
        style={{
          filter: 'blur(2px)',
          pointerEvents: 'none',
        }}
      />

      {/* Hover glow (proximity feedback) */}
      {isHovered && hoverX && (
        <motion.line
          x1={x1}
          y1={y}
          x2={x2}
          y2={y}
          stroke={`url(#hover-glow-${index})`}
          strokeWidth={thickness + 8}
          strokeLinecap="round"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.08 }}
          style={{
            filter: 'blur(3px)',
            pointerEvents: 'none',
          }}
        />
      )}

      {/* Main string */}
      <motion.line
        x1={x1}
        y1={y}
        x2={x2}
        y2={y}
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
          filter: isVibrating ? 'blur(0.5px)' : 'none',
          pointerEvents: 'none',
        }}
      />

      {/* Active pluck glow */}
      {isVibrating && pluckX && (
        <motion.line
          x1={x1}
          y1={y}
          x2={x2}
          y2={y}
          stroke={`url(#pluck-glow-${index})`}
          strokeWidth={thickness + 4}
          strokeLinecap="round"
          initial={{ opacity: 1 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          style={{
            filter: 'blur(2px)',
            pointerEvents: 'none',
          }}
        />
      )}
    </g>
  )
}
