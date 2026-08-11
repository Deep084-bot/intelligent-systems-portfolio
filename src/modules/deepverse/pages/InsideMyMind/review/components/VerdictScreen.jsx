import { useState } from 'react'
import { motion } from 'framer-motion'

export default function VerdictScreen({ scenario, state, notes, setNotes, onSubmit, onCancel }) {
  const [confirming, setConfirming] = useState(false)
  const approve = state.verdict === 'approve'
  const found = state.foundIds.length
  const total = scenario.issues.length

  return (
    <motion.div
      className="flex flex-col h-full items-center justify-center"
      initial="hidden"
      animate="show"
      exit="hidden"
      variants={{ show: { transition: { staggerChildren: 0.08 } } }}
    >
      <motion.div
        variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }}
        className="w-[min(480px,100%)] rounded-2xl p-6"
        style={{ background: 'rgba(16,16,20,0.95)', border: `1px solid ${approve ? 'rgba(52,211,153,0.3)' : 'rgba(248,113,113,0.3)'}` }}
      >
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[10px] font-mono uppercase tracking-wider" style={{ color: approve ? '#4ade80' : '#f87171' }}>
            {approve ? '✓ Approve' : '✕ Request changes'}
          </span>
        </div>
        <h3 className="text-[17px] font-medium text-neutral-100 mb-1">
          {approve ? 'Merge this pull request?' : 'Send this back for changes?'}
        </h3>
        <p className="text-[12px] text-neutral-500 leading-relaxed mb-4">
          {scenario.pr.title} · you found {found} of {total} issues in {state.comments.length} comments.
        </p>

        <div className="mb-4">
          <div className="text-[8px] font-mono uppercase tracking-wider text-neutral-600 mb-1">Notes to the author</div>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            maxLength={400}
            placeholder="Optional summary for the PR author…"
            className="w-full px-2.5 py-2 rounded-lg text-[11px] text-neutral-300 resize-none outline-none placeholder:text-neutral-600"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
          />
        </div>

        {!confirming ? (
          <div className="flex gap-2">
            <button
              onClick={() => setConfirming(true)}
              className="px-4 py-2 rounded-lg text-[12px] font-medium text-neutral-200 transition-all hover:scale-[1.02] active:scale-[0.98]"
              style={{ background: approve ? 'rgba(52,211,153,0.2)' : 'rgba(248,113,113,0.2)', color: approve ? '#4ade80' : '#f87171' }}
            >
              Submit review
            </button>
            <button
              onClick={onCancel}
              className="px-4 py-2 rounded-lg text-[12px] font-medium text-neutral-300 transition-all hover:scale-[1.02] active:scale-[0.98]"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              Keep reviewing
            </button>
          </div>
        ) : (
          <div>
            <p className="text-[11px] text-neutral-400 mb-3">
              {approve
                ? 'Approving means you are confident this is safe to merge. Double-check you are not missing a critical issue.'
                : 'Requesting changes means you want this revised before merge. Make sure your feedback is actionable.'}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => onSubmit(approve ? 'approve' : 'request-changes', notes)}
                className="px-4 py-2 rounded-lg text-[12px] font-medium text-neutral-900 transition-all hover:scale-[1.02] active:scale-[0.98]"
                style={{ background: approve ? '#4ade80' : '#f87171' }}
              >
                {approve ? '✓ Confirm approve' : '✕ Confirm request changes'}
              </button>
              <button
                onClick={() => setConfirming(false)}
                className="px-4 py-2 rounded-lg text-[12px] font-medium text-neutral-300 transition-all hover:scale-[1.02] active:scale-[0.98]"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}
              >
                Back
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}
