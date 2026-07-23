import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import Guitar from './components/Guitar'
import AudioEngine from './components/AudioEngine'

export default function MusicLab({ navigate }) {
  const audioEngineRef = useRef(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loadingProgress, setLoadingProgress] = useState(0)
  const [audioError, setAudioError] = useState(null)
  const [needsUserGesture, setNeedsUserGesture] = useState(false)

  useEffect(() => {
    // Create AudioEngine instance but don't initialize yet
    // (AudioContext must be created after user gesture)
    audioEngineRef.current = new AudioEngine()
    setNeedsUserGesture(true)
    setIsLoading(false)
  }, [])

  const handleEnableAudio = async () => {
    setNeedsUserGesture(false)
    setIsLoading(true)
    setLoadingProgress(0)
    setAudioError(null)

    try {
      // Initialize audio with real progress tracking
      const result = await audioEngineRef.current.init((loaded, total) => {
        setLoadingProgress(Math.round((loaded / total) * 100))
      })

      if (!result.success) {
        setAudioError(result.error || 'Failed to initialize audio')
        setIsLoading(false)
        return
      }

      setLoadingProgress(100)
      setTimeout(() => {
        setIsLoading(false)
      }, 300)
    } catch (error) {
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
              <p className="text-base text-neutral-500 max-w-lg">
                An interactive virtual acoustic guitar
              </p>
            </motion.div>
          </div>
        </header>

        <main className="flex-1 flex items-center justify-center px-6 pb-12">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-md"
          >
            <div className="text-7xl mb-8">🎸</div>
            <h2 className="text-2xl font-bold text-neutral-200 mb-4">
              Ready to Play
            </h2>
            <p className="text-neutral-400 mb-8 leading-relaxed">
              Click below to enable audio and start playing the guitar.
              Your browser requires a user interaction before sound can play.
            </p>
            <button
              onClick={handleEnableAudio}
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
          <div className="text-6xl mb-6">🎸</div>
          <h2 className="text-2xl font-bold text-neutral-200 mb-4">
            Loading audio samples...
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
            <p className="text-neutral-400 mb-6 leading-relaxed">
              {audioError}
            </p>
            <p className="text-sm text-neutral-500 mb-8">
              The guitar will still work with synthesized tones as a fallback.
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
            <p className="text-base text-neutral-500 max-w-lg">
              Click or drag across the strings to play
            </p>
          </motion.div>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-6 pb-12">
        <Guitar audioEngine={audioEngineRef.current} />
      </main>

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
