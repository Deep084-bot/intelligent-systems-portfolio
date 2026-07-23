import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

function smoothStep(edge0, edge1, x) {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)))
  return t * t * (3 - 2 * t)
}

export default function JourneyWorld({ progressRef }) {
  return (
    <>
      <HumanSilhouette progressRef={progressRef} />
      <RoomSpace progressRef={progressRef} />
      <SingleBuilding progressRef={progressRef} />
      <CityGrid progressRef={progressRef} />
      <EarthGlobe progressRef={progressRef} />
      <MoonOrbit progressRef={progressRef} />
      <SunCore progressRef={progressRef} />
      <SolarSystemView progressRef={progressRef} />
      <GalaxySpiral progressRef={progressRef} />
      <CosmicWeb progressRef={progressRef} />
      <DeepStarfield />
    </>
  )
}

/* =============================================
   YOU
   A tiny figure in darkness.
   Barely visible. Breathing. Alone.
   Soft glow beneath feet. A few distant stars.
   ============================================= */

function HumanSilhouette({ progressRef }) {
  const groupRef = useRef()
  const glowRef = useRef()
  const armLRef = useRef()
  const armRRef = useRef()

  const getVisibility = () => 1 - smoothStep(0.06, 0.12, progressRef.current)

  useFrame(({ clock }) => {
    const visibility = getVisibility()
    if (groupRef.current) {
      groupRef.current.visible = visibility > 0.01
      const breath = Math.sin(clock.getElapsedTime() * 0.6) * 0.01
      groupRef.current.position.y = breath
    }
    if (armLRef.current) {
      armLRef.current.rotation.z = Math.sin(clock.getElapsedTime() * 0.5) * 0.02 - 0.08
    }
    if (armRRef.current) {
      armRRef.current.rotation.z = -Math.sin(clock.getElapsedTime() * 0.5) * 0.02 + 0.08
    }
    if (glowRef.current) {
      const pulse = 0.5 + 0.5 * Math.sin(clock.getElapsedTime() * 0.4)
      glowRef.current.material.opacity = visibility * 0.1 * pulse
    }
  })

  const visibility = getVisibility()
  if (visibility <= 0.01) return null

  return (
    <group ref={groupRef}>
      {/* Body */}
      <mesh>
        <capsuleGeometry args={[0.04, 0.2, 4, 8]} />
        <meshBasicMaterial color="#e2e8f0" transparent opacity={visibility * 0.7} />
      </mesh>
      {/* Head */}
      <mesh position={[0, 0.23, 0]}>
        <sphereGeometry args={[0.05, 12, 12]} />
        <meshBasicMaterial color="#f1f5f9" transparent opacity={visibility * 0.8} />
      </mesh>
      {/* Left arm */}
      <mesh ref={armLRef} position={[-0.07, 0.1, 0]}>
        <capsuleGeometry args={[0.015, 0.1, 4, 6]} />
        <meshBasicMaterial color="#e2e8f0" transparent opacity={visibility * 0.6} />
      </mesh>
      {/* Right arm */}
      <mesh ref={armRRef} position={[0.07, 0.1, 0]}>
        <capsuleGeometry args={[0.015, 0.1, 4, 6]} />
        <meshBasicMaterial color="#e2e8f0" transparent opacity={visibility * 0.6} />
      </mesh>
      {/* Ground glow */}
      <mesh ref={glowRef} position={[0, -0.18, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.25, 16]} />
        <meshBasicMaterial color="#60a5fa" transparent opacity={0} depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>
    </group>
  )
}

/* =============================================
   ROOM
   The space around the person assembles.
   Walls, floor, desk, chair, window.
   Warm light from above.
   ============================================= */

function RoomSpace({ progressRef }) {
  const groupRef = useRef()
  const lightRef = useRef()
  const lampGlowRef = useRef()

  const getVisibility = () => {
    const p = progressRef.current
    const fadeIn = smoothStep(0.06, 0.10, p)
    const fadeOut = 1 - smoothStep(0.15, 0.20, p)
    return fadeIn * fadeOut
  }

  useFrame(({ clock }) => {
    const visibility = getVisibility()
    if (groupRef.current) {
      groupRef.current.visible = visibility > 0.01
    }
    if (lightRef.current) {
      const pulse = 0.8 + 0.2 * Math.sin(clock.getElapsedTime() * 0.6)
      lightRef.current.material.opacity = visibility * 0.15 * pulse
    }
    if (lampGlowRef.current) {
      const pulse = 0.6 + 0.4 * Math.sin(clock.getElapsedTime() * 0.8)
      lampGlowRef.current.material.opacity = visibility * 0.04 * pulse
    }
  })

  const visibility = getVisibility()
  if (visibility <= 0.01) return null

  const hw = 0.5
  const hh = 0.35
  const hd = 0.5

  return (
    <group ref={groupRef}>
      {/* Back wall */}
      <mesh position={[0, 0, -hd]}>
        <planeGeometry args={[hw * 2, hh * 2]} />
        <meshBasicMaterial color="#1e293b" transparent opacity={visibility * 0.5} side={THREE.DoubleSide} />
      </mesh>
      {/* Left wall */}
      <mesh position={[-hw, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[hd * 2, hh * 2]} />
        <meshBasicMaterial color="#1e293b" transparent opacity={visibility * 0.35} side={THREE.DoubleSide} />
      </mesh>
      {/* Right wall */}
      <mesh position={[hw, 0, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[hd * 2, hh * 2]} />
        <meshBasicMaterial color="#1e293b" transparent opacity={visibility * 0.35} side={THREE.DoubleSide} />
      </mesh>
      {/* Floor */}
      <mesh position={[0, -hh, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[hw * 2, hd * 2]} />
        <meshBasicMaterial color="#0f172a" transparent opacity={visibility * 0.3} />
      </mesh>
      {/* Window — lit opening on back wall */}
      <mesh position={[0, 0.04, -hd - 0.005]}>
        <planeGeometry args={[0.2, 0.25]} />
        <meshBasicMaterial color="#1e1b4b" transparent opacity={visibility * 0.4} />
      </mesh>
      {/* Desk */}
      <mesh position={[0.12, -0.22, -0.2]}>
        <boxGeometry args={[0.18, 0.008, 0.1]} />
        <meshBasicMaterial color="#334155" transparent opacity={visibility * 0.5} />
      </mesh>
      <mesh position={[0.12, -0.28, -0.2]}>
        <boxGeometry args={[0.16, 0.12, 0.008]} />
        <meshBasicMaterial color="#334155" transparent opacity={visibility * 0.4} />
      </mesh>
      {/* Chair */}
      <mesh position={[0.25, -0.28, 0.05]}>
        <boxGeometry args={[0.1, 0.01, 0.08]} />
        <meshBasicMaterial color="#475569" transparent opacity={visibility * 0.4} />
      </mesh>
      <mesh position={[0.25, -0.18, 0.09]}>
        <boxGeometry args={[0.1, 0.18, 0.01]} />
        <meshBasicMaterial color="#475569" transparent opacity={visibility * 0.3} />
      </mesh>
      {/* Warm ceiling light */}
      <mesh ref={lightRef} position={[0, hh, 0]}>
        <planeGeometry args={[0.04, 0.04]} />
        <meshBasicMaterial color="#fbbf24" transparent opacity={0} depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>
      {/* Ceiling lamp glow */}
      <mesh ref={lampGlowRef} position={[0, hh - 0.02, 0]}>
        <planeGeometry args={[0.2, 0.15]} />
        <meshBasicMaterial color="#fde68a" transparent opacity={0} depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>
    </group>
  )
}

/* =============================================
   BUILDING
   The camera exits through the window.
   Reveal a multi-story facade.
   Glowing windows. Neighboring buildings.
   Rooftop visible. Atmospheric haze.
   ============================================= */

function SingleBuilding({ progressRef }) {
  const groupRef = useRef()
  const bgRef = useRef()

  const floors = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => ({
      y: -1.5 + i * 0.35,
      windows: Array.from({ length: 5 }, () => ({
        lit: Math.random() > 0.35,
        warmth: 0.6 + Math.random() * 0.4,
      })),
    }))
  }, [])

  const neighbors = useMemo(() => {
    return Array.from({ length: 4 }, (_, i) => ({
      x: (i < 2 ? -1 : 1) * (0.8 + Math.random() * 0.3),
      h: 2 + Math.random() * 1.5,
      w: 0.3 + Math.random() * 0.15,
      d: 0.3 + Math.random() * 0.1,
      z: (i % 2 === 0 ? -0.3 : 0.3) + (Math.random() - 0.5) * 0.1,
    }))
  }, [])

  const getVisibility = () => {
    const p = progressRef.current
    const fadeIn = smoothStep(0.14, 0.18, p)
    const fadeOut = 1 - smoothStep(0.24, 0.30, p)
    return fadeIn * fadeOut
  }

  useFrame(({ clock }) => {
    const p = progressRef.current
    const visibility = getVisibility()
    if (groupRef.current) {
      groupRef.current.visible = visibility > 0.01
      const shrink = 1 - smoothStep(0.20, 0.30, p) * 0.5
      groupRef.current.scale.setScalar(shrink)
      groupRef.current.rotation.y = Math.sin(clock.getElapsedTime() * 0.1) * 0.02
    }
    if (bgRef.current) {
      bgRef.current.material.opacity = visibility * 0.06
    }
  })

  const visibility = getVisibility()
  if (visibility <= 0.01) return null

  return (
    <group ref={groupRef}>
      {/* Main building facade */}
      <mesh>
        <boxGeometry args={[0.8, 4.2, 0.01]} />
        <meshBasicMaterial color="#0f172a" transparent opacity={visibility * 0.7} />
      </mesh>
      {/* Building side */}
      <mesh position={[0, 0, 0.15]}>
        <boxGeometry args={[0.78, 4.1, 0.3]} />
        <meshBasicMaterial color="#0b1120" transparent opacity={visibility * 0.3} />
      </mesh>
      {/* Rooftop edge */}
      <mesh position={[0, 2.15, 0]}>
        <boxGeometry args={[0.85, 0.03, 0.35]} />
        <meshBasicMaterial color="#1e293b" transparent opacity={visibility * 0.4} />
      </mesh>
      {/* Windows */}
      {floors.map((floor, fi) =>
        floor.windows.map((win, wi) => {
          const x = -0.3 + wi * 0.15
          return (
            <mesh key={`${fi}-${wi}`} position={[x, floor.y, 0.01]}>
              <planeGeometry args={[0.06, 0.1]} />
              <meshBasicMaterial
                color={win.lit ? '#fbbf24' : '#1e293b'}
                transparent
                opacity={win.lit ? visibility * 0.6 * win.warmth : visibility * 0.1}
              />
            </mesh>
          )
        })
      )}
      {/* Building glow */}
      <mesh position={[0, 0, 0]}>
        <planeGeometry args={[1.0, 4.5]} />
        <meshBasicMaterial color="#fbbf24" transparent opacity={visibility * 0.03} depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>
      {/* Neighboring buildings silhouettes */}
      {neighbors.map((nb, i) => (
        <mesh key={`nb-${i}`} position={[nb.x, nb.h / 2 - 1.5, nb.z]}>
          <boxGeometry args={[nb.w, nb.h, nb.d]} />
          <meshBasicMaterial color="#0f172a" transparent opacity={visibility * 0.25} />
        </mesh>
      ))}
      {/* Atmospheric haze */}
      <mesh ref={bgRef} position={[0, 0, -0.5]}>
        <planeGeometry args={[3, 5]} />
        <meshBasicMaterial color="#1e1b4b" transparent opacity={0} depthWrite={false} />
      </mesh>
    </group>
  )
}

/* =============================================
   CITY
   Layered skyline with depth.
   Tall buildings foreground, shorter midground,
   distant silhouettes background.
   Glowing windows. Road hints. Fog.
   ============================================= */

function CityGrid({ progressRef }) {
  const groupRef = useRef()
  const fogRef = useRef()

  const layers = useMemo(() => {
    const result = []
    const configs = [
      { count: 12, radius: 2.5, minH: 1.0, maxH: 3.0, opacity: 0.5 },
      { count: 18, radius: 4.5, minH: 0.6, maxH: 2.0, opacity: 0.3 },
      { count: 24, radius: 7.0, minH: 0.3, maxH: 1.2, opacity: 0.15 },
    ]
    configs.forEach((cfg) => {
      for (let i = 0; i < cfg.count; i++) {
        const angle = Math.random() * Math.PI * 2
        const dist = cfg.radius * (0.7 + Math.random() * 0.3)
        result.push({
          x: Math.cos(angle) * dist,
          z: Math.sin(angle) * dist,
          h: cfg.minH + Math.random() * (cfg.maxH - cfg.minH),
          w: 0.08 + Math.random() * 0.15,
          opacity: cfg.opacity,
          lit: Math.random() > 0.4,
        })
      }
    })
    return result
  }, [])

  const getVisibility = () => {
    const p = progressRef.current
    const fadeIn = smoothStep(0.22, 0.28, p)
    const fadeOut = 1 - smoothStep(0.36, 0.44, p)
    return fadeIn * fadeOut
  }

  useFrame(({ clock }) => {
    const p = progressRef.current
    const visibility = getVisibility()
    if (groupRef.current) {
      groupRef.current.visible = visibility > 0.01
      const shrink = 1 - smoothStep(0.38, 0.48, p) * 0.6
      groupRef.current.scale.setScalar(shrink)
    }
    if (fogRef.current) {
      const pulse = 0.7 + 0.3 * Math.sin(clock.getElapsedTime() * 0.15)
      fogRef.current.material.opacity = visibility * 0.04 * pulse
    }
  })

  const visibility = getVisibility()
  if (visibility <= 0.01) return null

  return (
    <group ref={groupRef}>
      {/* City fog layer */}
      <mesh ref={fogRef} position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[16, 16]} />
        <meshBasicMaterial color="#1e1b4b" transparent opacity={0} depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>
      {/* Buildings */}
      {layers.map((b, i) => (
        <mesh key={i} position={[b.x, b.h / 2 - 1.5, b.z]}>
          <boxGeometry args={[b.w, b.h, b.w]} />
          <meshBasicMaterial color="#0f172a" transparent opacity={visibility * b.opacity} />
          {/* Window light */}
          {b.lit && (
            <mesh position={[0, b.h * 0.3, b.w / 2 + 0.005]}>
              <planeGeometry args={[b.w * 0.4, b.h * 0.03]} />
              <meshBasicMaterial color="#fbbf24" transparent opacity={visibility * 0.25 * b.opacity} />
            </mesh>
          )}
        </mesh>
      ))}
    </group>
  )
}

/* =============================================
   EARTH
   Atmosphere, clouds, night lights, rotation.
   Surface texture via procedural noise.
   Blue glow against darkness.
   ============================================= */

function createEarthTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 256
  const ctx = canvas.getContext('2d')

  for (let y = 0; y < 256; y++) {
    for (let x = 0; x < 512; x++) {
      const nx = x / 512
      const ny = y / 256
      const n = Math.sin(nx * 25 + ny * 18) * 0.3 +
                Math.sin(nx * 40 + ny * 30 + 1.2) * 0.2 +
                Math.sin(nx * 60 + ny * 50 + 3.0) * 0.1 +
                0.4
      const isLand = n > 0.52
      const lat = Math.abs(ny - 0.5) * 2
      const polar = lat > 0.85 ? 1 : 0

      let r, g, b
      if (polar > 0.5) {
        r = 230; g = 235; b = 245
      } else if (isLand) {
        const shade = 0.5 + n * 0.5
        r = 40 + shade * 80
        g = 70 + shade * 100
        b = 25 + shade * 40
      } else {
        const depth = 0.3 + (1 - n) * 0.4
        r = 15 * depth
        g = 45 * depth
        b = 130 * depth
      }

      ctx.fillStyle = `rgb(${r|0},${g|0},${b|0})`
      ctx.fillRect(x, y, 1, 1)
    }
  }

  const tex = new THREE.CanvasTexture(canvas)
  tex.wrapS = THREE.RepeatWrapping
  tex.wrapT = THREE.ClampToEdgeWrapping
  tex.needsUpdate = true
  return tex
}

function createCloudTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 128
  const ctx = canvas.getContext('2d')

  for (let y = 0; y < 128; y++) {
    for (let x = 0; x < 256; x++) {
      const nx = x / 256
      const ny = y / 128
      const n = Math.sin(nx * 10 + ny * 7) * 0.3 +
                Math.sin(nx * 18 + ny * 14 + 1.5) * 0.2 +
                Math.sin(nx * 30 + ny * 24 + 4.0) * 0.15 +
                0.5
      const alpha = Math.max(0, (n - 0.45) * 2) * 0.35
      ctx.fillStyle = `rgba(255,255,255,${alpha})`
      ctx.fillRect(x, y, 1, 1)
    }
  }

  const tex = new THREE.CanvasTexture(canvas)
  tex.wrapS = THREE.RepeatWrapping
  tex.wrapT = THREE.ClampToEdgeWrapping
  tex.needsUpdate = true
  return tex
}

function EarthGlobe({ progressRef }) {
  const groupRef = useRef()
  const cloudRef = useRef()
  const atmoRef = useRef()
  const glowRef = useRef()

  const textures = useMemo(() => ({
    earth: createEarthTexture(),
    cloud: createCloudTexture(),
  }), [])

  const getVisibility = () => {
    const p = progressRef.current
    const fadeIn = smoothStep(0.34, 0.42, p)
    const fadeOut = 1 - smoothStep(0.52, 0.60, p)
    return fadeIn * fadeOut
  }

  useFrame(({ clock }) => {
    const p = progressRef.current
    const visibility = getVisibility()
    if (groupRef.current) {
      groupRef.current.visible = visibility > 0.01
      groupRef.current.rotation.y = clock.getElapsedTime() * 0.08
      const shrink = 1 - smoothStep(0.50, 0.60, p) * 0.5
      groupRef.current.scale.setScalar(shrink)
    }
    if (cloudRef.current) {
      cloudRef.current.rotation.y = clock.getElapsedTime() * 0.12
    }
    if (atmoRef.current) {
      const pulse = 0.6 + 0.4 * Math.sin(clock.getElapsedTime() * 0.4)
      atmoRef.current.material.opacity = visibility * 0.15 * pulse
    }
    if (glowRef.current) {
      const pulse = 0.5 + 0.5 * Math.sin(clock.getElapsedTime() * 0.2)
      glowRef.current.material.opacity = visibility * 0.03 * pulse
    }
  })

  const visibility = getVisibility()
  if (visibility <= 0.01) return null

  return (
    <group ref={groupRef}>
      {/* Earth surface */}
      <mesh>
        <sphereGeometry args={[2.5, 48, 48]} />
        <meshBasicMaterial map={textures.earth} transparent opacity={visibility * 0.9} />
      </mesh>
      {/* Cloud layer */}
      <mesh ref={cloudRef}>
        <sphereGeometry args={[2.55, 32, 32]} />
        <meshBasicMaterial map={textures.cloud} transparent opacity={visibility * 0.3} depthWrite={false} />
      </mesh>
      {/* Atmosphere */}
      <mesh ref={atmoRef}>
        <sphereGeometry args={[2.8, 32, 32]} />
        <meshBasicMaterial color="#60a5fa" transparent opacity={0} depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>
      {/* Outer glow */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[3.5, 16, 16]} />
        <meshBasicMaterial color="#3b82f6" transparent opacity={0} depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>
    </group>
  )
}

/* =============================================
   MOON
   Earth visible as companion.
   Moon surface with crater texture.
   Orbit ring. Scale becomes apparent.
   Dark space, no flat background.
   ============================================= */

function MoonOrbit({ progressRef }) {
  const moonRef = useRef()
  const earthRef = useRef()
  const glowRef = useRef()

  const getVisibility = () => {
    const p = progressRef.current
    const fIn = smoothStep(0.46, 0.54, p)
    const fOut = 1 - smoothStep(0.62, 0.70, p)
    return fIn * fOut
  }

  useFrame(({ clock }) => {
    const v = getVisibility()
    if (moonRef.current && v > 0.01) {
      const angle = clock.getElapsedTime() * 0.3
      moonRef.current.position.x = Math.cos(angle) * 5
      moonRef.current.position.z = Math.sin(angle) * 5
    }
    if (earthRef.current) {
      const angle = clock.getElapsedTime() * 0.05
      earthRef.current.position.x = Math.cos(angle) * 0.5
      earthRef.current.position.z = Math.sin(angle) * 0.5
    }
    if (glowRef.current) {
      glowRef.current.material.opacity = v * 0.04
    }
  })

  const v = getVisibility()
  if (v <= 0.01) return null

  return (
    <group>
      {/* Orbit ring */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[4.85, 5.15, 48]} />
        <meshBasicMaterial color="#94a3b8" transparent opacity={v * 0.08} side={THREE.DoubleSide} />
      </mesh>
      {/* Moon */}
      <group ref={moonRef}>
        <mesh>
          <sphereGeometry args={[0.5, 32, 32]} />
          <meshBasicMaterial color="#c8c8d2" transparent opacity={v * 0.8} />
        </mesh>
        <mesh>
          <sphereGeometry args={[0.51, 24, 24]} />
          <meshBasicMaterial color="#94a3b8" transparent opacity={v * 0.15} />
        </mesh>
      </group>
      {/* Earth companion */}
      <mesh ref={earthRef} position={[3, 0.3, 2]}>
        <sphereGeometry args={[0.18, 16, 16]} />
        <meshBasicMaterial color="#3b82f6" transparent opacity={v * 0.4} />
      </mesh>
      {/* Moon glow */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[0.7, 12, 12]} />
        <meshBasicMaterial color="#818cf8" transparent opacity={0} depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>
    </group>
  )
}

/* =============================================
   SUN
   Warm, dominant presence.
   Layered corona with different pulses.
   Small particles surfacing.
   Orange-amber palette.
   ============================================= */

function SunCore({ progressRef }) {
  const groupRef = useRef()
  const particlesRef = useRef()

  const particlePositions = useMemo(() => {
    const count = 300
    const pos = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      const r = 3.5 + Math.random() * 4
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta)
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta) * 0.3
      pos[i * 3 + 2] = r * Math.cos(phi)
    }
    return pos
  }, [])

  const getVisibility = () => {
    const p = progressRef.current
    const fIn = smoothStep(0.58, 0.66, p)
    const fOut = 1 - smoothStep(0.78, 0.84, p)
    return fIn * fOut
  }

  useFrame(({ clock }) => {
    const v = getVisibility()
    if (groupRef.current) {
      groupRef.current.visible = v > 0.01
      const breath = 0.97 + 0.03 * Math.sin(clock.getElapsedTime() * 1.5)
      groupRef.current.scale.setScalar(breath)
    }
    if (particlesRef.current) {
      particlesRef.current.rotation.y = clock.getElapsedTime() * 0.02
      particlesRef.current.material.opacity = v * 0.2
    }
  })

  const v = getVisibility()
  if (v <= 0.01) return null

  return (
    <group ref={groupRef} position={[0, 0, -25]}>
      {/* Core */}
      <mesh>
        <sphereGeometry args={[3.5, 32, 32]} />
        <meshBasicMaterial color="#f59e0b" transparent opacity={v * 0.9} />
      </mesh>
      {/* Inner corona */}
      <mesh>
        <sphereGeometry args={[4.5, 24, 24]} />
        <meshBasicMaterial color="#f97316" transparent opacity={v * 0.25} depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>
      {/* Mid corona */}
      <mesh>
        <sphereGeometry args={[6.0, 24, 24]} />
        <meshBasicMaterial color="#ef4444" transparent opacity={v * 0.1} depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>
      {/* Outer glow */}
      <mesh>
        <sphereGeometry args={[8.0, 16, 16]} />
        <meshBasicMaterial color="#dc2626" transparent opacity={v * 0.04} depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>
      {/* Surface particles */}
      <points ref={particlesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={particlePositions.length / 3}
            array={particlePositions}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.04}
          color="#fbbf24"
          transparent
          opacity={0}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          sizeAttenuation
        />
      </points>
    </group>
  )
}

/* =============================================
   SOLAR SYSTEM
   Spacing conveys scale.
   Mercury close, outer planets distant.
   Saturn with rings stands out.
   Varied colors, sizes, orbits.
   ============================================= */

function SolarSystemView({ progressRef }) {
  const groupRef = useRef()
  const planetRefs = useRef([])
  const ringRef = useRef()

  const planets = useMemo(() => [
    { dist: 4, r: 0.12, color: '#a8a8a8', speed: 0.5 },
    { dist: 6, r: 0.2, color: '#d4a574', speed: 0.35 },
    { dist: 8.5, r: 0.25, color: '#3b82f6', speed: 0.25 },
    { dist: 11, r: 0.18, color: '#dc2626', speed: 0.2 },
    { dist: 15, r: 0.7, color: '#d4a574', speed: 0.12 },
    { dist: 19, r: 0.6, color: '#e4c896', speed: 0.08, hasRings: true },
    { dist: 24, r: 0.4, color: '#22d3ee', speed: 0.05 },
    { dist: 28, r: 0.35, color: '#3b82f6', speed: 0.04 },
  ], [])

  const getVisibility = () => {
    const p = progressRef.current
    const fIn = smoothStep(0.72, 0.78, p)
    const fOut = 1 - smoothStep(0.84, 0.90, p)
    return fIn * fOut
  }

  useFrame(({ clock }) => {
    const v = getVisibility()
    if (groupRef.current) {
      groupRef.current.visible = v > 0.01
      groupRef.current.rotation.y = clock.getElapsedTime() * 0.01
    }
    planetRefs.current.forEach((mesh, i) => {
      if (mesh && v > 0.01) {
        const t = clock.getElapsedTime()
        const angle = t * planets[i].speed + i * 0.7
        mesh.position.x = Math.cos(angle) * planets[i].dist
        mesh.position.z = Math.sin(angle) * planets[i].dist
        if (i === 5 && ringRef.current) {
          ringRef.current.position.copy(mesh.position)
          ringRef.current.rotation.z = Math.sin(angle) * 0.2
        }
      }
    })
  })

  const v = getVisibility()
  if (v <= 0.01) return null

  return (
    <group ref={groupRef} position={[0, 0, -30]}>
      {/* Sun at center */}
      <mesh>
        <sphereGeometry args={[1.2, 16, 16]} />
        <meshBasicMaterial color="#f59e0b" transparent opacity={v * 0.5} />
      </mesh>
      <mesh>
        <sphereGeometry args={[1.5, 12, 12]} />
        <meshBasicMaterial color="#f97316" transparent opacity={v * 0.15} depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>
      {/* Orbits and planets */}
      {planets.map((p, i) => (
        <mesh key={`orbit-${i}`} rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[p.dist - 0.02, p.dist + 0.02, 64]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={v * 0.06} side={THREE.DoubleSide} />
        </mesh>
      ))}
      {planets.map((p, i) => (
        <mesh
          key={`planet-${i}`}
          ref={(el) => { planetRefs.current[i] = el }}
        >
          <sphereGeometry args={[p.r, 12, 12]} />
          <meshBasicMaterial color={p.color} transparent opacity={v * 0.7} />
        </mesh>
      ))}
      {/* Saturn rings */}
      <mesh ref={ringRef} rotation={[Math.PI / 3, 0, 0]}>
        <ringGeometry args={[0.9, 1.4, 32]} />
        <meshBasicMaterial color="#d4a574" transparent opacity={v * 0.3} side={THREE.DoubleSide} />
      </mesh>
    </group>
  )
}

/* =============================================
   MILKY WAY
   Spiral galaxy with 2000 points.
   Varied star colors. Dust lanes.
   Core glow. Nebula haze.
   ============================================= */

function GalaxySpiral({ progressRef }) {
  const groupRef = useRef()

  const starData = useMemo(() => {
    const count = 2000
    const pos = new Float32Array(count * 3)
    const col = new Float32Array(count * 3)
    const sizes = new Float32Array(count)
    const R = 30
    const dustAngle = 0.5

    for (let i = 0; i < count; i++) {
      const r = Math.sqrt(Math.random()) * R
      const armOffset = Math.sin(r * 0.3) * 0.4
      const arm = Math.floor(Math.random() * 3)
      const angle = (arm / 3) * Math.PI * 2 + r * 0.15 + armOffset

      const dustFactor = Math.sin(angle + dustAngle) * 0.15
      const inDust = Math.abs(angle % (Math.PI * 2 / 3) - Math.PI / 3) < 0.15
      const dustDark = inDust ? 0.5 : 1.0

      const spread = r < 5 ? 0.1 : 0.02 + (r / R) * 0.02
      pos[i * 3] = Math.cos(angle) * r + (Math.random() - 0.5) * spread * 2
      pos[i * 3 + 1] = (Math.random() - 0.5) * (0.02 + r * 0.003) * dustDark
      pos[i * 3 + 2] = Math.sin(angle) * r + (Math.random() - 0.5) * spread * 2

      const starType = Math.random()
      if (starType < 0.1) {
        col[i * 3] = 1.0; col[i * 3 + 1] = 0.85; col[i * 3 + 2] = 0.6
      } else if (starType < 0.6) {
        col[i * 3] = 0.9; col[i * 3 + 1] = 0.9; col[i * 3 + 2] = 1.0
      } else {
        col[i * 3] = 1.0; col[i * 3 + 1] = 0.7; col[i * 3 + 2] = 0.5
      }

      sizes[i] = r < 3 ? 0.15 + Math.random() * 0.3 : 0.04 + Math.random() * 0.1
    }
    return { pos, col, sizes }
  }, [])

  const nebulaMeshes = useMemo(() => {
    return [
      { x: 8, y: -1, z: 5, w: 20, h: 8, rot: 0.3, color: '#4c1d95' },
      { x: -10, y: 2, z: -8, w: 25, h: 10, rot: -0.5, color: '#1e1b4b' },
      { x: 15, y: -3, z: -12, w: 18, h: 6, rot: 0.7, color: '#581c87' },
      { x: -5, y: 1, z: 18, w: 22, h: 7, rot: -0.2, color: '#312e81' },
    ]
  }, [])

  const getVisibility = () => {
    const p = progressRef.current
    const fIn = smoothStep(0.84, 0.88, p)
    const fOut = 1 - smoothStep(0.93, 0.97, p)
    return fIn * fOut
  }

  useFrame(({ clock }) => {
    const v = getVisibility()
    if (groupRef.current) {
      groupRef.current.visible = v > 0.01
      groupRef.current.rotation.y = clock.getElapsedTime() * 0.004
    }
  })

  const v = getVisibility()
  if (v <= 0.01) return null

  return (
    <group ref={groupRef} position={[0, 0, -70]}>
      {/* Galaxy core */}
      <mesh>
        <sphereGeometry args={[3, 20, 20]} />
        <meshBasicMaterial color="#fef3c7" transparent opacity={v * 0.8} />
      </mesh>
      <mesh>
        <sphereGeometry args={[5, 12, 12]} />
        <meshBasicMaterial color="#f59e0b" transparent opacity={v * 0.15} depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>
      {/* Stars */}
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" count={starData.pos.length / 3} array={starData.pos} itemSize={3} />
          <bufferAttribute attach="attributes-color" count={starData.col.length / 3} array={starData.col} itemSize={3} />
          <bufferAttribute attach="attributes-size" count={starData.sizes.length} array={starData.sizes} itemSize={1} />
        </bufferGeometry>
        <pointsMaterial
          size={0.08}
          transparent
          opacity={v * 0.7}
          vertexColors
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          sizeAttenuation
        />
      </points>
      {/* Nebula clouds */}
      {nebulaMeshes.map((n, i) => (
        <mesh key={i} position={[n.x, n.y, n.z]} rotation={[0, n.rot, 0]}>
          <planeGeometry args={[n.w, n.h]} />
          <meshBasicMaterial color={n.color} transparent opacity={v * 0.04} depthWrite={false} blending={THREE.AdditiveBlending} />
        </mesh>
      ))}
    </group>
  )
}

/* =============================================
   OBSERVABLE UNIVERSE
   Galaxy clusters with filament structure.
   Voids between clusters.
   Large-scale cosmic web.
   Depth and fog.
   ============================================= */

function CosmicWeb({ progressRef }) {
  const groupRef = useRef()

  const galaxyData = useMemo(() => {
    const count = 600
    const pos = new Float32Array(count * 3)
    const col = new Float32Array(count * 3)
    const sizes = new Float32Array(count)
    const clusters = 8

    for (let i = 0; i < count; i++) {
      const cluster = Math.floor(Math.random() * clusters)
      const cx = Math.cos((cluster / clusters) * Math.PI * 2) * (20 + Math.random() * 10)
      const cz = Math.sin((cluster / clusters) * Math.PI * 2) * (20 + Math.random() * 10)
      const cy = (Math.random() - 0.5) * 15

      const inCluster = Math.random() < 0.7
      if (inCluster) {
        pos[i * 3] = cx + (Math.random() - 0.5) * 8
        pos[i * 3 + 1] = cy + (Math.random() - 0.5) * 5
        pos[i * 3 + 2] = cz + (Math.random() - 0.5) * 8
        sizes[i] = 0.3 + Math.random() * 0.5
      } else {
        const t = Math.random() * Math.PI * 2
        const r = 15 + Math.random() * 40
        const filament = Math.floor(Math.random() * 3)
        const fAngle = (filament / 3) * Math.PI * 2 + t * 0.05
        pos[i * 3] = Math.cos(fAngle) * r
        pos[i * 3 + 1] = (Math.random() - 0.5) * 20
        pos[i * 3 + 2] = Math.sin(fAngle) * r
        sizes[i] = 0.1 + Math.random() * 0.2
      }

      const hue = 0.65 + Math.random() * 0.15
      col[i * 3] = 0.4 + hue * 0.4
      col[i * 3 + 1] = 0.3 + (1 - hue) * 0.3
      col[i * 3 + 2] = 0.6 + (1 - hue) * 0.3
    }
    return { pos, col, sizes }
  }, [])

  const getVisibility = () => smoothStep(0.92, 0.96, progressRef.current)

  useFrame(({ clock }) => {
    const v = getVisibility()
    if (groupRef.current) {
      groupRef.current.visible = v > 0.01
      groupRef.current.rotation.y = clock.getElapsedTime() * 0.001
    }
  })

  const v = getVisibility()
  if (v <= 0.01) return null

  return (
    <group ref={groupRef}>
      {/* Galaxy clusters */}
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" count={galaxyData.pos.length / 3} array={galaxyData.pos} itemSize={3} />
          <bufferAttribute attach="attributes-color" count={galaxyData.col.length / 3} array={galaxyData.col} itemSize={3} />
          <bufferAttribute attach="attributes-size" count={galaxyData.sizes.length} array={galaxyData.sizes} itemSize={1} />
        </bufferGeometry>
        <pointsMaterial
          size={0.3}
          transparent
          opacity={v * 0.6}
          vertexColors
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          sizeAttenuation
        />
      </points>
      {/* Nebula haze */}
      <mesh position={[0, 0, -50]}>
        <planeGeometry args={[150, 150]} />
        <meshBasicMaterial color="#1e1b4b" transparent opacity={v * 0.03} depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>
    </group>
  )
}

/* =============================================
   DEEP STARFIELD
   Background layer of stars.
   Varied sizes, warm and cool colors.
   Slow rotation.
   ============================================= */

function DeepStarfield() {
  const ref = useRef()

  const { positions, colors, sizes } = useMemo(() => {
    const count = 1200
    const pos = new Float32Array(count * 3)
    const col = new Float32Array(count * 3)
    const s = new Float32Array(count)

    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      const r = 100 + Math.random() * 300
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta)
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
      pos[i * 3 + 2] = r * Math.cos(phi)

      const warmth = Math.random()
      if (warmth < 0.3) {
        col[i * 3] = 1.0; col[i * 3 + 1] = 0.95; col[i * 3 + 2] = 0.8
      } else if (warmth < 0.7) {
        col[i * 3] = 0.9; col[i * 3 + 1] = 0.9; col[i * 3 + 2] = 1.0
      } else {
        col[i * 3] = 0.7; col[i * 3 + 1] = 0.8; col[i * 3 + 2] = 1.0
      }

      s[i] = Math.random() > 0.95 ? 0.2 + Math.random() * 0.4 : 0.05 + Math.random() * 0.15
    }
    return { positions: pos, colors: col, sizes: s }
  }, [])

  useFrame(({ clock }) => {
    if (ref.current) {
      ref.current.rotation.y = clock.getElapsedTime() * 0.0015
      ref.current.rotation.x = Math.sin(clock.getElapsedTime() * 0.0005) * 0.005
    }
  })

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={positions.length / 3} array={positions} itemSize={3} />
        <bufferAttribute attach="attributes-color" count={colors.length / 3} array={colors} itemSize={3} />
        <bufferAttribute attach="attributes-size" count={sizes.length} array={sizes} itemSize={1} />
      </bufferGeometry>
      <pointsMaterial
        size={0.12}
        transparent
        opacity={0.5}
        vertexColors
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}
