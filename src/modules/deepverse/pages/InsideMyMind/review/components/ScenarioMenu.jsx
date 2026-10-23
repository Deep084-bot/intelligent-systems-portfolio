export default function ScenarioMenu({ scenarios, progress, onSelect }) {
  return (
    <div className="flex flex-col h-full">
      <div className="text-[9px] font-mono uppercase tracking-[0.25em] text-neutral-600 mb-1">Code Review Arena</div>
      <p className="text-[13px] text-neutral-400 leading-relaxed mb-5">
        You are a principal engineer reviewing someone else's pull request. Read the diff, find what they missed, and decide if it's safe to merge.
      </p>

      <div className="text-[9px] font-mono uppercase tracking-[0.25em] text-neutral-600 mb-2">Open pull requests</div>
      <div className="space-y-2 mb-4">
        {scenarios.filter((s) => !s.comingSoon).map((s) => {
          const p = progress[s.id]
          return (
            <button
              key={s.id}
              onClick={() => onSelect(s)}
              className="w-full text-left px-4 py-3 rounded-xl transition-all hover:translate-x-1 active:scale-[0.995]"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] text-neutral-200">{s.title}</span>
                    <span
                      className="text-[8px] font-mono px-1.5 py-0.5 rounded"
                      style={{ background: 'rgba(109,92,252,0.1)', color: '#a78bfa', border: '1px solid rgba(109,92,252,0.2)' }}
                    >
                      {(s.issues || []).length} issues
                    </span>
                  </div>
                  <div className="text-[11px] text-neutral-500 mt-0.5">{s.summary}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-[9px] font-mono text-neutral-600">
                    {p ? `best ${p.bestScore}` : 'unreviewed'}
                  </div>
                  <div className="text-[9px] font-mono text-neutral-700">{s.difficulty}</div>
                </div>
              </div>
            </button>
          )
        })}
      </div>

      <div className="text-[9px] font-mono uppercase tracking-[0.25em] text-neutral-600 mb-2">Coming soon</div>
      <div className="space-y-2">
        {scenarios.map((s) =>
          s.comingSoon ? (
            <div
              key={s.id}
              className="flex items-center justify-between px-4 py-2.5 rounded-xl opacity-60"
              style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}
            >
              <div className="text-[12px] text-neutral-500">{s.title}</div>
              <div className="text-[9px] font-mono text-neutral-700">soon</div>
            </div>
          ) : null
        )}
      </div>
    </div>
  )
}
