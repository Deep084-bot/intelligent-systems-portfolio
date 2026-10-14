import { useRef, useEffect, useCallback, useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useCosmosScroll } from './hooks/useCosmosScroll'
import { useCosmosAudio } from './hooks/useCosmosAudio'
import JourneyWorld from './scenes/JourneyWorld'
import CinematicEnding from './components/CinematicEnding'
import { progressToMeters, metersToLabel } from './utils/scaleMapping'
import { lerp, smoothstep } from './utils/lerp'

// Camera keyframes — one framing per stage. The stages all live at the origin
// (each authored at its own comfortable scale); the camera does the travelling,
// which lets a 1.8 m human and a 10^21 m galaxy share the same coordinate space.
const CAMERA_KEYS = [
  { t: 0.0, pos: [0.9, 1.55, 2.9], look: [0, 1.3, 0] },   // you
  { t: 0.1, pos: [0, 1.6, 5.6], look: [0, 1.1, -0.5] },    // leaving the figure
  { t: 0.15, pos: [0.4, 1.5, 5.0], look: [0.4, 1.0, -0.7] },// room
  { t: 0.245, pos: [7, 14, 30], look: [0, 14, 0] },        // building
  { t: 0.36, pos: [0, 60, 118], look: [0, 0, 0] },         // city
  { t: 0.5, pos: [0, 0.8, 6.5], look: [0, 0, 0] },         // earth
  { t: 0.61, pos: [0, 1.4, 8], look: [0, 0, 0] },          // moon
  { t: 0.73, pos: [0, 0, 16], look: [0, 0, 0] },           // sun
  { t: 0.85, pos: [0, 13, 30], look: [0, 0, 0] },          // solar system
  { t: 0.92, pos: [0, 24, 60], look: [0, 0, 0] },          // galaxy
  { t: 0.98, pos: [0, 18, 78], look: [0, 0, 0] },          // observable universe
  { t: 1.0, pos: [0, 10, 105], look: [0, 0, 0] },          // final drift out
]

const _tmpPos = new THREE.Vector3()
const _tmpLook = new THREE.Vector3()

function sampleCamera(progress, outPos, outLook) {
  const keys = CAMERA_KEYS
  if (progress <= keys[0].t) {
    outPos.set(...keys[0].pos)
    outLook.set(...keys[0].look)
    return
  }
  const last = keys[keys.length - 1]
  if (progress >= last.t) {
    outPos.set(...last.pos)
    outLook.set(...last.look)
    return
  }
  let i = 0
  while (i < keys.length - 1 && progress > keys[i + 1].t) i++
  const a = keys[i]
  const b = keys[i + 1]
  const span = b.t - a.t || 1
  const e = smoothstep(0, 1, (progress - a.t) / span)
  outPos.set(lerp(a.pos[0], b.pos[0], e), lerp(a.pos[1], b.pos[1], e), lerp(a.pos[2], b.pos[2], e))
  outLook.set(lerp(a.look[0], b.look[0], e), lerp(a.look[1], b.look[1], e), lerp(a.look[2], b.look[2], e))
}

function CameraController({ progressRef, reducedMotion }) {
  const { camera } = useThree()
  const look = useRef(new THREE.Vector3(0, 1.3, 0))

  useFrame(({ clock }) => {
    const p = progressRef.current
    sampleCamera(p, _tmpPos, _tmpLook)
    const damp = reducedMotion ? 0.25 : 0.07
    camera.position.lerp(_tmpPos, damp)
    look.current.lerp(_tmpLook, damp)
    if (!reducedMotion) {
      const t = clock.getElapsedTime()
      camera.position.x += Math.sin(t * 0.25) * 0.012
      camera.position.y += Math.cos(t * 0.2) * 0.008
    }
    camera.lookAt(look.current)
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

const ENDING_AT = 0.94

export default function Cosmos({ navigate }) {
  const { progressRef, progress, setProgress } = useCosmosScroll()
  const audio = useCosmosAudio()
  const [audioActive, setAudioActive] = useState(false)
  const [showHint, setShowHint] = useState(true)

  const reducedMotion = useMemo(
    () => typeof window !== 'undefined' && window.matchMedia
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false,
    []
  )

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
    if (progress >= ENDING_AT - 0.01) return null
    let label = null
    for (const s of STAGE_LABELS) {
      if (progress < s.threshold) break
      label = s.label
    }
    return label
  }, [progress])

  // Live distance readout. scaleMapping.js was present but unused; wire it up so
  // the journey conveys an actual sense of scale. Hidden once the ending begins
  // so it never competes with the closing narrative.
  const distanceLabel = useMemo(() => metersToLabel(progressToMeters(progress)), [progress])
  const showDistance = progress > 0.02 && progress < ENDING_AT - 0.02

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
        camera={{ position: [0.9, 1.55, 2.9], fov: 50, near: 0.05, far: 5000 }}
        onCreated={({ gl }) => {
          gl.setClearColor('#020617')
        }}
      >
        <fog attach="fog" args={['#020617', 150, 3600]} />
        <JourneyWorld progressRef={progressRef} reducedMotion={reducedMotion} />
        <CameraController progressRef={progressRef} reducedMotion={reducedMotion} />
        {/* Ambient wash. Each stage layers its own motivated lights on top. */}
        <ambientLight intensity={0.16} color="#5b6cff" />
        <hemisphereLight intensity={0.35} color="#2a3a6b" groundColor="#05070f" />
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

      {/* Closing narrative + return action (sequenced, non-overlapping). */}
      <CinematicEnding
        progress={progress}
        reducedMotion={reducedMotion}
        onReturn={handleBack}
      />

      {/* Distance readout */}
      {showDistance && (
        <div
          data-testid="cosmos-distance"
          className="absolute bottom-5 right-5 z-20 text-right pointer-events-none"
        >
          <div className="text-[10px] text-white/30 tracking-[0.2em] uppercase">Distance from you</div>
          <div className="text-sm text-white/60 font-mono tabular-nums">{distanceLabel}</div>
        </div>
      )}

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

      {/* Exit button — kept above the dim layer so it is never trapped */}
      <button
        onClick={handleBack}
        data-testid="cosmos-exit"
        className="absolute top-5 left-5 z-30 text-[11px] text-white/25 hover:text-white/50 transition-colors focus:outline-none tracking-[0.15em] uppercase"
        style={{ fontWeight: 200 }}
      >
        ← Exit
      </button>
    </motion.div>
  )
}
