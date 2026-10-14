/**
 * StringLayer - Single guitar string with rAF wave physics.
 * No React state during animation; all mutation via imperative DOM refs.
 */

import { useRef, useEffect } from 'react'

const STRING_PROPS = [
  { color: '#CD9A5C', glowColor: 'rgba(205,154,92,0.55)', thickness: 3.2 }, // E2 bronze
  { color: '#C8955A', glowColor: 'rgba(200,149,90,0.50)', thickness: 2.8 }, // A2 bronze
  { color: '#C49058', glowColor: 'rgba(196,144,88,0.45)', thickness: 2.4 }, // D3 bronze
  { color: '#C8C4BE', glowColor: 'rgba(200,196,190,0.40)', thickness: 1.8 }, // G3 steel
  { color: '#CECBC6', glowColor: 'rgba(206,203,198,0.35)', thickness: 1.4 }, // B3 steel
  { color: '#D4D2CE', glowColor: 'rgba(212,210,206,0.30)', thickness: 1.0 }, // E4 steel
]

const IDLE_AMP = 0.15   // px max idle breathing
const IDLE_HZ  = 0.5    // idle breathing frequency

function buildWavePath(x1, x2, baseY, amplitude, t, pluckX) {
  const N = 80
  const parts = []
  for (let i = 0; i <= N; i++) {
    const x = x1 + (i / N) * (x2 - x1)
    const envelope = Math.sin(Math.PI * (x - x1) / (x2 - x1))
    const bias = pluckX != null
      ? Math.exp(-0.000005 * Math.pow(x - pluckX, 2)) * 1.4 + 0.3
      : 1
    const wave = amplitude * envelope * bias * Math.sin(2 * Math.PI * 3 * t - i * 0.15)
    parts.push(`${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${(baseY + wave).toFixed(2)}`)
  }
  return parts.join(' ')
}

function buildStaticPath(x1, x2, y) {
  return `M ${x1} ${y} L ${x2} ${y}`
}

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
  const { color, glowColor, thickness } = STRING_PROPS[index] ?? STRING_PROPS[5]

  const pathRef    = useRef(null)
  const glowRef    = useRef(null)
  const idleRef    = useRef(null)
  const stateRef   = useRef({ running: false, startTime: 0, baseIntensity: 0, pluckX: null })
  const rafRef     = useRef(null)
  const idleRafRef = useRef(null)
  const idlePhase  = index * 1.1

  const prefersReducedMotion = typeof window !== 'undefined'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches

  // ── Wave animation loop ──────────────────────────────────────────────────
  const animate = (now) => {
    const state = stateRef.current
    const elapsed = (now - state.startTime) / 1000
    const decayRate = 2.5 - (5 - index) * 0.1
    const A = state.baseIntensity * 10 * Math.exp(-decayRate * elapsed)

    if (A < 0.05) {
      state.running = false
      // Reset to flat line
      const flat = buildStaticPath(x1, x2, y)
      pathRef.current?.setAttribute('d', flat)
      glowRef.current?.setAttribute('d', flat)
      return
    }

    const d = buildWavePath(x1, x2, y, A, elapsed, state.pluckX)
    pathRef.current?.setAttribute('d', d)
    glowRef.current?.setAttribute('d', d)
    rafRef.current = requestAnimationFrame(animate)
  }

  // Trigger wave when vibration props change
  useEffect(() => {
    if (prefersReducedMotion) {
      // Static flash: briefly brighten the glow path then fade
      const el = glowRef.current
      if (el && isVibrating) {
        el.style.opacity = '1'
        setTimeout(() => { if (el) el.style.opacity = '0.18' }, 120)
      }
      return
    }

    if (isVibrating && vibrateIntensity > 0) {
      const state = stateRef.current
      state.baseIntensity = vibrateIntensity
      state.pluckX = pluckX
      state.startTime = performance.now()

      if (!state.running) {
        state.running = true
        cancelAnimationFrame(rafRef.current)
        rafRef.current = requestAnimationFrame(animate)
      }
    }
  }, [isVibrating, vibrateIntensity, pluckX]) // eslint-disable-line

  // ── Idle breathing loop (low priority, ~24fps) ───────────────────────────
  useEffect(() => {
    if (prefersReducedMotion) return

    let lastTick = 0
    const breathe = (now) => {
      idleRafRef.current = requestAnimationFrame(breathe)
      // ~24fps throttle
      if (now - lastTick < 42) return
      lastTick = now

      // Skip idle when actively vibrating — wave anim owns the path
      if (stateRef.current.running) return

      const t = now / 1000
      const A = IDLE_AMP * Math.sin(2 * Math.PI * IDLE_HZ * t + idlePhase)
      const d = buildWavePath(x1, x2, y, A, t, null)
      idleRef.current?.setAttribute('d', d)
    }

    idleRafRef.current = requestAnimationFrame(breathe)
    return () => cancelAnimationFrame(idleRafRef.current)
  }, [x1, x2, y]) // eslint-disable-line

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cancelAnimationFrame(rafRef.current)
      cancelAnimationFrame(idleRafRef.current)
    }
  }, [])

  const hoverPct = isHovered && hoverX != null
    ? `${(((hoverX - x1) / (x2 - x1)) * 100).toFixed(1)}%`
    : '50%'

  const gradId = `sg-hover-${index}`

  return (
    <g>
      <defs>
        {isHovered && hoverX != null && (
          <radialGradient id={gradId} cx={hoverPct} cy="50%" r="12%" gradientUnits="objectBoundingBox">
            <stop offset="0%"   stopColor="rgba(251,191,36,0.55)" />
            <stop offset="60%"  stopColor="rgba(251,191,36,0.18)" />
            <stop offset="100%" stopColor="rgba(251,191,36,0)"    />
          </radialGradient>
        )}
      </defs>

      {/* Idle breathing path — subtle, always present */}
      <path
        ref={idleRef}
        d={buildStaticPath(x1, x2, y)}
        stroke={glowColor}
        strokeWidth={thickness + 3}
        strokeLinecap="round"
        fill="none"
        style={{ filter: 'blur(2px)', pointerEvents: 'none', opacity: 0.5 }}
      />

      {/* Glow path — driven by wave animation (same d as pathRef) */}
      <path
        ref={glowRef}
        d={buildStaticPath(x1, x2, y)}
        stroke={glowColor}
        strokeWidth={thickness + 6}
        strokeLinecap="round"
        fill="none"
        style={{
          filter: 'blur(4px)',
          pointerEvents: 'none',
          opacity: isVibrating ? 0.7 : 0.18,
          transition: 'opacity 0.15s ease',
        }}
      />

      {/* Hover glow overlay */}
      {isHovered && hoverX != null && (
        <line
          x1={x1} y1={y} x2={x2} y2={y}
          stroke={`url(#${gradId})`}
          strokeWidth={thickness + 10}
          strokeLinecap="round"
          style={{ filter: 'blur(3px)', pointerEvents: 'none' }}
        />
      )}

      {/* Main string — wave path, driven by rAF */}
      <path
        ref={pathRef}
        d={buildStaticPath(x1, x2, y)}
        stroke={color}
        strokeWidth={thickness}
        strokeLinecap="round"
        fill="none"
        style={{
          pointerEvents: 'none',
          filter: isVibrating ? 'blur(0.3px)' : 'none',
          transition: 'filter 0.1s',
        }}
      />

      {/* String highlight — thin lighter line along the top */}
      <path
        d={buildStaticPath(x1, x2, y - thickness * 0.3)}
        stroke="rgba(255,245,225,0.18)"
        strokeWidth={thickness * 0.35}
        strokeLinecap="round"
        fill="none"
        style={{ pointerEvents: 'none' }}
      />
    </g>
  )
}
