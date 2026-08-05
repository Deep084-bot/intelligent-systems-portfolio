import { motion } from 'framer-motion'
import MiniChart from './MiniChart'

const CATEGORY_COLORS = {
  Logs: '#a78bfa',
  Metrics: '#6d5cfc',
  Traces: '#d4af37',
  Architecture: '#34d399',
  Database: '#38bdf8',
  Timeline: '#f59e0b',
}

export default function EvidenceCard({ evidence, fresh }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="rounded-xl p-3"
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: fresh ? '1px solid rgba(212,175,55,0.5)' : '1px solid rgba(255,255,255,0.06)',
        boxShadow: fresh ? '0 0 16px rgba(212,175,55,0.12)' : 'none',
      }}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-[8px] font-mono uppercase tracking-wider" style={{ color: CATEGORY_COLORS[evidence.category] || '#a1a1aa' }}>
            {evidence.category}
          </span>
          <span className="text-[11px] font-medium text-neutral-200">{evidence.label}</span>
        </div>
        {fresh && (
          <motion.span
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-[8px] font-mono px-1.5 py-0.5 rounded"
            style={{ background: 'rgba(212,175,55,0.15)', color: '#d4af37' }}
          >
            NEW
          </motion.span>
        )}
      </div>

      {evidence.kind === 'chart' && (
        <div>
          <MiniChart series={evidence.series} unit={evidence.unit} />
          <p className="text-[10.5px] text-neutral-500 leading-relaxed mt-1">{evidence.summary}</p>
        </div>
      )}
      {evidence.kind === 'lines' && (
        <div className="rounded-lg px-2.5 py-2 font-mono text-[10px] leading-relaxed" style={{ background: 'rgba(0,0,0,0.35)' }}>
          {evidence.lines.map((line, i) => (
            <div key={i}>
              <span style={{ color: '#4ade80' }}>{line.split('|')[0].trim()} |</span>
              <span className="text-neutral-400"> {line.split('|').slice(1).join('|').trim()}</span>
            </div>
          ))}
        </div>
      )}
      {evidence.kind === 'text' && (
        <p className="text-[11.5px] text-neutral-400 leading-relaxed">{evidence.text}</p>
      )}
    </motion.div>
  )
}
