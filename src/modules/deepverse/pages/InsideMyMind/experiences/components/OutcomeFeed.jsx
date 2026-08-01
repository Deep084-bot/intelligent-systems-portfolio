export default function OutcomeFeed({ entry, onContinue }) {
  const deltaEntries = Object.entries(entry.delta || {})
  const effectEntries = Object.entries(entry.effect || {})
  const unlocked = entry.unlockedEvidence?.length

  return (
    <div className="flex flex-col h-full">
      <div className="text-[9px] font-mono uppercase tracking-[0.25em] text-neutral-600 mb-3">Outcome</div>
      <div
        className="inline-flex self-start items-center gap-2 px-3 py-1.5 rounded-lg text-[12px] text-neutral-200 mb-4"
        style={{ background: 'rgba(109,92,252,0.1)', border: '1px solid rgba(109,92,252,0.3)' }}
      >
        <span style={{ color: '#a78bfa' }}>▶</span>
        {entry.label}
      </div>
      <p className="text-[13px] leading-relaxed text-neutral-300 mb-4">{entry.outcome}</p>

      {effectEntries.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {effectEntries.map(([k, v]) => (
            <span
              key={k}
              className="px-2 py-1 rounded-md text-[10px] font-mono"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', color: '#a1a1aa' }}
            >
              {k}: {v}
            </span>
          ))}
        </div>
      )}

      {deltaEntries.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {deltaEntries.map(([k, v]) => (
            <span
              key={k}
              className="px-2 py-0.5 rounded-md text-[10px] font-mono"
              style={{
                color: v >= 0 ? '#4ade80' : '#f87171',
                background: v >= 0 ? 'rgba(74,222,128,0.08)' : 'rgba(248,113,113,0.08)',
              }}
            >
              {v >= 0 ? `+${v}` : v} {k}
            </span>
          ))}
        </div>
      )}

      {unlocked > 0 && (
        <div className="text-[10px] font-mono mb-4" style={{ color: '#d4af37' }}>
          ◈ New evidence unlocked — check the Logs tab
        </div>
      )}

      <div className="mt-auto">
        <button
          onClick={onContinue}
          className="px-4 py-2 rounded-lg text-[12px] font-medium text-neutral-200 transition-all hover:scale-[1.02] active:scale-[0.98]"
          style={{ background: 'rgba(109,92,252,0.9)' }}
        >
          Continue →
        </button>
      </div>
    </div>
  )
}
