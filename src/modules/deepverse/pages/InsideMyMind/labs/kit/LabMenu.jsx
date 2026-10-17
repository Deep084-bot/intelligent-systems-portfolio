import { SectionLabel, Chip } from './ui'

export default function LabMenu({ heading, blurb, scenarios, progress, onSelect, playedLabel = 'best', comingSoon = [] }) {
  return (
    <div className="flex flex-col h-full">
      <SectionLabel className="mb-1">{heading}</SectionLabel>
      <p className="text-[13px] text-neutral-400 leading-relaxed mb-5">{blurb}</p>

      <div className="space-y-2 mb-4">
        {scenarios.map((s) => {
          const p = progress?.[s.id]
          return (
            <button
              key={s.id}
              onClick={() => onSelect(s)}
              className="w-full text-left px-4 py-3 rounded-xl transition-all hover:translate-x-1 active:scale-[0.995]"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] text-neutral-200">{s.title}</span>
                    {s.difficulty && <Chip tone="purple">{s.difficulty}</Chip>}
                  </div>
                  <div className="text-[11px] text-neutral-500 mt-1 leading-snug">{s.summary}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-[9px] font-mono text-neutral-600">
                    {p?.completed ? `${playedLabel} ${p.bestScore}` : 'unplayed'}
                  </div>
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {comingSoon.length > 0 && (
        <>
          <SectionLabel className="mb-2">Coming soon</SectionLabel>
          <div className="space-y-2">
            {comingSoon.map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between px-4 py-2.5 rounded-xl opacity-60"
                style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}
              >
                <div className="text-[12px] text-neutral-500">{s.title}</div>
                <div className="text-[9px] font-mono text-neutral-700">soon</div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
