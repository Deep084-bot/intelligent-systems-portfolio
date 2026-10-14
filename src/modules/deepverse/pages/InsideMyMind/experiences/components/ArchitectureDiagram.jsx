export default function ArchitectureDiagram({ architecture }) {
  return (
    <svg viewBox={architecture.viewBox} className="w-full" style={{ minHeight: 130 }}>
      {architecture.links.map(([fromId, toId], i) => {
        const a = architecture.nodes.find((n) => n.id === fromId)
        const b = architecture.nodes.find((n) => n.id === toId)
        if (!a || !b) return null
        return (
          <line
            key={i}
            x1={a.x + a.w / 2}
            y1={a.y + a.h / 2}
            x2={b.x + b.w / 2}
            y2={b.y + b.h / 2}
            stroke="rgba(255,255,255,0.1)"
            strokeWidth={1}
          />
        )
      })}
      {architecture.nodes.map((n) => (
        <g key={n.id}>
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
            fontSize={10}
            fill="#a1a1aa"
            style={{ pointerEvents: 'none', userSelect: 'none' }}
          >
            {n.label}
          </text>
        </g>
      ))}
    </svg>
  )
}
