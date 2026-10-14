import { motion } from 'framer-motion'
import useBrainStore from './store'
import { ACHIEVEMENTS } from './achievements.config'

export default function AchievementsPanel() {
  const toggleAchievements = useBrainStore((s) => s.toggleAchievements)
  const unlocked = useBrainStore((s) => s.achievements)

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[12vh]"
      onClick={(e) => { if (e.target === e.currentTarget) toggleAchievements() }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: -10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: -10 }}
        transition={{ duration: 0.2 }}
        className="w-[380px] max-h-[60vh] rounded-xl overflow-hidden shadow-2xl"
        style={{
          background: 'rgba(14,14,16,0.98)',
          border: '1px solid rgba(255,255,255,0.06)',
          backdropFilter: 'blur(20px)',
        }}
      >
        <div className="px-4 py-3 border-b flex items-center justify-between" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
          <span className="text-[11px] text-neutral-500 uppercase tracking-wider font-semibold">Achievements</span>
          <button onClick={toggleAchievements} className="text-neutral-600 hover:text-neutral-400 transition-colors">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-3 space-y-2 max-h-[50vh] overflow-y-auto">
          {ACHIEVEMENTS.map((ach) => {
            const isUnlocked = unlocked.includes(ach.id)
            return (
              <div
                key={ach.id}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${
                  isUnlocked ? '' : 'opacity-40'
                }`}
                style={{ background: isUnlocked ? 'rgba(109,92,252,0.06)' : 'rgba(255,255,255,0.02)' }}
              >
                <span className="text-lg">{isUnlocked ? ach.icon : '🔒'}</span>
                <div className="flex-1 min-w-0">
                  <div className={`text-[12px] font-medium ${isUnlocked ? 'text-neutral-200' : 'text-neutral-600'}`}>
                    {ach.label}
                  </div>
                  <div className="text-[10px] text-neutral-600 truncate">{ach.description}</div>
                </div>
                {isUnlocked && (
                  <svg className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#6d5cfc' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
            )
          })}
        </div>
      </motion.div>
    </div>
  )
}
