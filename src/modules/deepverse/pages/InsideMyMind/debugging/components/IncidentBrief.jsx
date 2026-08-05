import { motion } from 'framer-motion'
import TopologyView from './TopologyView'

export default function IncidentBrief({ scenario, onBegin }) {
  const { incident } = scenario

  return (
    <motion.div
      className="flex flex-col h-full"
      initial="hidden"
      animate="show"
      variants={{ show: { transition: { staggerChildren: 0.08 } } }}
    >
      <div className="flex items-center gap-2 mb-1">
        <span
          className="text-[9px] font-mono px-2 py-0.5 rounded"
          style={{ background: 'rgba(248,113,113,0.1)', color: '#f87171', border: '1px solid rgba(248,113,113,0.2)' }}
        >
          {incident.severity}
        </span>
        <span className="text-[9px] font-mono uppercase tracking-[0.25em] text-neutral-600">Incident</span>
        <span className="text-[9px] font-mono text-neutral-700">· first observed {incident.startClock}</span>
      </div>
      <motion.h3 variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }} className="text-[19px] font-medium text-neutral-100 mb-3">
        {incident.title}
      </motion.h3>

      <motion.div
        variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}
        className="rounded-xl p-3.5 mb-4"
        style={{ background: 'rgba(248,113,113,0.05)', border: '1px solid rgba(248,113,113,0.15)' }}
      >
        <div className="text-[9px] font-mono uppercase tracking-[0.25em] mb-1.5" style={{ color: '#f87171' }}>
          Symptom
        </div>
        <p className="text-[13px] leading-relaxed text-neutral-300">{incident.symptom}</p>
      </motion.div>

      <motion.div variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }} className="mb-4">
        <div className="text-[9px] font-mono uppercase tracking-[0.25em] text-neutral-600 mb-2">Initial observations</div>
        <ul className="space-y-1.5">
          {incident.observations.map((o, i) => (
            <li key={i} className="flex gap-2.5 text-[12.5px] text-neutral-400 leading-relaxed">
              <span style={{ color: '#6d5cfc' }}>›</span>
              {o}
            </li>
          ))}
        </ul>
      </motion.div>

      <motion.div
        variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}
        className="rounded-xl p-3 mb-4"
        style={{ background: 'rgba(16,16,20,0.7)', border: '1px solid rgba(255,255,255,0.06)' }}
      >
        <div className="text-[9px] font-mono uppercase tracking-[0.25em] text-neutral-600 mb-1">System</div>
        <TopologyView system={scenario.system} />
      </motion.div>

      <motion.div variants={{ hidden: { opacity: 0 }, show: { opacity: 1 } }} className="mt-auto">
        <button
          onClick={onBegin}
          className="px-4 py-2 rounded-lg text-[12px] font-medium text-neutral-200 transition-all hover:scale-[1.02] active:scale-[0.98]"
          style={{ background: 'rgba(109,92,252,0.9)' }}
        >
          Begin investigation →
        </button>
      </motion.div>
    </motion.div>
  )
}
