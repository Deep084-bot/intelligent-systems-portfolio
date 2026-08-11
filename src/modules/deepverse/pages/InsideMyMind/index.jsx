import { useCallback, useEffect, useRef } from 'react'
import { AnimatePresence } from 'framer-motion'
import BootSequence from './BootSequence'
import NeuralGraph from './NeuralGraph'
import ModulePlaceholder from './ModulePlaceholder'
import HUD from './HUD'
import HelpPanel from './HelpPanel'
import SettingsDrawer from './SettingsDrawer'
import AchievementsPanel from './AchievementsPanel'
import ParticleBackground from './ParticleBackground'
import Toast from './Toast'
import ShootingStar from './ShootingStar'
import HiddenQuote from './HiddenQuote'
import CuriosityPage from './CuriosityPage'
import DecisionLab from './experiences/components/DecisionLab'
import TradeoffLab from './tradeoffs/components/TradeoffLab'
import DebuggingLab from './debugging/components/DebuggingLab'
import ReviewArena from './review/components/ReviewArena'
import useBrainStore, { DEBUG_EASTER_EGGS } from './store'

const KONAMI_SEQ = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a']
const DEV_MODE_MS = 15000

export default function InsideMyMind() {
  const booted = useBrainStore((s) => s.booted)
  const activeModule = useBrainStore((s) => s.activeModule)
  const curiosityOpen = useBrainStore((s) => s.curiosityOpen)
  const openModule = useBrainStore((s) => s.openModule)
  const closeModule = useBrainStore((s) => s.closeModule)
  const showHelp = useBrainStore((s) => s.showHelp)
  const showSettings = useBrainStore((s) => s.showSettings)
  const showAchievements = useBrainStore((s) => s.showAchievements)
  const ambientGlow = useBrainStore((s) => s.ambientGlow)
  const startDeveloperMode = useBrainStore((s) => s.startDeveloperMode)
  const endDeveloperMode = useBrainStore((s) => s.endDeveloperMode)
  const recordDiscovery = useBrainStore((s) => s.recordDiscovery)
  const notify = useBrainStore((s) => s.notify)

  const konamiRef = useRef(0)
  const devTimerRef = useRef(null)

  const handleSelectModule = useCallback((id) => {
    openModule(id)
  }, [openModule])

  const handleBack = useCallback(() => {
    closeModule()
  }, [closeModule])

  useEffect(() => {
    function handleKey(e) {
      if (e.key === 'Escape' && activeModule) {
        closeModule()
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [activeModule, closeModule])

  useEffect(() => {
    function handleKonami(e) {
      const key = e.key.length === 1 ? e.key.toLowerCase() : e.key
      if (key === KONAMI_SEQ[konamiRef.current]) {
        konamiRef.current += 1
        if (DEBUG_EASTER_EGGS) {
          console.log(`[brainos] Konami ${konamiRef.current}/${KONAMI_SEQ.length}`)
        }
        if (konamiRef.current === KONAMI_SEQ.length) {
          konamiRef.current = 0
          if (devTimerRef.current) clearTimeout(devTimerRef.current)
          if (!useBrainStore.getState().developerMode) {
            startDeveloperMode()
            recordDiscovery('developer-mode')
            notify('Developer Mode Enabled')
          }
          devTimerRef.current = setTimeout(() => {
            endDeveloperMode()
            notify('Developer Mode ended')
          }, DEV_MODE_MS)
        }
      } else {
        konamiRef.current = key === KONAMI_SEQ[0] ? 1 : 0
        if (DEBUG_EASTER_EGGS && konamiRef.current === 0) {
          console.log('[brainos] Konami reset')
        }
      }
    }
    window.addEventListener('keydown', handleKonami)
    return () => {
      window.removeEventListener('keydown', handleKonami)
      if (devTimerRef.current) clearTimeout(devTimerRef.current)
    }
  }, [startDeveloperMode, endDeveloperMode, recordDiscovery, notify])

  if (!booted) {
    return <BootSequence />
  }

  return (
    <div
      className="absolute inset-0 overflow-hidden"
      style={{
        background: 'rgb(10,10,13)',
      }}
    >
      {ambientGlow && (
        <div
          className="absolute inset-0 z-[1] pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(109,92,252,0.06) 0%, transparent 70%), radial-gradient(ellipse 60% 40% at 0% 80%, rgba(109,92,252,0.03) 0%, transparent 70%), radial-gradient(ellipse 60% 40% at 100% 80%, rgba(109,92,252,0.03) 0%, transparent 70%)',
          }}
        />
      )}

      <ParticleBackground />

      <NeuralGraph onSelectModule={handleSelectModule} />

      <HUD />

      <AnimatePresence>
        {activeModule === 'problem-solving' && <DecisionLab key="lab" onBack={handleBack} />}
        {activeModule === 'tradeoffs' && <TradeoffLab key="tradeoff" onBack={handleBack} />}
        {activeModule === 'debugging' && <DebuggingLab key="debug" onBack={handleBack} />}
        {activeModule === 'architecture' && <ReviewArena key="review" onBack={handleBack} />}
        {activeModule && activeModule !== 'problem-solving' && activeModule !== 'tradeoffs' && activeModule !== 'debugging' && activeModule !== 'architecture' && (
          <ModulePlaceholder key="module" moduleId={activeModule} onBack={handleBack} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {curiosityOpen && <CuriosityPage key="curiosity" />}
      </AnimatePresence>

      <AnimatePresence>
        {showHelp && <HelpPanel key="help" />}
      </AnimatePresence>
      <AnimatePresence>
        {showSettings && <SettingsDrawer key="settings" />}
      </AnimatePresence>
      <AnimatePresence>
        {showAchievements && <AchievementsPanel key="achievements" />}
      </AnimatePresence>

      <HiddenQuote />
      <ShootingStar />
      <Toast />
    </div>
  )
}
