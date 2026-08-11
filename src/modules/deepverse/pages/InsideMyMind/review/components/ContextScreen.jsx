import { motion } from 'framer-motion'

export default function ContextScreen({ scenario, onBegin }) {
  const { pr, files } = scenario
  const additions = files.reduce((s, f) => s + f.lines.filter((l) => l.type === 'add').length, 0)
  const deletions = files.reduce((s, f) => s + f.lines.filter((l) => l.type === 'remove').length, 0)

  return (
    <motion.div
      className="flex flex-col h-full"
      initial="hidden"
      animate="show"
      variants={{ show: { transition: { staggerChildren: 0.07 } } }}
    >
      <div className="text-[9px] font-mono uppercase tracking-[0.25em] text-neutral-600 mb-1">Pull request context</div>
      <motion.div
        variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}
        className="rounded-xl p-3.5 mb-4"
        style={{ background: 'rgba(16,16,20,0.7)', border: '1px solid rgba(255,255,255,0.06)' }}
      >
        <div className="text-[9px] font-mono uppercase tracking-[0.25em] text-neutral-600 mb-1.5">Description</div>
        <p className="text-[13px] text-neutral-300 leading-relaxed">{pr.description}</p>
      </motion.div>

      <motion.div
        variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}
        className="rounded-xl p-3.5 mb-4"
        style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}
      >
        <div className="text-[9px] font-mono uppercase tracking-[0.25em] text-neutral-600 mb-2">Changed files</div>
        <div className="space-y-1">
          {files.map((f) => {
            const a = f.lines.filter((l) => l.type === 'add').length
            const d = f.lines.filter((l) => l.type === 'remove').length
            return (
              <div key={f.path} className="flex items-center justify-between text-[11px] font-mono rounded-md px-2.5 py-1.5" style={{ background: 'rgba(255,255,255,0.02)' }}>
                <span className="text-neutral-300">{f.path}</span>
                <span>
                  <span className="text-emerald-500/80">+{a}</span>
                  <span className="text-neutral-700"> / </span>
                  <span className="text-red-500/80">−{d}</span>
                </span>
              </div>
            )
          })}
        </div>
        <div className="text-[10px] font-mono text-neutral-600 mt-2">
          {files.length} files · {additions} additions · {deletions} deletions
        </div>
      </motion.div>

      <motion.div variants={{ hidden: { opacity: 0 }, show: { opacity: 1 } }} className="mt-auto">
        <button
          onClick={onBegin}
          className="px-4 py-2 rounded-lg text-[12px] font-medium text-neutral-200 transition-all hover:scale-[1.02] active:scale-[0.98]"
          style={{ background: 'rgba(109,92,252,0.9)' }}
        >
          Start the review →
        </button>
      </motion.div>
    </motion.div>
  )
}
