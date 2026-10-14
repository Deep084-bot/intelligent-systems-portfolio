import { useState } from 'react'
import ArchitectureDiagram from './ArchitectureDiagram'

const TABS = ['Situation', 'Logs', 'Metrics', 'Architecture']

export default function EvidencePanel({ evidence, unlockedEvidence }) {
  const [tab, setTab] = useState('Situation')
  const unlocked = (evidence.extra || []).filter((e) => unlockedEvidence.includes(e.id))

  return (
    <div
      className="flex flex-col rounded-xl overflow-hidden min-h-0"
      style={{ background: 'rgba(16,16,20,0.7)', border: '1px solid rgba(255,255,255,0.06)' }}
    >
      <div className="flex items-center gap-0.5 px-2 py-2 border-b" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="px-2.5 py-1 rounded-md text-[9px] font-mono uppercase tracking-wider transition-colors"
            style={{
              background: tab === t ? 'rgba(109,92,252,0.14)' : 'transparent',
              color: tab === t ? '#e4e4e7' : '#52525b',
            }}
          >
            {t}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-y-auto p-3">
        {tab === 'Situation' && (
          <p className="text-[12px] leading-relaxed text-neutral-400">{evidence.situation}</p>
        )}
        {tab === 'Logs' && (
          <div className="space-y-3">
            <div className="space-y-1 font-mono text-[10.5px] leading-relaxed text-neutral-500">
              {evidence.logs.map((line, i) => (
                <div key={i}>{line}</div>
              ))}
            </div>
            {unlocked.map((e) => (
              <div key={e.id} className="pt-2 border-t" style={{ borderColor: 'rgba(212,175,55,0.15)' }}>
                <div className="text-[9px] font-mono uppercase tracking-wider mb-1" style={{ color: '#d4af37' }}>
                  ◈ {e.label} — unlocked
                </div>
                <div className="space-y-1 font-mono text-[10.5px] leading-relaxed text-neutral-400">
                  {e.lines.map((line, i) => (
                    <div key={i}>{line}</div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
        {tab === 'Metrics' && (
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(evidence.metrics).map(([k, v]) => (
              <div
                key={k}
                className="px-2.5 py-2 rounded-lg"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.04)' }}
              >
                <div className="text-[9px] font-mono uppercase tracking-wider text-neutral-600">{k}</div>
                <div className="text-[12px] font-mono text-neutral-300 mt-0.5">{v}</div>
              </div>
            ))}
          </div>
        )}
        {tab === 'Architecture' && <ArchitectureDiagram architecture={evidence.architecture} />}
      </div>
    </div>
  )
}
