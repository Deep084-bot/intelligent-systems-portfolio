import { useState } from 'react'
import { motion } from 'framer-motion'

export default function HypothesisScreen({ scenario, onPropose, onCancel }) {
  const [selected, setSelected] = useState(null)
  const [reasoning, setReasoning] = useState('')

  const submit = () => {
    if (selected) onPropose(selected, reasoning.trim())
  }

  return (
    <motion.div
      className="flex flex-col h-full"
      initial="hidden"
      animate="show"
      exit="hidden"
      variants={{ show: { transition: { staggerChildren: 0.06 } } }}
    >
      <div className="text-[9px] font-mono uppercase tracking-[0.25em] text-neutral-600 mb-1">Build a hypothesis</div>
      <motion.h3 variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }} className="text-[17px] font-medium text-neutral-100 mb-1">
        What is the root cause?
      </motion.h3>
      <motion.p variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }} className="text-[11.5px] text-neutral-500 leading-relaxed mb-4">
        Select the cause your evidence supports. Then explain, in one line, why the evidence points there. Unsupported guesses cost time and score.
      </motion.p>

      <div className="space-y-2 mb-4">
        {scenario.causes.map((c) => {
          const active = selected === c.id
          return (
            <motion.button
              key={c.id}
              variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}
              onClick={() => setSelected(c.id)}
              className="w-full text-left px-4 py-3 rounded-xl transition-all"
              style={{
                background: active ? 'rgba(109,92,252,0.12)' : 'rgba(255,255,255,0.03)',
                border: active ? '1px solid rgba(109,92,252,0.5)' : '1px solid rgba(255,255,255,0.06)',
              }}
            >
              <div className="flex items-center gap-2.5">
                <span
                  className="w-3.5 h-3.5 rounded-full border flex items-center justify-center text-[9px] shrink-0"
                  style={{ borderColor: active ? '#a78bfa' : '#3f3f46', color: active ? '#a78bfa' : 'transparent' }}
                >
                  ●
                </span>
                <span className="text-[13px] text-neutral-200">{c.label}</span>
              </div>
            </motion.button>
          )
        })}
      </div>

      <motion.div variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }} className="mb-4">
        <div className="text-[9px] font-mono uppercase tracking-[0.25em] text-neutral-600 mb-1.5">Why (optional)</div>
        <textarea
          value={reasoning}
          onChange={(e) => setReasoning(e.target.value)}
          rows={2}
          maxLength={180}
          placeholder="e.g. The GC logs show old gen won't shrink, and the heap dump shows retained listeners…"
          className="w-full px-3 py-2.5 rounded-xl text-[12px] text-neutral-300 resize-none outline-none placeholder:text-neutral-600"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
        />
      </motion.div>

      <motion.div variants={{ hidden: { opacity: 0 }, show: { opacity: 1 } }} className="flex gap-2 mt-auto pb-1">
        <button
          onClick={submit}
          disabled={!selected}
          className="px-4 py-2 rounded-lg text-[12px] font-medium transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40 disabled:hover:scale-100"
          style={{ background: selected ? 'rgba(109,92,252,0.9)' : 'rgba(109,92,252,0.3)' }}
        >
          Test hypothesis →
        </button>
        <button
          onClick={onCancel}
          className="px-4 py-2 rounded-lg text-[12px] font-medium text-neutral-300 transition-all hover:scale-[1.02] active:scale-[0.98]"
          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          Keep investigating
        </button>
      </motion.div>
    </motion.div>
  )
}
