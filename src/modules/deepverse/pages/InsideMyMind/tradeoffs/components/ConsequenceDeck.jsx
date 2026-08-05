import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import ArchitectureView from './ArchitectureView'

function useCountUp(target, from, duration = 1100) {
  const [value, setValue] = useState(from)

  useEffect(() => {
    let start = null
    let raf
    const step = (t) => {
      if (start === null) start = t
      const p = Math.min(1, (t - start) / duration)
      const eased = 1 - Math.pow(1 - p, 3)
      setValue(from + (target - from) * eased)
      if (p < 1) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [target, from, duration])

  return value
}

function MetricCard({ metric, value, prev }) {
  const v = useCountUp(value, prev)
  const delta = value - prev
  const improved = delta === 0 ? null : (delta > 0 && !metric.lowerIsBetter) || (delta < 0 && metric.lowerIsBetter)
  return (
    <div
      className="px-2.5 py-2 rounded-lg"
      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}
    >
      <div className="flex items-center justify-between mb-1">
        <span className="text-[8px] font-mono uppercase tracking-wider text-neutral-600">{metric.label}</span>
        {improved !== null && (
          <span
            className="text-[9px] font-mono"
            style={{ color: improved ? '#a78bfa' : '#d4af37' }}
          >
            {delta > 0 ? '↑' : '↓'}
          </span>
        )}
      </div>
      <div className="text-[15px] font-mono text-neutral-200">
        {Math.round(v)}
        {metric.unit && <span className="text-[9px] text-neutral-500 ml-0.5">{metric.unit}</span>}
      </div>
    </div>
  )
}

export default function ConsequenceDeck({ scenario, choice, prevValues, currentValues, architecture, isFinal, onContinue }) {
  const deltas = Object.entries(choice.deltas || {})
  const improved = deltas.filter(
    ([k, d]) => (d < 0 && scenario.metrics[k].lowerIsBetter) || (d > 0 && !scenario.metrics[k].lowerIsBetter)
  )
  const worse = deltas.filter(([k]) => !improved.some(([ik]) => ik === k))

  return (
    <motion.div
      className="flex flex-col h-full"
      initial="hidden"
      animate="show"
      exit="hidden"
      variants={{ show: { transition: { staggerChildren: 0.08 } } }}
    >
      <div className="text-[9px] font-mono uppercase tracking-[0.25em] text-neutral-600 mb-1">Consequence</div>
      <motion.div
        variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}
        className="inline-flex self-start items-center gap-2 px-3 py-1.5 rounded-lg text-[12px] text-neutral-200 mb-3"
        style={{ background: 'rgba(109,92,252,0.1)', border: '1px solid rgba(109,92,252,0.3)' }}
      >
        <span style={{ color: '#a78bfa' }}>▶</span>
        You chose {choice.title}
      </motion.div>
      <motion.p variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }} className="text-[13px] leading-relaxed text-neutral-300 mb-4">
        {choice.narrative}
      </motion.p>

      <div className="flex flex-wrap gap-2 mb-4">
        {improved.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {improved.map(([k, d]) => (
              <span
                key={k}
                className="px-2 py-0.5 rounded-md text-[10px] font-mono"
                style={{ color: '#a78bfa', background: 'rgba(109,92,252,0.1)', border: '1px solid rgba(109,92,252,0.25)' }}
              >
                ↑ {scenario.metrics[k].label} improved
              </span>
            ))}
          </div>
        )}
        {worse.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {worse.map(([k, d]) => (
              <span
                key={k}
                className="px-2 py-0.5 rounded-md text-[10px] font-mono"
                style={{ color: '#d4af37', background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.2)' }}
              >
                ↓ {scenario.metrics[k].label} got worse
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2 mb-4">
        {Object.entries(scenario.metrics).map(([k, metric]) => (
          <MetricCard key={k} metric={metric} value={currentValues[k]} prev={prevValues[k]} />
        ))}
      </div>

      <motion.div
        variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}
        className="rounded-xl p-3 mb-4"
        style={{ background: 'rgba(16,16,20,0.7)', border: '1px solid rgba(255,255,255,0.06)' }}
      >
        <div className="text-[9px] font-mono uppercase tracking-[0.25em] text-neutral-600 mb-1">System evolution</div>
        <ArchitectureView architecture={architecture} />
      </motion.div>

      <motion.div variants={{ hidden: { opacity: 0 }, show: { opacity: 1 } }} className="mt-auto">
        <button
          onClick={onContinue}
          className="px-4 py-2 rounded-lg text-[12px] font-medium text-neutral-200 transition-all hover:scale-[1.02] active:scale-[0.98]"
          style={{ background: 'rgba(109,92,252,0.9)' }}
        >
          {isFinal ? 'See the final architecture →' : 'Next decision →'}
        </button>
      </motion.div>
    </motion.div>
  )
}
