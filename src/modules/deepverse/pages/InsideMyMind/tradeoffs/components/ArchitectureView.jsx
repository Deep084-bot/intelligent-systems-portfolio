import { motion } from 'framer-motion'

export default function ArchitectureView({ architecture }) {
  if (!architecture) return null
  const { viewBox, nodes, links } = architecture

  return (
    <svg viewBox={viewBox} className="w-full" style={{ minHeight: 140 }}>
      {links.map(([fromId, toId], i) => {
        const a = nodes.find((n) => n.id === fromId)
        const b = nodes.find((n) => n.id === toId)
        if (!a || !b) return null
        return (
          <motion.line
            key={`${fromId}-${toId}`}
            x1={a.x + a.w / 2}
            y1={a.y + a.h / 2}
            x2={b.x + b.w / 2}
            y2={b.y + b.h / 2}
            stroke="rgba(255,255,255,0.12)"
            strokeWidth={1}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.15 + i * 0.05 }}
          />
        )
      })}
      {nodes.map((n, i) => (
        <motion.g
          key={n.id}
          initial={{ opacity: 0, scale: 0.75 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.45, delay: 0.05 + i * 0.07, ease: 'easeOut' }}
          style={{ transformOrigin: `${n.x + n.w / 2}px ${n.y + n.h / 2}px` }}
        >
          <rect
            x={n.x}
            y={n.y}
            width={n.w}
            height={n.h}
            rx={8}
            fill="rgba(109,92,252,0.08)"
            stroke="rgba(109,92,252,0.35)"
            strokeWidth={1}
          />
          <text
            x={n.x + n.w / 2}
            y={n.y + n.h / 2}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={9.5}
            fill="#a1a1aa"
            style={{ pointerEvents: 'none', userSelect: 'none' }}
          >
            {n.label}
          </text>
        </motion.g>
      ))}
    </svg>
  )
}
