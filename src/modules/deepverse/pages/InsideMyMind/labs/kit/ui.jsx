export function SectionLabel({ children, className = '', style }) {
  return (
    <div className={`text-[9px] font-mono uppercase tracking-[0.25em] text-neutral-600 ${className}`} style={style}>
      {children}
    </div>
  )
}

export function Card({ children, className = '', style, active = false, ...rest }) {
  return (
    <div
      className={`rounded-xl ${className}`}
      style={{
        background: active ? 'rgba(109,92,252,0.08)' : 'rgba(255,255,255,0.03)',
        border: active ? '1px solid rgba(109,92,252,0.35)' : '1px solid rgba(255,255,255,0.06)',
        ...style,
      }}
      {...rest}
    >
      {children}
    </div>
  )
}

const TONES = {
  neutral: { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', color: '#a1a1aa' },
  purple: { background: 'rgba(109,92,252,0.12)', border: '1px solid rgba(109,92,252,0.3)', color: '#a78bfa' },
  gold: { background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.3)', color: '#d4af37' },
  green: { background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.3)', color: '#4ade80' },
  red: { background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', color: '#f87171' },
  blue: { background: 'rgba(56,189,248,0.1)', border: '1px solid rgba(56,189,248,0.3)', color: '#38bdf8' },
}

export function Chip({ children, tone = 'neutral', className = '' }) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-md text-[9px] font-mono uppercase tracking-wider ${className}`}
      style={TONES[tone]}
    >
      {children}
    </span>
  )
}

export function PrimaryButton({ children, className = '', ...rest }) {
  return (
    <button
      className={`px-4 py-2 rounded-lg text-[12px] font-medium text-neutral-200 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40 disabled:hover:scale-100 disabled:cursor-not-allowed ${className}`}
      style={{ background: 'rgba(109,92,252,0.9)' }}
      {...rest}
    >
      {children}
    </button>
  )
}

export function GhostButton({ children, className = '', ...rest }) {
  return (
    <button
      className={`px-4 py-2 rounded-lg text-[12px] font-medium text-neutral-300 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40 disabled:hover:scale-100 disabled:cursor-not-allowed ${className}`}
      style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}
      {...rest}
    >
      {children}
    </button>
  )
}

const FILLS = {
  purple: 'linear-gradient(90deg,#6d5cfc,#a78bfa)',
  green: 'linear-gradient(90deg,#34d399,#4ade80)',
  red: 'linear-gradient(90deg,#f87171,#d4af37)',
  gold: 'linear-gradient(90deg,#d4af37,#e8c84a)',
  blue: 'linear-gradient(90deg,#38bdf8,#6d5cfc)',
}

export function Bar({ value, max = 100, tone = 'purple', height = 4 }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100))
  return (
    <div className="rounded-full overflow-hidden" style={{ height, background: 'rgba(255,255,255,0.06)' }}>
      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: FILLS[tone] || FILLS.purple }} />
    </div>
  )
}

export function Stat({ label, value, unit, tone = 'neutral', lowerIsBetter = false, target }) {
  const num = typeof value === 'number' ? value : parseFloat(value)
  const met = target !== undefined ? (lowerIsBetter ? num <= target : num >= target) : null
  const color = met === null ? '#e4e4e7' : met ? '#4ade80' : '#f87171'
  return (
    <div>
      <div className="text-[9px] font-mono uppercase tracking-wider text-neutral-600 mb-0.5">{label}</div>
      <div className="text-[15px] font-mono" style={{ color }}>
        {value}
        {unit ? <span className="text-[10px] text-neutral-600 ml-0.5">{unit}</span> : null}
      </div>
    </div>
  )
}
