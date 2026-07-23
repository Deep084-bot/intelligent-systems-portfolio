import { useRef, useEffect, useCallback, useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useCosmosScroll } from './hooks/useCosmosScroll'
import { useCosmosAudio } from './hooks/useCosmosAudio'
import JourneyWorld from './scenes/JourneyWorld'

function CameraController({ progressRef }) {
  const { camera } = useThree()

  useFrame(() => {
    const progress = progressRef.current

    const minZ = 1.5
    const maxZ = 800
    const zoomProgress = Math.pow(progress, 0.65)
    const targetZ = minZ + (maxZ - minZ) * zoomProgress

    camera.position.z += (targetZ - camera.position.z) * 0.025
    camera.position.x = Math.sin(progress * Math.PI * 2) * 0.3 * (1 - progress)
    camera.position.y = Math.cos(progress * Math.PI * 1.5) * 0.15 * (1 - progress)
    camera.lookAt(0, 0, -10)
  })

  return null
}

const STAGE_LABELS = [
  { threshold: 0.08, label: 'You' },
  { threshold: 0.16, label: 'A Room' },
  { threshold: 0.26, label: 'A Building' },
  { threshold: 0.38, label: 'A City' },
  { threshold: 0.50, label: 'Earth' },
  { threshold: 0.62, label: 'The Moon' },
  { threshold: 0.74, label: 'The Sun' },
  { threshold: 0.84, label: 'The Solar System' },
  { threshold: 0.92, label: 'The Milky Way' },
  { threshold: 0.97, label: 'The Observable Universe' },
]

const ENDING_LINES = [
  { threshold: 0.970, text: 'This is everything we have ever observed.' },
  { threshold: 0.974, text: 'Somewhere inside all of this is one ordinary galaxy.' },
  { threshold: 0.978, text: 'Inside that galaxy, one ordinary star.' },
  { threshold: 0.982, text: 'Around that star, one small blue planet.' },
  { threshold: 0.986, text: 'On that planet, someone is scrolling this page.' },
  { threshold: 0.990, text: 'You.' },
  { threshold: 0.992, text: 'You are unimaginably small.' },
  { threshold: 0.994, text: 'Yet your dreams, your fears, your memories, your kindness exist nowhere else.' },
  { threshold: 0.996, text: 'The universe will never know your name.' },
  { threshold: 0.998, text: 'But someone\'s world might.' },
  { threshold: 0.999, text: 'So build something beautiful.' },
]

function EndingOverlay({ progress }) {
  const visibleLines = useMemo(() => {
    return ENDING_LINES.filter((l) => progress >= l.threshold)
  }, [progress])

  if (progress < 0.97) return null

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center px-8">
      <div className="max-w-2xl text-center space-y-5">
        {ENDING_LINES.map((line, i) => {
          const isVisible = progress >= line.threshold
          const isLast = i === visibleLines.length - 1 && i === ENDING_LINES.filter((l) => progress >= l.threshold).length - 1
          return (
            <motion.p
              key={i}
              initial={{ opacity: 0, y: 15 }}
              animate={
                isVisible
                  ? { opacity: [0, 0, 1], y: 0 }
                  : { opacity: 0, y: 15 }
              }
              transition={{ duration: 1.4, ease: 'easeOut' }}
              className="text-white/70 leading-relaxed"
              style={{
                fontFamily: '"Cormorant Garamond", Georgia, serif',
                fontSize: isLast ? 'clamp(26px, 5vw, 44px)' : 'clamp(18px, 3.5vw, 30px)',
                fontStyle: 'italic',
                fontWeight: 300,
                letterSpacing: '0.03em',
                lineHeight: 1.6,
                opacity: isVisible ? 1 : 0,
              }}
            >
              {line.text}
            </motion.p>
          )
        })}
      </div>
    </div>
  )
}

function FadeToBlack({ progress }) {
  const opacity = Math.max(0, Math.min(1, (progress - 0.995) * 200))
  return (
    <motion.div
      className="absolute inset-0 bg-black pointer-events-none z-30"
      style={{ opacity }}
    />
  )
}

export default function Cosmos({ navigate }) {
  const { progressRef, progress, setProgress } = useCosmosScroll()
  const audio = useCosmosAudio()
  const [audioActive, setAudioActive] = useState(false)
  const [showHint, setShowHint] = useState(true)

  useEffect(() => {
    if (progress > 0.02) {
      setShowHint(false)
    }
  }, [progress])

  const handleFirstInteraction = useCallback(() => {
    if (!audioActive) {
      audio.init()
      setAudioActive(true)
    }
  }, [audio, audioActive])

  useEffect(() => {
    if (audioActive) {
      audio.update(progressRef.current)
    }
  }, [progress, audioActive, audio])

  useEffect(() => {
    return () => {
      audio.stop()
    }
  }, [audio])

  const handleBack = useCallback(() => {
    navigate('/deepverse')
  }, [navigate])

  const currentLabel = useMemo(() => {
    if (progress > 0.97) return null
    let label = null
    for (const s of STAGE_LABELS) {
      if (progress < s.threshold) break
      label = s.label
    }
    return label
  }, [progress])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6 }}
      className="fixed inset-0 bg-[#020617] overflow-hidden overscroll-none touch-none cursor-grab active:cursor-grabbing"
      onClick={handleFirstInteraction}
      onTouchStart={handleFirstInteraction}
    >
      <Canvas
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: false }}
        camera={{ position: [0, 0, 2], fov: 50, near: 0.01, far: 3000 }}
        onCreated={({ gl }) => {
          gl.setClearColor('#020617')
        }}
      >
        <fog attach="fog" args={['#020617', 50, 1500]} />
        <JourneyWorld progressRef={progressRef} />
        <CameraController progressRef={progressRef} />
        <ambientLight intensity={0.15} color="#6366f1" />
      </Canvas>

      {/* Stage label — fades out during ending */}
      <motion.div
        className="absolute inset-0 pointer-events-none flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        {currentLabel && (
          <motion.h1
            key={currentLabel}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.6 }}
            className="text-white/60 text-3xl md:text-5xl font-light tracking-[0.15em] uppercase"
            style={{ fontFamily: 'system-ui, -apple-system, sans-serif', fontWeight: 200 }}
          >
            {currentLabel}
          </motion.h1>
        )}
      </motion.div>

      {/* Ending overlay */}
      <EndingOverlay progress={progress} />

      {/* Fade to black */}
      <FadeToBlack progress={progress} />

      {/* Scroll hint */}
      {showHint && (
        <motion.div
          className="absolute bottom-12 left-1/2 -translate-x-1/2 pointer-events-none z-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
            className="flex flex-col items-center gap-2"
          >
            <span className="text-white/30 text-[10px] tracking-[0.2em] uppercase">Scroll to explore</span>
            <svg className="w-3 h-3 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </motion.div>
        </motion.div>
      )}

      {/* Exit button */}
      <button
        onClick={handleBack}
        className="absolute top-5 left-5 z-20 text-[11px] text-white/25 hover:text-white/50 transition-colors focus:outline-none tracking-[0.15em] uppercase"
        style={{ fontWeight: 200 }}
      >
        ← Exit
      </button>
    </motion.div>
  )
}
