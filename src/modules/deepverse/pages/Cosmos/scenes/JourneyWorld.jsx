import { useRef, useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import StageGroup from './StageGroup'
import { STAGE_WINDOWS, mulberry32 } from './helpers'
import { getStarSprite } from './textures'
import { MotionContext, useMotionScale } from './motion'
import { endingState } from './endingState'
import { Human, Room, Building, City } from './humanScale'
import { Earth, Moon, Sun, SolarSystem, Galaxy, CosmicWeb } from './astroScale'

/* --------------------------------------------------------- DEEP STARFIELD */

// Background wash of stars that stays present for the whole journey and gives
// the empty stages (the opening "you" beat especially) something to breathe.
function DeepStarfield() {
  const ref = useRef()
  const sprite = useMemo(() => getStarSprite(), [])
  const motion = useMotionScale()

  const stars = useMemo(() => {
    const count = 2600
    const pos = new Float32Array(count * 3)
    const col = new Float32Array(count * 3)
    const rng = mulberry32(1024)
    for (let i = 0; i < count; i++) {
      const theta = rng() * Math.PI * 2
      const phi = Math.acos(2 * rng() - 1)
      const r = 220 + rng() * 320
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta)
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
      pos[i * 3 + 2] = r * Math.cos(phi)
      const w = rng()
      if (w < 0.3) { col[i * 3] = 1.0; col[i * 3 + 1] = 0.92; col[i * 3 + 2] = 0.78 }
      else if (w < 0.7) { col[i * 3] = 0.92; col[i * 3 + 1] = 0.94; col[i * 3 + 2] = 1.0 }
      else { col[i * 3] = 0.72; col[i * 3 + 1] = 0.82; col[i * 3 + 2] = 1.0 }
    }
    return { pos, col }
  }, [])

  useFrame(({ clock }) => {
    if (ref.current) {
      const t = clock.getElapsedTime() * motion
      ref.current.rotation.y = t * 0.004
      ref.current.rotation.x = Math.sin(t * 0.0008) * 0.01
      // Dim the field during the closing narrative.
      if (ref.current.material) ref.current.material.opacity = 0.85 * (1 - endingState.dim * 0.55)
    }
  })

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={stars.pos.length / 3} array={stars.pos} itemSize={3} />
        <bufferAttribute attach="attributes-color" count={stars.col.length / 3} array={stars.col} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial
        map={sprite}
        size={2.2}
        sizeAttenuation={false}
        vertexColors
        transparent
        opacity={0.85}
        depthWrite={false}
        fog={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}

/* ------------------------------------------------------------- JOURNEY */

export default function JourneyWorld({ progressRef, reducedMotion = false }) {
  // Nothing to clean beyond r3f's automatic disposal; textures are cached.
  useEffect(() => () => {}, [])

  return (
    <MotionContext.Provider value={reducedMotion ? 0 : 1}>
      <DeepStarfield />

      <StageGroup progressRef={progressRef} range={STAGE_WINDOWS.human}>
        <Human />
      </StageGroup>

      <StageGroup progressRef={progressRef} range={STAGE_WINDOWS.room}>
        <Room />
      </StageGroup>

      <StageGroup progressRef={progressRef} range={STAGE_WINDOWS.building}>
        <Building />
      </StageGroup>

      <StageGroup progressRef={progressRef} range={STAGE_WINDOWS.city}>
        <City />
      </StageGroup>

      <StageGroup progressRef={progressRef} range={STAGE_WINDOWS.earth}>
        <Earth />
      </StageGroup>

      <StageGroup progressRef={progressRef} range={STAGE_WINDOWS.moon}>
        <Moon />
      </StageGroup>

      <StageGroup progressRef={progressRef} range={STAGE_WINDOWS.sun}>
        <Sun />
      </StageGroup>

      <StageGroup progressRef={progressRef} range={STAGE_WINDOWS.solar}>
        <SolarSystem />
      </StageGroup>

      <StageGroup progressRef={progressRef} range={STAGE_WINDOWS.galaxy}>
        <Galaxy />
      </StageGroup>

      <StageGroup progressRef={progressRef} range={STAGE_WINDOWS.universe}>
        <CosmicWeb />
      </StageGroup>
    </MotionContext.Provider>
  )
}
