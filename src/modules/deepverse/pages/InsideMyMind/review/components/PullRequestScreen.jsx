import { motion } from 'framer-motion'

function CommitGraph({ pr }) {
  return (
    <svg viewBox="0 0 260 92" className="w-full" style={{ maxWidth: 320 }}>
      <line x1={8} y1={70} x2={252} y2={70} stroke="rgba(255,255,255,0.12)" strokeWidth={1} />
      <line x1={8} y1={70} x2={60} y2={30} stroke="rgba(109,92,252,0.5)" strokeWidth={1} />
      <line x1={60} y1={30} x2={240} y2={30} stroke="rgba(109,92,252,0.5)" strokeWidth={1} />
      <line x1={240} y1={30} x2={252} y2={70} stroke="rgba(109,92,252,0.5)" strokeWidth={1} />
      {[[40, 70], [90, 70], [140, 70], [200, 70]].map(([x, y]) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r={3} fill="#3f3f46" />
      ))}
      {pr.commits.map((c, i) => (
        <g key={c}>
          <circle cx={60 + i * 60} cy={30} r={3.5} fill="#6d5cfc" />
          <text x={60 + i * 60} y={14} textAnchor="middle" fontSize={7} fill="#71717a" style={{ fontFamily: 'monospace' }}>
            {c.length > 16 ? c.slice(0, 15) + '…' : c}
          </text>
        </g>
      ))}
      <text x={252} y={84} textAnchor="end" fontSize={7.5} fill="#52525b" style={{ fontFamily: 'monospace' }}>
        {pr.base}
      </text>
      <text x={8} y={16} fontSize={7.5} fill="#6d5cfc" style={{ fontFamily: 'monospace' }}>
        {pr.branch}
      </text>
    </svg>
  )
}

export default function PullRequestScreen({ scenario, onNext }) {
  const { pr } = scenario

  return (
    <motion.div
      className="flex flex-col h-full items-center justify-center"
      initial="hidden"
      animate="show"
      variants={{ show: { transition: { staggerChildren: 0.08 } } }}
    >
      <motion.div
        variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }}
        className="w-[min(560px,100%)] rounded-2xl p-6"
        style={{ background: 'rgba(16,16,20,0.95)', border: '1px solid rgba(255,255,255,0.08)' }}
      >
        <div className="text-[9px] font-mono uppercase tracking-[0.25em] text-neutral-600 mb-2">Incoming pull request</div>
        <h3 className="text-[18px] font-medium text-neutral-100 mb-3">{pr.title}</h3>

        <div className="flex items-center gap-3 mb-4 text-[11px] font-mono">
          <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-semibold" style={{ background: 'rgba(109,92,252,0.3)', color: '#c4b5fd' }}>
            {pr.author[0].toUpperCase()}
          </div>
          <div>
            <div className="text-neutral-300">{pr.author}</div>
            <div className="text-neutral-600 text-[10px]">opened a PR into {pr.base}</div>
          </div>
        </div>

        <div className="rounded-xl px-3 py-2 mb-4" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
          <CommitGraph pr={pr} />
        </div>

        <div className="text-[11px] font-mono text-neutral-500 mb-5">{pr.stats}</div>

        <div className="flex items-center justify-between">
          <button
            onClick={onNext}
            className="px-4 py-2 rounded-lg text-[12px] font-medium text-neutral-200 transition-all hover:scale-[1.02] active:scale-[0.98]"
            style={{ background: 'rgba(109,92,252,0.9)' }}
          >
            Read the context →
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}
