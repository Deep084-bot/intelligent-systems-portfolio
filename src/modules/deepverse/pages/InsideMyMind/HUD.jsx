import { motion } from 'framer-motion'
import useBrainStore from './store'
import { MODULES } from './nodes.config'

export default function HUD() {
  const visitedModules = useBrainStore((s) => s.visitedModules)
  const toggleHelp = useBrainStore((s) => s.toggleHelp)
  const toggleSettings = useBrainStore((s) => s.toggleSettings)
  const toggleAchievements = useBrainStore((s) => s.toggleAchievements)
  const achievements = useBrainStore((s) => s.achievements)
  const progress = Math.round((visitedModules.length / MODULES.length) * 100)

  return (
    <>
      {/* Top left */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="absolute top-5 left-6 z-20 select-none"
      >
        <div className="text-[13px] font-semibold text-neutral-300 tracking-wide">Inside My Mind</div>
        <div className="text-[9px] font-mono text-neutral-700 mt-px">Brain OS v1</div>
      </motion.div>

      {/* Top right */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="absolute top-5 right-6 z-20 flex items-center gap-1"
      >
        <HUDBtn label="Help" onClick={toggleHelp}>
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <circle cx="12" cy="12" r="10" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" />
            <path d="M12 17h.01" strokeLinecap="round" strokeWidth={2} />
          </svg>
        </HUDBtn>
        <HUDBtn label="Achievements" onClick={toggleAchievements}>
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </HUDBtn>
        <HUDBtn label="Settings" onClick={toggleSettings}>
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </HUDBtn>
      </motion.div>

      {/* Bottom left */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.5 }}
        className="absolute bottom-5 left-6 z-20 select-none"
      >
        <div className="flex items-center gap-2">
          <div className="text-[10px] font-mono text-neutral-600">
            Brain Completion
          </div>
          <div className="text-[10px] font-mono text-neutral-500 font-medium">{progress}%</div>
        </div>
        <div className="w-24 h-px mt-1.5" style={{ background: 'rgba(255,255,255,0.06)' }}>
          <div
            className="h-full transition-all duration-500"
            style={{ width: `${progress}%`, background: 'rgba(109,92,252,0.5)' }}
          />
        </div>
      </motion.div>

      {/* Bottom right */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.5 }}
        className="absolute bottom-5 right-6 z-20 select-none"
      >
        <div className="flex items-center gap-2">
          <div className="text-[10px] font-mono text-neutral-600">
            Modules
          </div>
          <div className="text-[10px] font-mono text-neutral-500 font-medium">
            {visitedModules.length} / {MODULES.length}
          </div>
        </div>
      </motion.div>
    </>
  )
}

function HUDBtn({ label, onClick, children }) {
  return (
    <button
      title={label}
      onClick={onClick}
      className="w-8 h-8 flex items-center justify-center rounded-lg text-neutral-600 hover:text-neutral-400 hover:bg-[rgba(255,255,255,0.04)] transition-all active:scale-95"
    >
      {children}
    </button>
  )
}
