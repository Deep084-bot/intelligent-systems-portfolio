import { motion } from 'framer-motion'
import useBrainStore from './store'

export default function SettingsDrawer() {
  const {
    particlesEnabled,
    ambientGlow,
    reducedMotion,
    setParticlesEnabled,
    setAmbientGlow,
    setReducedMotion,
    resetProgress,
    toggleSettings,
  } = useBrainStore()

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[12vh]"
      onClick={(e) => { if (e.target === e.currentTarget) toggleSettings() }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: -10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: -10 }}
        transition={{ duration: 0.2 }}
        className="w-[340px] rounded-xl overflow-hidden shadow-2xl"
        style={{
          background: 'rgba(14,14,16,0.98)',
          border: '1px solid rgba(255,255,255,0.06)',
          backdropFilter: 'blur(20px)',
        }}
      >
        <div className="px-4 py-3 border-b flex items-center justify-between" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
          <span className="text-[11px] text-neutral-500 uppercase tracking-wider font-semibold">Settings</span>
          <button onClick={toggleSettings} className="text-neutral-600 hover:text-neutral-400 transition-colors">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-4 space-y-4">
          <ToggleRow label="Particles" value={particlesEnabled} onChange={setParticlesEnabled} />
          <ToggleRow label="Ambient Glow" value={ambientGlow} onChange={setAmbientGlow} />
          <ToggleRow label="Reduced Motion" value={reducedMotion} onChange={setReducedMotion} />
          <div className="h-px" style={{ background: 'rgba(255,255,255,0.04)' }} />
          <button
            onClick={() => { if (confirm('Reset all Brain OS progress?')) resetProgress() }}
            className="w-full py-2 rounded-lg text-[11px] text-neutral-600 hover:text-red-400 transition-colors"
            style={{ border: '1px solid rgba(255,255,255,0.04)' }}
          >
            Reset Progress
          </button>
        </div>
      </motion.div>
    </div>
  )
}

function ToggleRow({ label, value, onChange }) {
  return (
    <div className="flex items-center justify-between py-0.5">
      <span className="text-[12px] text-neutral-400">{label}</span>
      <button
        onClick={() => onChange(!value)}
        className="w-8 h-4 rounded-full relative transition-colors"
        style={{ background: value ? 'rgba(109,92,252,0.4)' : 'rgba(255,255,255,0.08)' }}
      >
        <div
          className="absolute top-0.5 w-3 h-3 rounded-full transition-transform"
          style={{
            background: value ? '#6d5cfc' : '#52525b',
            transform: value ? 'translateX(18px)' : 'translateX(2px)',
          }}
        />
      </button>
    </div>
  )
}
