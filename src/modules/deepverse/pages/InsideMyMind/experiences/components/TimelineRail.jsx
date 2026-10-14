const PHASE_STEPS = { situation: 0, decide: 1, outcome: 2, conclusion: 3 }
const STEP_LABELS = ['Situation', 'Decide', 'Outcome', 'Conclusion']

export default function TimelineRail({ phase }) {
  const current = PHASE_STEPS[phase] ?? 3

  return (
    <div className="flex items-center gap-0 py-2">
      {STEP_LABELS.map((label, i) => {
        const done = i < current
        const active = i === current
        return (
          <div key={label} className="flex items-center flex-1">
            <div className="flex items-center gap-2">
              <div
                className="w-2 h-2 rounded-full transition-all"
                style={{
                  background: done ? '#6d5cfc' : active ? '#d4af37' : 'rgba(255,255,255,0.15)',
                  boxShadow: active ? '0 0 8px rgba(212,175,55,0.6)' : 'none',
                }}
              />
              <span
                className="text-[9px] font-mono uppercase tracking-wider hidden sm:block"
                style={{ color: active ? '#e4e4e7' : done ? '#a1a1aa' : '#52525b' }}
              >
                {label}
              </span>
            </div>
            {i < STEP_LABELS.length - 1 && (
              <div
                className="flex-1 mx-2 h-px"
                style={{ background: done ? 'rgba(109,92,252,0.4)' : 'rgba(255,255,255,0.08)' }}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
