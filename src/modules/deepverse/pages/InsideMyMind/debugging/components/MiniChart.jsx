import { motion } from 'framer-motion'

export default function MiniChart({ series, unit }) {
  const W = 120
  const H = 32
  const min = Math.min(...series)
  const max = Math.max(...series)
  const range = max - min || 1
  const points = series.map((v, i) => {
    const x = (i / (series.length - 1)) * W
    const y = H - 4 - ((v - min) / range) * (H - 8)
    return [x, y]
  })
  const path = points.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ')
  const last = points[points.length - 1]

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 34 }}>
      <motion.path
        d={path}
        fill="none"
        stroke="#6d5cfc"
        strokeWidth={1.5}
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.9, ease: 'easeInOut' }}
      />
      <motion.circle
        cx={last[0]}
        cy={last[1]}
        r={2.2}
        fill="#a78bfa"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.9 }}
      />
      {unit && (
        <text x={W - 2} y={3} textAnchor="end" fontSize={6} fill="#52525b">
          {unit}
        </text>
      )}
    </svg>
  )
}
