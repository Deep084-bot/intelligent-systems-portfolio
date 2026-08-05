import { motion } from 'framer-motion'
import { JUDGMENT_DIMENSIONS } from '../scoring'

const R = 80
const CX = 100
const CY = 100

function vertex(index, value) {
  const angle = (-90 + index * (360 / JUDGMENT_DIMENSIONS.length)) * (Math.PI / 180)
  const r = (value / 100) * R
  return [CX + r * Math.cos(angle), CY + r * Math.sin(angle)]
}

function polygonPath(values) {
  const pts = values.map((v, i) => vertex(i, v))
  return pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ')
}

function ringPath(frac) {
  const pts = JUDGMENT_DIMENSIONS.map((_, i) => vertex(i, 100 * frac))
  return `M ${pts.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join(' L ')} Z`
}

export default function JudgmentRadar({ values }) {
  const scores = JUDGMENT_DIMENSIONS.map((d) => values[d.id] ?? 0)
  const points = scores.map((v, i) => vertex(i, v))
  const centerLabel = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)

  return (
    <svg viewBox="0 0 200 200" className="w-full max-w-[240px] mx-auto">
      {[0.33, 0.66, 1].map((f) => (
        <path key={f} d={ringPath(f)} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={1} />
      ))}
      {JUDGMENT_DIMENSIONS.map((_, i) => {
        const [x, y] = vertex(i, 100)
        const [lx, ly] = vertex(i, 118)
        return (
          <g key={i}>
            <line x1={CX} y1={CY} x2={x} y2={y} stroke="rgba(255,255,255,0.08)" strokeWidth={1} />
            <text
              x={lx}
              y={ly}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize={6.5}
              fill="#71717a"
              style={{ pointerEvents: 'none', userSelect: 'none' }}
            >
              {JUDGMENT_DIMENSIONS[i].label}
            </text>
          </g>
        )
      })}

      <motion.path
        d={`M ${points.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join(' L ')} Z`}
        fill="rgba(109,92,252,0.12)"
        stroke="#6d5cfc"
        strokeWidth={1.5}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.3 }}
      />
      <motion.path
        d={`M ${points.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join(' L ')} Z`}
        fill="none"
        stroke="#a78bfa"
        strokeWidth={2}
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.1, delay: 0.15, ease: 'easeInOut' }}
      />
      {points.map(([x, y], i) => (
        <motion.circle
          key={i}
          cx={x}
          cy={y}
          r={2.5}
          fill="#d4af37"
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.35, delay: 0.5 + i * 0.08 }}
        />
      ))}

      <text x={CX} y={CY} textAnchor="middle" dominantBaseline="central" fontSize={18} fill="#e4e4e7" style={{ fontWeight: 600 }}>
        {centerLabel}
      </text>
    </svg>
  )
}
