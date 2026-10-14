export default function ScoreMeter({ scores, show = true }) {
  if (!show) return null
  const total = Math.round(scores.reduce((a, b) => a + b, 0))
  const dims = ['Prioritization', 'Risk', 'Tradeoffs', 'Incremental', 'Evidence']
  const avg = total / dims.length

  return (
    <div
      className="rounded-xl p-3"
      style={{ background: 'rgba(16,16,20,0.7)', border: '1px solid rgba(255,255,255,0.06)' }}
    >
      <div className="flex items-baseline justify-between mb-2">
        <span className="text-[9px] font-mono uppercase tracking-[0.25em] text-neutral-600">Decision Score</span>
        <span
          className="text-[20px] font-mono font-medium"
          style={{ color: total >= 70 ? '#4ade80' : total >= 45 ? '#d4af37' : '#f87171' }}
        >
          {total}
        </span>
      </div>
      <div className="space-y-1.5">
        {dims.map((label, i) => (
          <div key={label}>
            <div className="flex justify-between text-[9px] font-mono text-neutral-500 mb-0.5">
              <span>{label}</span>
              <span>{Math.round(scores[i])}</span>
            </div>
            <div className="h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
              <div
                className="h-1 rounded-full transition-all duration-700"
                style={{
                  width: `${Math.min(100, scores[i])}%`,
                  background: avg >= 50 ? 'linear-gradient(90deg,#6d5cfc,#a78bfa)' : 'linear-gradient(90deg,#f87171,#d4af37)',
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
