import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import Guitar from './components/Guitar'
import AudioEngine from './components/AudioEngine'
import FocusSessions from './components/FocusSessions'
import LocalPlaylist from './components/LocalPlaylist'
import MusicControls from '../../audio/MusicControls'

const TABS = [
  { id: 'guitar', label: 'Guitar' },
  { id: 'focus', label: 'Focus Session' },
  { id: 'music', label: 'My Music' },
]

// Minimal inline guitar silhouette icon
function GuitarIcon({ size = 64, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      {/* Guitar body */}
      <ellipse cx="32" cy="44" rx="16" ry="13" fill="rgba(200,150,80,0.25)" stroke="rgba(200,150,80,0.5)" strokeWidth="1.5" />
      {/* Waist */}
      <path d="M22 36 Q28 32 32 32 Q36 32 42 36" stroke="rgba(200,150,80,0.35)" strokeWidth="1.5" fill="none" />
      {/* Upper bout */}
      <ellipse cx="32" cy="27" rx="11" ry="9" fill="rgba(200,150,80,0.18)" stroke="rgba(200,150,80,0.4)" strokeWidth="1.5" />
      {/* Sound hole */}
      <circle cx="32" cy="44" r="5" fill="none" stroke="rgba(160,110,50,0.5)" strokeWidth="1" />
      {/* Neck */}
      <rect x="30" y="10" width="4" height="20" rx="1" fill="rgba(160,100,50,0.4)" stroke="rgba(180,120,60,0.3)" strokeWidth="0.8" />
      {/* Headstock */}
      <rect x="28" y="6" width="8" height="6" rx="1.5" fill="rgba(120,75,35,0.4)" stroke="rgba(160,100,50,0.35)" strokeWidth="0.8" />
      {/* Strings */}
      {[30, 31, 32, 33, 34].map(x => (
        <line key={x} x1={x} y1="12" x2={x} y2="50" stroke="rgba(220,200,160,0.22)" strokeWidth="0.5" />
      ))}
    </svg>
  )
}

export default function MusicLab({ navigate }) {
  const audioEngineRef = useRef(null)
  const loadTimerRef = useRef(null)
  const mountedRef = useRef(true)
  const [activeTab, setActiveTab] = useState('guitar')
  const [isLoading, setIsLoading] = useState(true)
  const [loadingProgress, setLoadingProgress] = useState(0)
  const [audioError, setAudioError] = useState(null)
  const [needsUserGesture, setNeedsUserGesture] = useState(false)

  useEffect(() => {
    mountedRef.current = true
    // Create the AudioEngine instance but don't initialize it yet (the
    // AudioContext must be created after a user gesture). Guard against
    // React StrictMode's double-invoked effect by reusing any existing
    // instance, and dispose on unmount so no second context leaks.
    if (!audioEngineRef.current) {
      audioEngineRef.current = new AudioEngine()
    }
    setNeedsUserGesture(true)
    setIsLoading(false)
    return () => {
      mountedRef.current = false
      if (loadTimerRef.current) clearTimeout(loadTimerRef.current)
      audioEngineRef.current?.dispose?.()
      audioEngineRef.current = null
    }
  }, [])

  const handleEnableAudio = async () => {
    setNeedsUserGesture(false)
    setIsLoading(true)
    setLoadingProgress(0)
    setAudioError(null)

    try {
      // Initialize audio with real progress tracking
      const result = await audioEngineRef.current.init((loaded, total) => {
        if (mountedRef.current) setLoadingProgress(Math.round((loaded / total) * 100))
      })

      if (!mountedRef.current) return

      if (!result.success) {
        setAudioError(result.error || 'Failed to initialize audio')
        setIsLoading(false)
        return
      }

      setLoadingProgress(100)
      loadTimerRef.current = setTimeout(() => {
        if (mountedRef.current) setIsLoading(false)
      }, 300)
    } catch (error) {
      if (!mountedRef.current) return
      setAudioError(error.message || 'Unexpected error loading audio')
      setIsLoading(false)
    }
  }

  const handleBack = () => {
    navigate('/deepverse')
  }

  // Initial state: Show "Enable Audio" overlay
  if (needsUserGesture) {
    return (
      <div className="relative min-h-screen bg-gradient-to-b from-neutral-950 via-neutral-900 to-neutral-950 flex flex-col overflow-hidden">
        {/* Render the guitar behind the call-to-action so the instrument is
            actually visible on first load instead of a near-black screen. It is
            inert (no pointer events) until the user enables audio. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-24 hidden sm:flex justify-center opacity-80"
        >
          <div className="w-full max-w-[1400px] px-6">
            <Guitar audioEngine={audioEngineRef.current} />
          </div>
        </div>
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-neutral-950/50" />

        <header className="relative z-10 pt-12 pb-6 px-6">
          <div className="max-w-6xl mx-auto">
            <button
              onClick={handleBack}
              className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-300 transition-colors mb-6 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/50 rounded px-2 py-1 -ml-2"
            >
              <span aria-hidden="true">←</span>
              <span>Back to DeepVerse</span>
            </button>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h1 className="text-4xl sm:text-5xl font-bold text-neutral-50 tracking-tight mb-3">
                Music Lab
              </h1>
              <p className="text-base text-neutral-500 max-w-lg">
                An interactive virtual acoustic guitar
              </p>
            </motion.div>
          </div>
        </header>

        <main className="relative z-10 flex-1 flex items-center justify-center px-6 pb-12">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-md rounded-3xl border border-neutral-800/70 bg-neutral-950/75 backdrop-blur-sm px-8 py-10 shadow-2xl shadow-black/40"
          >
            <GuitarIcon size={64} className="mx-auto mb-6 opacity-80" />
            <h2 className="text-2xl font-bold text-neutral-200 mb-4">
              Ready to Play
            </h2>
            <p className="text-neutral-400 mb-8 leading-relaxed">
              Click below to enable audio and start playing the guitar.
              Your browser requires a user interaction before sound can play.
            </p>
            <button
              onClick={handleEnableAudio}
              data-testid="enable-audio"
              className="px-8 py-4 bg-gradient-to-r from-primary-500 to-accent-400 text-white font-medium rounded-lg hover:shadow-lg hover:shadow-primary-500/30 transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/50"
            >
              Enable Audio
            </button>
          </motion.div>
        </main>
      </div>
    )
  }

  // Loading state: Show real progress
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-neutral-950 via-neutral-900 to-neutral-950 flex flex-col items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <GuitarIcon size={64} className="mx-auto mb-6 opacity-70" />
          <h2 className="text-2xl font-bold text-neutral-200 mb-4">
            Tuning the strings…
          </h2>
          <div className="w-64 h-1 bg-neutral-800 rounded-full overflow-hidden mb-3">
            <motion.div
              className="h-full bg-gradient-to-r from-primary-500 to-accent-400"
              initial={{ width: 0 }}
              animate={{ width: `${loadingProgress}%` }}
              transition={{ duration: 0.2 }}
            />
          </div>
          <p className="text-sm text-neutral-500">{loadingProgress}%</p>
          <p className="text-xs text-neutral-600 mt-3">
            Preparing the fretboard and strings
          </p>
        </motion.div>
      </div>
    )
  }

  // Error state: Show clear message
  if (audioError) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-neutral-950 via-neutral-900 to-neutral-950 flex flex-col">
        <header className="relative z-20 pt-12 pb-6 px-6">
          <div className="max-w-6xl mx-auto">
            <button
              onClick={handleBack}
              className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-300 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/50 rounded px-2 py-1 -ml-2"
            >
              <span aria-hidden="true">←</span>
              <span>Back to DeepVerse</span>
            </button>
          </div>
        </header>

        <main className="flex-1 flex items-center justify-center px-6 pb-12">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center max-w-md"
          >
            <div className="text-6xl mb-6">⚠️</div>
            <h2 className="text-2xl font-bold text-neutral-200 mb-4">
              Audio Unavailable
            </h2>
            <p className="text-neutral-400 mb-4 leading-relaxed">
              {audioError}
            </p>
            <p className="text-sm text-neutral-500 mb-8 leading-relaxed">
              The guitar needs the browser&apos;s Web Audio engine to make sound.
              Make sure your device isn&apos;t muted and that audio is allowed for
              this site, then try again.
            </p>
            <button
              onClick={() => {
                setAudioError(null)
                setNeedsUserGesture(true)
              }}
              className="px-6 py-3 bg-neutral-800 text-neutral-200 rounded-lg hover:bg-neutral-700 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/50"
            >
              Try Again
            </button>
          </motion.div>
        </main>
      </div>
    )
  }

  // Ready state: Show guitar
  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-950 via-neutral-900 to-neutral-950 flex flex-col">
      <header className="relative z-20 pt-12 pb-6 px-6">
        <div className="max-w-6xl mx-auto">
          <button
            onClick={handleBack}
            className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-300 transition-colors mb-6 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/50 rounded px-2 py-1 -ml-2"
          >
            <span aria-hidden="true">←</span>
            <span>Back to DeepVerse</span>
          </button>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-4xl sm:text-5xl font-bold text-neutral-50 tracking-tight mb-3">
              Music Lab
            </h1>
            <p className="text-base text-neutral-500 max-w-lg hidden sm:block">
              Play the guitar, run a focus session, or bring your own music
            </p>
            <p className="text-base text-neutral-500 max-w-lg sm:hidden">
              Play the guitar, focus, or bring your own music
            </p>
          </motion.div>
        </div>
      </header>

      <div className="relative z-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div role="tablist" aria-label="Music Lab sections" className="flex flex-wrap gap-2 border-b border-neutral-800 pb-3">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                id={`musiclab-tab-${tab.id}`}
                aria-selected={activeTab === tab.id}
                aria-controls={`musiclab-panel-${tab.id}`}
                data-testid={`musiclab-tab-${tab.id}`}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 text-sm rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/50 ${
                  activeTab === tab.id
                    ? 'bg-primary-500/20 text-primary-100'
                    : 'text-neutral-400 hover:text-neutral-100 hover:bg-neutral-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <main className="flex-1 px-6 pt-6 pb-4">
        <div
          id={`musiclab-panel-${activeTab}`}
          role="tabpanel"
          aria-labelledby={`musiclab-tab-${activeTab}`}
          className="max-w-6xl mx-auto"
        >
          {activeTab === 'guitar' && (
            <div className="flex items-center justify-center">
              <Guitar audioEngine={audioEngineRef.current} />
            </div>
          )}
          {activeTab === 'focus' && <FocusSessions />}
          {activeTab === 'music' && <LocalPlaylist />}
        </div>
      </main>

      {/* Preset player — the same shared engine DeepPet controls */}
      <section aria-label="Music player" className="relative z-20 px-6 pb-10">
        <div className="mx-auto w-full max-w-2xl">
          <MusicControls variant="full" />
        </div>
      </section>

      <footer className="relative z-20 pb-8 px-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 1 }}
          className="max-w-6xl mx-auto text-center"
        >
          <p className="text-xs text-neutral-600 tracking-wide">
            Standard tuning: E A D G B E
          </p>
        </motion.div>
      </footer>
    </div>
  )
}

