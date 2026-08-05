import { motion } from 'framer-motion'

const LETTERS = ['A', 'B', 'C']

export default function DecisionScreen({ decision, decisionIndex, total, onChoose }) {
  return (
    <motion.div
      key={decisionIndex}
      className="flex flex-col h-full"
      initial="hidden"
      animate="show"
      exit="hidden"
      variants={{ show: { transition: { staggerChildren: 0.09 } } }}
    >
      <div className="text-[9px] font-mono uppercase tracking-[0.25em] text-neutral-600 mb-1">
        Decision {decisionIndex + 1} of {total}
      </div>
      <motion.h3 variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }} className="text-[17px] font-medium text-neutral-100 leading-snug mb-1">
        {decision.question}
      </motion.h3>
      <motion.p variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }} className="text-[11.5px] text-neutral-500 leading-relaxed mb-4">
        {decision.framing}
      </motion.p>

      <div className="grid grid-cols-3 gap-2.5 min-h-0 flex-1">
        {decision.choices.map((choice, i) => (
          <motion.button
            key={choice.id}
            variants={{ hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0 } }}
            onClick={() => onChoose(choice.id)}
            className="flex flex-col text-left rounded-xl p-3.5 transition-all hover:-translate-y-0.5 active:scale-[0.99] group"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[9px] font-mono text-neutral-600">{LETTERS[i]}</span>
              <span className="text-[13px] font-medium text-neutral-100">{choice.title}</span>
            </div>
            <div className="text-[9px] font-mono text-neutral-500 mb-2.5">{choice.subtitle}</div>

            <div className="mb-2.5">
              <div className="text-[8px] font-mono uppercase tracking-wider text-neutral-600 mb-1">Advantages</div>
              <ul className="space-y-1">
                {choice.advantages.map((a, j) => (
                  <li key={j} className="flex gap-1.5 text-[10.5px] text-neutral-400 leading-snug">
                    <span style={{ color: '#6d5cfc' }}>+</span>
                    {a}
                  </li>
                ))}
              </ul>
            </div>

            <div className="mb-2.5">
              <div className="text-[8px] font-mono uppercase tracking-wider text-neutral-600 mb-1">Disadvantages</div>
              <ul className="space-y-1">
                {choice.disadvantages.map((d, j) => (
                  <li key={j} className="flex gap-1.5 text-[10.5px] text-neutral-500 leading-snug">
                    <span className="text-neutral-600">−</span>
                    {d}
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-auto">
              <div className="text-[8px] font-mono uppercase tracking-wider text-neutral-600 mb-1">Best when</div>
              <div className="space-y-1">
                {choice.recommendedFor.map((r, j) => (
                  <div key={j} className="flex gap-1.5 text-[10.5px] text-neutral-500 leading-snug">
                    <span className="text-neutral-700">›</span>
                    {r}
                  </div>
                ))}
              </div>
            </div>
          </motion.button>
        ))}
      </div>

      <motion.div variants={{ hidden: { opacity: 0 }, show: { opacity: 1 } }} className="mt-3 text-center">
        <span className="text-[9px] font-mono text-neutral-700 tracking-wide">
          There is no single right answer — only tradeoffs against these constraints.
        </span>
      </motion.div>
    </motion.div>
  )
}
