const GRADE = (score) =>
  score >= 80 ? 'Engineered Response' : score >= 60 ? 'Deliberate & Measured' : score >= 45 ? 'Viable, Rough Edges' : 'Reactive Firefighting'

export default function ConclusionScreen({ result, onReplay, onBack, progress }) {
  const score = Math.round(result.score)
  const tops = Object.entries(result.dimensionBreakdown)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([k]) => k)

  const isBest = progress ? score >= progress.bestScore : true

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="text-[9px] font-mono uppercase tracking-[0.25em] text-neutral-600 mb-3">Post-mortem</div>

      <div className="text-[34px] font-medium mb-1" style={{ color: score >= 70 ? '#4ade80' : score >= 45 ? '#d4af37' : '#f87171' }}>
        {score}
      </div>
      <div className="text-[12px] text-neutral-400 mb-4">{GRADE(score)}</div>

      {isBest && progress?.completed && (
        <div
          className="inline-flex self-start items-center gap-2 px-3 py-1.5 rounded-lg text-[11px] font-mono mb-4"
          style={{ background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.3)', color: '#d4af37' }}
        >
          ★ NEW BEST — attempt {progress.attempts}
        </div>
      )}
      {!progress?.completed && (
        <div
          className="inline-flex self-start items-center gap-2 px-3 py-1.5 rounded-lg text-[11px] font-mono mb-4"
          style={{ background: 'rgba(109,92,252,0.1)', border: '1px solid rgba(109,92,252,0.3)', color: '#a78bfa' }}
        >
          ◈ First completion — Decision Maker unlocked
        </div>
      )}

      <div className="mb-5">
        <div className="text-[9px] font-mono uppercase tracking-[0.25em] text-neutral-600 mb-2">Dimension breakdown</div>
        {Object.entries(result.dimensionBreakdown).map(([k, v]) => (
          <div key={k} className="flex justify-between text-[11px] font-mono text-neutral-400 mb-1">
            <span className={tops.includes(k) ? '' : 'text-neutral-600'}>{k}</span>
            <span>{Math.round(v)}</span>
          </div>
        ))}
      </div>

      <div className="mb-5">
        <div className="text-[9px] font-mono uppercase tracking-[0.25em] text-neutral-600 mb-2">Recommended approach</div>
        <p className="text-[12px] leading-relaxed text-neutral-300">{result.recommendedApproach}</p>
      </div>

      <div className="mb-6">
        <div className="text-[9px] font-mono uppercase tracking-[0.25em] text-neutral-600 mb-2">Lessons</div>
        <ul className="space-y-1">
          {result.lessons.map((l, i) => (
            <li key={i} className="flex gap-2 text-[12px] leading-relaxed text-neutral-400">
              <span style={{ color: '#6d5cfc' }}>›</span>
              {l}
            </li>
          ))}
        </ul>
      </div>

      <div className="flex gap-2 mt-auto pb-1">
        <button
          onClick={onReplay}
          className="px-4 py-2 rounded-lg text-[12px] font-medium text-neutral-200 transition-all hover:scale-[1.02] active:scale-[0.98]"
          style={{ background: 'rgba(109,92,252,0.9)' }}
        >
          Replay
        </button>
        <button
          onClick={onBack}
          className="px-4 py-2 rounded-lg text-[12px] font-medium text-neutral-300 transition-all hover:scale-[1.02] active:scale-[0.98]"
          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          Back to menu
        </button>
      </div>
    </div>
  )
}
