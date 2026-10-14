import { motion } from 'framer-motion'
import useBrainStore from './store'

const SECTIONS = [
  {
    title: 'Navigation',
    items: [
      { keys: 'Drag canvas', desc: 'Pan' },
      { keys: 'Scroll', desc: 'Zoom' },
      { keys: 'Double click', desc: 'Center graph' },
      { keys: 'ESC', desc: 'Return home' },
    ],
  },
  {
    title: 'Interaction',
    items: [
      { keys: 'Hover node', desc: 'Preview module' },
      { keys: 'Click node', desc: 'Open module' },
    ],
  },
  {
    title: 'Future',
    items: [
      { keys: 'New modules', desc: 'Will unlock over time' },
      { keys: 'Progress', desc: 'Saved automatically' },
    ],
  },
]

export default function HelpPanel() {
  const toggleHelp = useBrainStore((s) => s.toggleHelp)

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]"
      onClick={(e) => { if (e.target === e.currentTarget) toggleHelp() }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: -10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: -10 }}
        transition={{ duration: 0.2 }}
        className="w-[360px] rounded-xl overflow-hidden shadow-2xl"
        style={{
          background: 'rgba(14,14,16,0.98)',
          border: '1px solid rgba(255,255,255,0.06)',
          backdropFilter: 'blur(20px)',
        }}
      >
        <div className="px-4 py-3 border-b flex items-center justify-between" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
          <span className="text-[11px] text-neutral-500 uppercase tracking-wider font-semibold">Help</span>
          <button onClick={toggleHelp} className="text-neutral-600 hover:text-neutral-400 transition-colors">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-3 space-y-3">
          {SECTIONS.map((section) => (
            <div key={section.title}>
              <p className="text-[9px] text-neutral-600 uppercase tracking-wider font-medium mb-1.5">{section.title}</p>
              <div className="space-y-0.5">
                {section.items.map((item) => (
                  <div key={item.keys} className="flex items-center justify-between py-0.5">
                    <span className="text-[11px] text-neutral-400">{item.desc}</span>
                    <kbd className="px-1.5 py-0.5 rounded text-[9px] font-mono text-neutral-600" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.04)' }}>
                      {item.keys}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  )
}
