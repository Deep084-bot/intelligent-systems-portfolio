import { useRef, useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import {
  getEarthTexture,
  getEarthRoughness,
  getEarthNight,
  getCloudTexture,
  getMoonTexture,
  getSunTexture,
  getPlanetTexture,
  getSaturnRingTexture,
  getStarSprite,
  getGlowSprite,
} from './textures'
import { useMotionScale } from './motion'
import { endingState } from './endingState'
import { mulberry32 } from './helpers'

function disposes(mats) {
  return () => mats.forEach((m) => m && m.dispose && m.dispose())
}

/* ---------------------------------------------------------------- EARTH */

export function Earth() {
  const group = useRef()
  const motion = useMotionScale()
  const clouds = useRef()
  const earthTex = useMemo(() => getEarthTexture(), [])
  const roughTex = useMemo(() => getEarthRoughness(), [])
  const nightTex = useMemo(() => getEarthNight(), [])
  const cloudTex = useMemo(() => getCloudTexture(), [])

  const surface = useMemo(() => new THREE.MeshStandardMaterial({
    map: earthTex, roughnessMap: roughTex, roughness: 0.85, metalness: 0.05,
    emissiveMap: nightTex, emissive: '#ffd9a0', emissiveIntensity: 0.35,
  }), [earthTex, roughTex, nightTex])
  const cloudMat = useMemo(() => new THREE.MeshStandardMaterial({
    map: cloudTex, alphaMap: cloudTex, transparent: true, opacity: 0.55, depthWrite: false, roughness: 1,
  }), [cloudTex])
  const atmoMat = useMemo(() => new THREE.MeshBasicMaterial({
    color: '#4f8fe6', transparent: true, opacity: 0.14, side: THREE.BackSide, depthWrite: false, blending: THREE.AdditiveBlending,
  }), [])
  useEffect(() => disposes([surface, cloudMat, atmoMat]), [surface, cloudMat, atmoMat])

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime() * motion
    if (group.current) group.current.rotation.y = t * 0.05
    if (clouds.current) clouds.current.rotation.y = t * 0.065
  })

  return (
    <group>
      <group ref={group}>
        <mesh>
          <sphereGeometry args={[2.5, 96, 96]} />
          <primitive object={surface} attach="material" />
        </mesh>
      </group>
      <mesh ref={clouds}>
        <sphereGeometry args={[2.54, 64, 64]} />
        <primitive object={cloudMat} attach="material" />
      </mesh>
      {/* Atmosphere shell */}
      <mesh scale={[1.085, 1.085, 1.085]}>
        <sphereGeometry args={[2.5, 48, 48]} />
        <primitive object={atmoMat} attach="material" />
      </mesh>
      {/* Sunlight + fill so the globe reads as a lit sphere. */}
      <directionalLight position={[6, 2.5, 8]} intensity={3.4} color="#fff4e0" />
      <pointLight position={[-8, -3, -6]} intensity={0.5} color="#5b7cff" />
    </group>
  )
}

/* ----------------------------------------------------------------- MOON */

export function Moon() {
  const moon = useRef()
  const motion = useMotionScale()
  const earth = useRef()
  const moonTex = useMemo(() => getMoonTexture(), [])
  const earthTex = useMemo(() => getEarthTexture(), [])

  const moonMat = useMemo(() => new THREE.MeshStandardMaterial({ map: moonTex, roughness: 1, metalness: 0 }), [moonTex])
  const earthMat = useMemo(() => new THREE.MeshStandardMaterial({ map: earthTex, roughness: 0.8, metalness: 0.05, emissive: '#0a1a33', emissiveIntensity: 0.4 }), [earthTex])
  const ringMat = useMemo(() => new THREE.MeshBasicMaterial({ color: '#8fa7d6', transparent: true, opacity: 0.18, side: THREE.DoubleSide, depthWrite: false }), [])
  useEffect(() => disposes([moonMat, earthMat, ringMat]), [moonMat, earthMat, ringMat])

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime() * motion
    if (moon.current) moon.current.rotation.y = t * 0.06
    if (earth.current) {
      const a = t * 0.08
      earth.current.position.set(Math.cos(a) * 15, 3.4, Math.sin(a) * 15)
      earth.current.rotation.y = t * 0.1
    }
  })

  return (
    <group>
      {/* Moon fills the frame */}
      <mesh ref={moon}>
        <sphereGeometry args={[2.4, 96, 96]} />
        <primitive object={moonMat} attach="material" />
      </mesh>
      {/* Distant Earth */}
      <group ref={earth}>
        <mesh>
          <sphereGeometry args={[0.62, 40, 40]} />
          <primitive object={earthMat} attach="material" />
        </mesh>
        <pointLight intensity={0.6} distance={6} color="#8fb4ff" />
      </group>
      {/* Orbit ring */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[14.85, 15.15, 128]} />
        <primitive object={ringMat} attach="material" />
      </mesh>
      <directionalLight position={[7, 3, 6]} intensity={2.8} color="#eef4ff" />
      <pointLight position={[-6, -2, -5]} intensity={0.4} color="#6d8bff" />
    </group>
  )
}

/* ------------------------------------------------------------------ SUN */

export function Sun() {
  const core = useRef()
  const motion = useMotionScale()
  const surface = useMemo(() => getSunTexture(), [])
  const glow = useMemo(() => getGlowSprite(), [])

  const coreMat = useMemo(() => new THREE.MeshStandardMaterial({
    map: surface, emissiveMap: surface, emissive: '#ffffff', emissiveIntensity: 1.9,
    color: '#ffc24a', roughness: 1, metalness: 0,
  }), [surface])
  const haloMat = useMemo(() => new THREE.MeshBasicMaterial({ color: '#ff9a3a', transparent: true, opacity: 0.16, side: THREE.BackSide, depthWrite: false, blending: THREE.AdditiveBlending }), [])
  useEffect(() => disposes([coreMat, haloMat]), [coreMat, haloMat])

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime() * motion
    if (core.current) {
      core.current.rotation.y = t * 0.03
      const s = 1 + Math.sin(t * 0.9) * 0.006
      core.current.scale.setScalar(s)
    }
  })

  const R = 4
  return (
    <group>
      <mesh ref={core}>
        <sphereGeometry args={[R, 96, 96]} />
        <primitive object={coreMat} attach="material" />
      </mesh>
      {/* Single tight photosphere halo — no hard concentric ring shells. */}
      <mesh scale={[1.06, 1.06, 1.06]}>
        <sphereGeometry args={[R, 48, 48]} />
        <primitive object={haloMat} attach="material" />
      </mesh>
      {/* Two soft, broad sprites give a restrained corona that fades out. */}
      <sprite scale={[R * 5.6, R * 5.6, 1]}>
        <spriteMaterial map={glow} color="#ffcf7a" transparent opacity={0.5} depthWrite={false} blending={THREE.AdditiveBlending} />
      </sprite>
      <sprite scale={[R * 11, R * 11, 1]}>
        <spriteMaterial map={glow} color="#ff7a26" transparent opacity={0.14} depthWrite={false} blending={THREE.AdditiveBlending} />
      </sprite>
      <pointLight intensity={3.4} distance={160} color="#ffd27a" />
    </group>
  )
}

/* ---------------------------------------------------------- SOLAR SYSTEM */

const PLANETS = [
  { name: 'Mercury', dist: 3, r: 0.4, color: '#9c9a94', speed: 0.5, atmo: null },
  { name: 'Venus', dist: 4.4, r: 0.6, color: '#e6cba0', speed: 0.36, atmo: '#e8d29a' },
  { name: 'Earth', dist: 5.8, r: 0.66, color: '#3f7fdc', speed: 0.28, atmo: '#5aa0ff' },
  { name: 'Mars', dist: 7.2, r: 0.5, color: '#c1623f', speed: 0.22, atmo: null },
  { name: 'Jupiter', dist: 9.6, r: 1.7, color: '#d8b88a', speed: 0.13, atmo: '#e6cfa6' },
  { name: 'Saturn', dist: 12, r: 1.5, color: '#e0cb96', speed: 0.1, rings: true, atmo: '#e6d6a8' },
  { name: 'Uranus', dist: 13.8, r: 1.0, color: '#9fdff0', speed: 0.07, atmo: '#b6e6f2' },
  { name: 'Neptune', dist: 15.5, r: 0.95, color: '#4f7fdd', speed: 0.055, atmo: '#6a90e8' },
]

export function SolarSystem() {
  const pivot = useRef()
  const refs = useRef([])
  const motion = useMotionScale()
  const ringTex = useMemo(() => getSaturnRingTexture(), [])
  const glow = useMemo(() => getGlowSprite(), [])
  const ringMat = useMemo(() => new THREE.MeshBasicMaterial({ map: ringTex, transparent: true, side: THREE.DoubleSide, depthWrite: false }), [ringTex])
  useEffect(() => disposes([ringMat]), [ringMat])

  const planetMats = useMemo(
    () => PLANETS.map((p) => {
      const c = new THREE.Color(p.color)
      const map = getPlanetTexture(p.name)
      return new THREE.MeshStandardMaterial({
        map, emissiveMap: map, color: '#ffffff',
        roughness: 0.9, metalness: 0.03,
        emissive: c.clone().multiplyScalar(0.5), emissiveIntensity: 0.32,
      })
    }),
    []
  )
  const atmoMats = useMemo(
    () => PLANETS.map((p) => p.atmo
      ? new THREE.MeshBasicMaterial({ color: p.atmo, transparent: true, opacity: 0.1, side: THREE.BackSide, depthWrite: false, blending: THREE.AdditiveBlending })
      : null),
    []
  )
  const sunMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#ffcf5a', emissive: '#ffb020', emissiveIntensity: 2.4, roughness: 1 }), [])
  useEffect(() => disposes([...planetMats, ...atmoMats, sunMat]), [planetMats, atmoMats, sunMat])

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime() * motion
    if (pivot.current) pivot.current.rotation.y = t * 0.012
    refs.current.forEach((m, i) => {
      if (!m) return
      const a = t * PLANETS[i].speed + i * 0.9
      m.position.set(Math.cos(a) * PLANETS[i].dist, 0, Math.sin(a) * PLANETS[i].dist)
      m.rotation.y = t * 0.4
    })
  })

  return (
    <group rotation={[0.14, 0, 0.05]}>
      <group ref={pivot}>
        {/* Faint orbit guides. */}
        {PLANETS.map((p, i) => (
          <mesh key={`o${i}`} rotation={[Math.PI / 2, 0, 0]}>
            <ringGeometry args={[p.dist - 0.02, p.dist + 0.02, 128]} />
            <meshBasicMaterial color="#8fb0e6" transparent opacity={0.16} side={THREE.DoubleSide} depthWrite={false} />
          </mesh>
        ))}
        {/* Planets (Saturn carries its own layered rings) */}
        {PLANETS.map((p, i) => (
          <group key={`p${i}`} ref={(el) => { refs.current[i] = el }}>
            <mesh>
              <sphereGeometry args={[p.r, 40, 40]} />
              <primitive object={planetMats[i]} attach="material" />
            </mesh>
            {atmoMats[i] && (
              <mesh scale={[1.14, 1.14, 1.14]}>
                <sphereGeometry args={[p.r, 24, 24]} />
                <primitive object={atmoMats[i]} attach="material" />
              </mesh>
            )}
            {p.rings && (
              <group rotation={[Math.PI / 2.35, 0, 0.2]}>
                <mesh>
                  <ringGeometry args={[p.r * 1.4, p.r * 2.5, 96]} />
                  <primitive object={ringMat} attach="material" />
                </mesh>
                <mesh scale={[1.01, 1.01, 1.01]}>
                  <ringGeometry args={[p.r * 1.42, p.r * 2.5, 96]} />
                  <primitive object={ringMat} attach="material" />
                </mesh>
              </group>
            )}
          </group>
        ))}
      </group>

      {/* Sun */}
      <mesh>
        <sphereGeometry args={[2.0, 48, 48]} />
        <primitive object={sunMat} attach="material" />
      </mesh>
      <mesh scale={[1.35, 1.35, 1.35]}>
        <sphereGeometry args={[2.0, 32, 32]} />
        <meshBasicMaterial color="#ff9a3a" transparent opacity={0.2} side={THREE.BackSide} depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>
      <sprite scale={[24, 24, 1]}>
        <spriteMaterial map={glow} color="#ffca6a" transparent opacity={0.38} depthWrite={false} blending={THREE.AdditiveBlending} />
      </sprite>
      <pointLight intensity={2.6} decay={0} color="#ffe0a0" />
      <directionalLight position={[10, 6, 10]} intensity={0.8} color="#cfe0ff" />
    </group>
  )
}

/* --------------------------------------------------------------- GALAXY */

export function Galaxy() {
  const group = useRef()
  const motion = useMotionScale()
  const sprite = useMemo(() => getStarSprite(), [])
  const glow = useMemo(() => getGlowSprite(), [])

  // A proper spiral: two log-spiral arms carrying a blue-white/white/pink star
  // mix, a warm dense bulge cloud, thin inter-arm gaps (dark lanes emerge where
  // the gaussian arm scatter leaves space), and a bright core sprite.
  const { disk, bulge } = useMemo(() => {
    const R = 30
    const rng = mulberry32(31415)
    const gauss = () => {
      let u = 0, v = 0
      while (u === 0) u = rng()
      while (v === 0) v = rng()
      return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)
    }
    const warm = [1.0, 0.9, 0.72]
    const blue = [0.72, 0.8, 1.0]
    const pink = [1.0, 0.66, 0.82]
    const white = [0.95, 0.97, 1.0]

    const build = (count, kind) => {
      const pos = new Float32Array(count * 3)
      const col = new Float32Array(count * 3)
      for (let i = 0; i < count; i++) {
        let x, y, z, c
        if (kind === 'bulge') {
          const r = Math.pow(rng(), 1.8) * 6.4
          const phi = Math.acos(2 * rng() - 1)
          const th = rng() * Math.PI * 2
          x = r * Math.sin(phi) * Math.cos(th)
          y = r * Math.cos(phi) * 0.6
          z = r * Math.sin(phi) * Math.sin(th)
          const t = rng() * 0.35
          c = [1.0 - 0.12 * t, 0.88 - 0.08 * t, 0.64 - 0.06 * t]
        } else {
          const r = Math.pow(rng(), 0.55) * R
          const arm = i % 2
          const base = 1.15 * Math.log(r + 1.4) + arm * Math.PI
          const spread = 0.26 + (r / R) * 0.5
          const angle = base + gauss() * spread
          x = Math.cos(angle) * r + gauss() * (0.35 + (r / R) * 1.2)
          z = Math.sin(angle) * r + gauss() * (0.35 + (r / R) * 1.2)
          y = gauss() * (0.2 + (r / R) * 0.38)
          const rr = rng()
          c = rr < 0.05 ? pink : rr < 0.34 ? blue : rr < 0.8 ? white : warm
          const dim = 0.6 + rng() * 0.4
          c = [c[0] * dim, c[1] * dim, c[2] * dim]
        }
        pos[i * 3] = x; pos[i * 3 + 1] = y; pos[i * 3 + 2] = z
        col[i * 3] = c[0]; col[i * 3 + 1] = c[1]; col[i * 3 + 2] = c[2]
      }
      return { pos, col }
    }
    return { disk: build(11000, 'disk'), bulge: build(3200, 'bulge') }
  }, [])

  useFrame(({ clock }) => {
    if (group.current) group.current.rotation.y = clock.getElapsedTime() * motion * 0.012
  })

  return (
    <group ref={group} rotation={[0.32, 0, 0.12]}>
      {/* Bulge star cloud */}
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" count={bulge.pos.length / 3} array={bulge.pos} itemSize={3} />
          <bufferAttribute attach="attributes-color" count={bulge.col.length / 3} array={bulge.col} itemSize={3} />
        </bufferGeometry>
        <pointsMaterial map={sprite} size={1.4} vertexColors transparent opacity={0.95} depthWrite={false} blending={THREE.AdditiveBlending} sizeAttenuation />
      </points>
      {/* Spiral arms */}
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" count={disk.pos.length / 3} array={disk.pos} itemSize={3} />
          <bufferAttribute attach="attributes-color" count={disk.col.length / 3} array={disk.col} itemSize={3} />
        </bufferGeometry>
        <pointsMaterial map={sprite} size={1.2} vertexColors transparent opacity={1} depthWrite={false} blending={THREE.AdditiveBlending} sizeAttenuation />
      </points>
      {/* Bright galactic core */}
      <sprite scale={[9, 9, 1]}>
        <spriteMaterial map={glow} color="#ffdca0" transparent opacity={0.5} depthWrite={false} blending={THREE.AdditiveBlending} />
      </sprite>
      <ambientLight intensity={0.3} color="#8a7dff" />
    </group>
  )
}

/* ----------------------------------------------------------- COSMIC WEB */

export function CosmicWeb() {
  const group = useRef()
  const motion = useMotionScale()
  const sprite = useMemo(() => getStarSprite(), [])

  // A large-scale filament-and-void structure rather than a constellation
  // diagram: supercluster cores (warm, brightest), filaments between nearest
  // neighbours (cool, tapered to brighten at the cores), and a faint distant
  // field that leaves the voids airy. Points are split into three distance
  // bands so perspective gives genuine volumetric depth. Fully deterministic.
  const { layers, lines } = useMemo(() => {
    const rng = mulberry32(20260113)
    const C = 18

    // 1) Supercluster centres through a flattened volume.
    const centers = []
    for (let i = 0; i < C; i++) {
      const phi = Math.acos(2 * rng() - 1)
      const theta = rng() * Math.PI * 2
      const r = 8 + Math.pow(rng(), 0.55) * 34
      centers.push([
        r * Math.sin(phi) * Math.cos(theta),
        r * Math.cos(phi) * 0.72,
        r * Math.sin(phi) * Math.sin(theta),
      ])
    }

    // 2) Filament graph — each cluster joins its two nearest neighbours.
    const edgeMap = new Map()
    for (let i = 0; i < C; i++) {
      const ds = []
      for (let j = 0; j < C; j++) {
        if (i === j) continue
        const dx = centers[i][0] - centers[j][0]
        const dy = centers[i][1] - centers[j][1]
        const dz = centers[i][2] - centers[j][2]
        ds.push([j, dx * dx + dy * dy + dz * dz])
      }
      ds.sort((a, b) => a[1] - b[1])
      for (let k = 0; k < 2; k++) {
        const j = ds[k][0]
        const key = i < j ? `${i}-${j}` : `${j}-${i}`
        if (!edgeMap.has(key)) edgeMap.set(key, [i, j])
      }
    }
    const edgeList = [...edgeMap.values()]

    // 3) Three distance bands for layered depth.
    const bandDefs = [
      { size: 3.6, opacity: 0.95 }, // near
      { size: 2.4, opacity: 0.82 }, // mid
      { size: 1.5, opacity: 0.68 }, // far
    ]
    const bandPts = [[], [], []]
    const bandCol = [[], [], []]
    const bandOf = (x, y, z) => {
      const r = Math.hypot(x, y, z)
      return r < 15 ? 0 : r < 30 ? 1 : 2
    }
    const push = (x, y, z, base, bright) => {
      const b = bandOf(x, y, z)
      bandPts[b].push(x, y, z)
      bandCol[b].push(base[0] * bright, base[1] * bright, base[2] * bright)
    }
    const gauss = () => {
      let u = 0, v = 0
      while (u === 0) u = rng()
      while (v === 0) v = rng()
      return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)
    }

    // Cluster cores — dense, warm, brightest.
    for (const c of centers) {
      const blob = 2.0 + rng() * 1.2
      for (let i = 0; i < 80; i++) {
        push(
          c[0] + gauss() * blob,
          c[1] + gauss() * blob * 0.8,
          c[2] + gauss() * blob,
          [1.0, 0.86, 0.62],
          0.72 + rng() * 0.28
        )
      }
    }

    // Filaments — strung points + tapered connecting lines (bright at cores).
    const linePts = []
    const lineCol = []
    for (const [i, j] of edgeList) {
      const a = centers[i]
      const b = centers[j]
      const segs = 26
      const faint = 0.32 + rng() * 0.4
      let px = a[0], py = a[1], pz = a[2]
      for (let s = 1; s <= segs; s++) {
        const t = s / segs
        const jitter = 0.9
        const x = a[0] + (b[0] - a[0]) * t + (rng() - 0.5) * jitter
        const y = a[1] + (b[1] - a[1]) * t + (rng() - 0.5) * jitter
        const z = a[2] + (b[2] - a[2]) * t + (rng() - 0.5) * jitter
        const taper = 0.32 + 0.68 * Math.pow(Math.abs(t - 0.5) * 2, 1.4)
        if (rng() < 0.5) push(x, y, z, [0.6, 0.72, 1.0], (0.45 + taper * 0.5) * faint)
        const lc = 0.5 * taper * faint
        linePts.push(px, py, pz, x, y, z)
        lineCol.push(lc * 0.7, lc * 0.85, lc * 1.6, lc * 0.7, lc * 0.85, lc * 1.6)
        px = x; py = y; pz = z
      }
    }

    // Distant field — faint cool points, leaving voids around the clusters.
    for (let i = 0; i < 1700; i++) {
      const phi = Math.acos(2 * rng() - 1)
      const theta = rng() * Math.PI * 2
      const r = 22 + rng() * 30
      const x = r * Math.sin(phi) * Math.cos(theta)
      const y = r * Math.cos(phi) * 0.7
      const z = r * Math.sin(phi) * Math.sin(theta)
      let near = false
      for (const c of centers) {
        const dx = x - c[0], dy = y - c[1], dz = z - c[2]
        if (dx * dx + dy * dy + dz * dz < 42) { near = true; break }
      }
      if (near) continue
      push(x, y, z, [0.4, 0.47, 0.8], 0.22 + rng() * 0.3)
    }

    const layers = bandDefs
      .map((d, i) => ({ ...d, pos: new Float32Array(bandPts[i]), col: new Float32Array(bandCol[i]) }))
      .filter((l) => l.pos.length > 0)

    return { layers, lines: { pos: new Float32Array(linePts), col: new Float32Array(lineCol) } }
  }, [])

  useFrame(({ clock }) => {
    const g = group.current
    if (!g) return
    g.rotation.y = clock.getElapsedTime() * motion * 0.006
    // Recede into the distance as the closing narrative plays.
    const d = endingState.dim
    g.scale.setScalar(1 - d * 0.32)
    g.position.z = -d * 10
  })

  return (
    <group ref={group}>
      {layers.map((layer, i) => (
        <points key={i}>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" count={layer.pos.length / 3} array={layer.pos} itemSize={3} />
            <bufferAttribute attach="attributes-color" count={layer.col.length / 3} array={layer.col} itemSize={3} />
          </bufferGeometry>
          <pointsMaterial
            map={sprite} size={layer.size} vertexColors transparent opacity={layer.opacity}
            depthWrite={false} blending={THREE.AdditiveBlending} sizeAttenuation
          />
        </points>
      ))}
      <lineSegments>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" count={lines.pos.length / 3} array={lines.pos} itemSize={3} />
          <bufferAttribute attach="attributes-color" count={lines.col.length / 3} array={lines.col} itemSize={3} />
        </bufferGeometry>
        <lineBasicMaterial vertexColors transparent opacity={0.5} depthWrite={false} blending={THREE.AdditiveBlending} />
      </lineSegments>
      <ambientLight intensity={0.22} color="#8a7dff" />
    </group>
  )
}
