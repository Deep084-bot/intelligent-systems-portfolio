export default function ReviewSidebar({ scenario, state, notes, setNotes, onVerdict }) {
  const total = scenario.issues.length
  const found = state.foundIds.length

  return (
    <div className="flex flex-col rounded-xl overflow-hidden h-full" style={{ background: 'rgba(13,13,17,0.9)', border: '1px solid rgba(255,255,255,0.06)' }}>
      <div className="px-3 py-2 border-b shrink-0" style={{ borderColor: 'rgba(255,255,255,0.06)', background: 'rgba(16,16,20,0.6)' }}>
        <div className="text-[9px] font-mono uppercase tracking-wider text-neutral-600">Review</div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        <div className="grid grid-cols-3 gap-1.5">
          <div className="rounded-lg px-2 py-1.5 text-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div className="text-[15px] font-mono" style={{ color: found === total ? '#4ade80' : '#d4af37' }}>{found}/{total}</div>
            <div className="text-[7.5px] font-mono uppercase tracking-wider text-neutral-600 mt-0.5">Issues</div>
          </div>
          <div className="rounded-lg px-2 py-1.5 text-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div className="text-[15px] font-mono text-neutral-200">{state.comments.length}</div>
            <div className="text-[7.5px] font-mono uppercase tracking-wider text-neutral-600 mt-0.5">Comments</div>
          </div>
          <div className="rounded-lg px-2 py-1.5 text-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div className="text-[15px] font-mono" style={{ color: state.falsePositives ? '#f87171' : '#52525b' }}>
              {state.falsePositives}
            </div>
            <div className="text-[7.5px] font-mono uppercase tracking-wider text-neutral-600 mt-0.5">False pos</div>
          </div>
        </div>

        <div>
          <div className="text-[8px] font-mono uppercase tracking-wider text-neutral-600 mb-1">Your comments</div>
          {state.comments.length === 0 ? (
            <div className="text-[10.5px] text-neutral-600 leading-relaxed">Click a line in the code to add a comment.</div>
          ) : (
            <div className="space-y-1">
              {state.comments.map((c) => (
                <div key={c.id} className="flex items-center justify-between gap-2 text-[10px] font-mono rounded-md px-2 py-1" style={{ background: 'rgba(255,255,255,0.02)' }}>
                  <span className="truncate text-neutral-400">
                    {c.file.split('/').pop()}:{c.line}
                  </span>
                  <span
                    className="shrink-0 text-[8px] px-1.5 py-0.5 rounded"
                    style={{
                      background: c.hit ? 'rgba(74,222,128,0.1)' : 'rgba(255,255,255,0.04)',
                      color: c.hit ? '#4ade80' : '#52525b',
                    }}
                  >
                    {c.hit ? (c.catMatch ? 'hit' : 'hit') : 'note'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
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
      </div>

      <div className="p-3 shrink-0 space-y-2 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <button
          onClick={() => onVerdict('approve')}
          className="w-full px-3 py-2 rounded-lg text-[12px] font-medium text-neutral-200 transition-all hover:scale-[1.01] active:scale-[0.99]"
          style={{ background: 'rgba(52,211,153,0.15)', border: '1px solid rgba(52,211,153,0.35)', color: '#4ade80' }}
        >
          ✓ Approve
        </button>
        <button
          onClick={() => onVerdict('request-changes')}
          className="w-full px-3 py-2 rounded-lg text-[12px] font-medium transition-all hover:scale-[1.01] active:scale-[0.99]"
          style={{ background: 'rgba(248,113,113,0.12)', border: '1px solid rgba(248,113,113,0.35)', color: '#f87171' }}
        >
          ✕ Request changes
        </button>
      </div>
    </div>
  )
}
