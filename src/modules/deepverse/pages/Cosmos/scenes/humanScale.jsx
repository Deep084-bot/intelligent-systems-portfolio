import { useRef, useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import {
  getFacadeTexture,
  getRoadTexture,
  getWoodTexture,
  getPlasterTexture,
  getContactShadow,
  getGlowSprite,
} from './textures'
import { mulberry32 } from './helpers'
import { useMotionScale } from './motion'

/* --------------------------------------------------------------- shared */

function ContactShadow({ radius = 1, opacity = 0.7, y = 0.002 }) {
  const tex = useMemo(() => getContactShadow(), [])
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, y, 0]} scale={[radius, radius, radius]}>
      <planeGeometry args={[2, 2]} />
      <meshBasicMaterial map={tex} transparent opacity={opacity} depthWrite={false} />
    </mesh>
  )
}

function GlowSprite({ color = '#7aa2ff', scale = 1, opacity = 0.5, ...props }) {
  const tex = useMemo(() => getGlowSprite(), [])
  return (
    <sprite scale={[scale, scale, scale]} {...props}>
      <spriteMaterial map={tex} color={color} transparent opacity={opacity} depthWrite={false} blending={THREE.AdditiveBlending} />
    </sprite>
  )
}

/* ---------------------------------------------------------------- HUMAN */

// A stylised but anatomically coherent humanoid, ~1.8 m tall, standing. Limbs
// are built from capsules with sphere joints that blend the segments so the
// figure reads as one deliberate form rather than a stack of primitives. Lit by
// a cool key + warm rim so the body reads as volume, not a flat silhouette.
export function Human() {
  const root = useRef()
  const armL = useRef()
  const armR = useRef()
  const head = useRef()
  const motion = useMotionScale()

  const mats = useMemo(() => ({
    skin: new THREE.MeshStandardMaterial({ color: '#c89072', roughness: 0.55, metalness: 0.0, emissive: '#241a2e', emissiveIntensity: 0.16 }),
    shirt: new THREE.MeshStandardMaterial({ color: '#3c4a70', roughness: 0.82, metalness: 0.03 }),
    pants: new THREE.MeshStandardMaterial({ color: '#262f49', roughness: 0.86, metalness: 0.04 }),
    hair: new THREE.MeshStandardMaterial({ color: '#241f1c', roughness: 0.72, metalness: 0.06 }),
    shoe: new THREE.MeshStandardMaterial({ color: '#141924', roughness: 0.55, metalness: 0.12 }),
    eye: new THREE.MeshStandardMaterial({ color: '#10131c', roughness: 0.3 }),
  }), [])
  useEffect(() => () => Object.values(mats).forEach((m) => m.dispose()), [mats])

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime() * motion
    if (root.current) {
      root.current.position.y = Math.sin(t * 0.5) * 0.006
      root.current.rotation.y = Math.sin(t * 0.22) * 0.05
    }
    if (armL.current) armL.current.rotation.x = Math.sin(t * 0.5) * 0.03
    if (armR.current) armR.current.rotation.x = -Math.sin(t * 0.5) * 0.03
    if (head.current) head.current.rotation.y = Math.sin(t * 0.3) * 0.06
  })

  const leg = (x, key) => (
    <group key={key} position={[x, 0.98, 0]}>
      <mesh position={[0, -0.23, 0]}>
        <capsuleGeometry args={[0.095, 0.27, 8, 16]} />
        <primitive object={mats.pants} attach="material" />
      </mesh>
      <mesh position={[0, -0.46, 0]}><sphereGeometry args={[0.085, 16, 16]} /><primitive object={mats.pants} attach="material" /></mesh>
      <mesh position={[0, -0.67, 0]}>
        <capsuleGeometry args={[0.068, 0.28, 8, 16]} />
        <primitive object={mats.pants} attach="material" />
      </mesh>
      <mesh position={[0, -0.9, 0.055]}><boxGeometry args={[0.115, 0.075, 0.27]} /><primitive object={mats.shoe} attach="material" /></mesh>
    </group>
  )

  const arm = (ref, sign, key) => (
    <group ref={ref} key={key} position={[sign * 0.185, 1.42, 0]} rotation={[0.04, 0, sign * 0.07]}>
      <mesh><sphereGeometry args={[0.095, 16, 16]} /><primitive object={mats.shirt} attach="material" /></mesh>
      <mesh position={[0, -0.16, 0]}>
        <capsuleGeometry args={[0.06, 0.2, 8, 16]} />
        <primitive object={mats.shirt} attach="material" />
      </mesh>
      <mesh position={[0, -0.32, 0]}><sphereGeometry args={[0.056, 14, 14]} /><primitive object={mats.shirt} attach="material" /></mesh>
      <mesh position={[0, -0.5, 0]}>
        <capsuleGeometry args={[0.047, 0.2, 8, 14]} />
        <primitive object={mats.skin} attach="material" />
      </mesh>
      <mesh position={[0, -0.71, 0]}><sphereGeometry args={[0.055, 14, 14]} /><primitive object={mats.skin} attach="material" /></mesh>
    </group>
  )

  return (
    <group>
      <group ref={root}>
        {leg(-0.105, 'l')}
        {leg(0.105, 'r')}

        {/* Pelvis → torso (overlapping capsules blend smoothly). */}
        <mesh position={[0, 1.0, 0]} scale={[1.12, 0.85, 0.9]}>
          <capsuleGeometry args={[0.15, 0.1, 8, 18]} />
          <primitive object={mats.pants} attach="material" />
        </mesh>
        <mesh position={[0, 1.16, 0]}>
          <capsuleGeometry args={[0.155, 0.12, 8, 18]} />
          <primitive object={mats.shirt} attach="material" />
        </mesh>
        <mesh position={[0, 1.31, 0]}>
          <capsuleGeometry args={[0.165, 0.2, 8, 20]} />
          <primitive object={mats.shirt} attach="material" />
        </mesh>
        <mesh position={[0, 1.44, 0]} scale={[1.28, 0.62, 0.82]}>
          <sphereGeometry args={[0.17, 20, 16]} />
          <primitive object={mats.shirt} attach="material" />
        </mesh>

        {/* Neck + head */}
        <mesh position={[0, 1.52, 0]}>
          <capsuleGeometry args={[0.055, 0.05, 6, 12]} />
          <primitive object={mats.skin} attach="material" />
        </mesh>
        <group ref={head} position={[0, 1.66, 0]}>
          <mesh scale={[0.94, 1.06, 1]}>
            <sphereGeometry args={[0.108, 24, 20]} />
            <primitive object={mats.skin} attach="material" />
          </mesh>
          <mesh position={[0, -0.055, 0.018]} scale={[0.82, 0.7, 0.92]}>
            <sphereGeometry args={[0.096, 20, 16]} />
            <primitive object={mats.skin} attach="material" />
          </mesh>
          {/* Hair cap (top/back), leaves the face clear. */}
          <mesh position={[0, 0.022, -0.006]} scale={[1.0, 0.92, 1.03]}>
            <sphereGeometry args={[0.116, 24, 18, 0, Math.PI * 2, 0, Math.PI * 0.62]} />
            <primitive object={mats.hair} attach="material" />
          </mesh>
          <mesh position={[0, -0.01, -0.07]} scale={[0.8, 0.85, 0.6]}>
            <sphereGeometry args={[0.1, 16, 14]} />
            <primitive object={mats.hair} attach="material" />
          </mesh>
          {/* Minimal facial cues. */}
          <mesh position={[0, -0.005, 0.1]} rotation={[1.35, 0, 0]}>
            <coneGeometry args={[0.018, 0.05, 8]} />
            <primitive object={mats.skin} attach="material" />
          </mesh>
          <mesh position={[-0.038, 0.012, 0.093]}><sphereGeometry args={[0.012, 10, 10]} /><primitive object={mats.eye} attach="material" /></mesh>
          <mesh position={[0.038, 0.012, 0.093]}><sphereGeometry args={[0.012, 10, 10]} /><primitive object={mats.eye} attach="material" /></mesh>
        </group>

        {arm(armL, -1, 'al')}
        {arm(armR, 1, 'ar')}
      </group>

      <ContactShadow radius={0.7} opacity={0.75} />

      {/* Presence glow keeps the original "alone in the dark" mood. */}
      <GlowSprite color="#6d8bff" scale={3.4} opacity={0.22} position={[0, 1.0, -0.6]} />

      {/* Key + rim lights (decay 0 so the figure reads at this distance). */}
      <spotLight position={[2.2, 4.2, 3]} angle={0.6} penumbra={0.9} intensity={2.6} decay={0} distance={18} color="#d3e2ff" />
      <pointLight position={[-1.6, 1.8, -2.2]} intensity={1.4} decay={0} distance={12} color="#ffb37a" />
      <pointLight position={[0, 1.1, 2]} intensity={0.55} decay={0} distance={9} color="#8ea2ff" />
    </group>
  )
}

/* ----------------------------------------------------------------- ROOM */

export function Room() {
  const lampRef = useRef()
  const motion = useMotionScale()
  const wood = useMemo(() => getWoodTexture(), [])
  const plaster = useMemo(() => getPlasterTexture(), [])

  const woodMat = useMemo(() => new THREE.MeshStandardMaterial({ map: wood, roughness: 0.6, metalness: 0.05, color: '#b98a5e' }), [wood])
  const wallMat = useMemo(() => new THREE.MeshStandardMaterial({ map: plaster, roughness: 0.95, metalness: 0 }), [plaster])
  const ceilMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#20242c', roughness: 1 }), [])
  useEffect(() => () => { woodMat.dispose(); wallMat.dispose(); ceilMat.dispose() }, [woodMat, wallMat, ceilMat])

  const W = 5, D = 4.2, H = 2.7

  useFrame(({ clock }) => {
    if (lampRef.current) lampRef.current.material.emissiveIntensity = 1.6 + Math.sin(clock.getElapsedTime() * 0.6 * motion) * 0.15
  })

  return (
    <group>
      {/* Shell (front wall omitted so the camera can look inside). */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[W, D]} />
        <primitive object={woodMat} attach="material" />
      </mesh>
      <mesh position={[0, H, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[W, D]} />
        <primitive object={ceilMat} attach="material" />
      </mesh>
      <mesh position={[0, H / 2, -D / 2]}>
        <planeGeometry args={[W, H]} />
        <primitive object={wallMat} attach="material" />
      </mesh>
      <mesh position={[-W / 2, H / 2, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[D, H]} />
        <primitive object={wallMat} attach="material" />
      </mesh>
      <mesh position={[W / 2, H / 2, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[D, H]} />
        <primitive object={wallMat} attach="material" />
      </mesh>

      {/* Window on the back wall: night city beyond. */}
      <mesh position={[0.6, 1.55, -D / 2 + 0.02]}>
        <planeGeometry args={[1.7, 1.25]} />
        <meshStandardMaterial color="#12203c" emissive="#2a4b86" emissiveIntensity={0.7} roughness={0.2} />
      </mesh>
      {[-0.25, 0.6, 1.45].map((x) => (
        <mesh key={x} position={[x, 1.55, -D / 2 + 0.03]}>
          <boxGeometry args={[0.05, 1.3, 0.05]} />
          <meshStandardMaterial color="#cbb894" roughness={0.6} />
        </mesh>
      ))}
      <mesh position={[0.6, 1.55, -D / 2 + 0.03]}>
        <boxGeometry args={[1.75, 0.05, 0.05]} />
        <meshStandardMaterial color="#cbb894" roughness={0.6} />
      </mesh>

      {/* Desk + chair */}
      <group position={[1.35, 0, -0.7]}>
        <mesh position={[0, 0.75, 0]} castShadow>
          <boxGeometry args={[1.3, 0.06, 0.65]} />
          <primitive object={woodMat} attach="material" />
        </mesh>
        {[[-0.58, -0.26], [0.58, -0.26], [-0.58, 0.26], [0.58, 0.26]].map(([x, z], i) => (
          <mesh key={i} position={[x, 0.37, z]}>
            <boxGeometry args={[0.06, 0.75, 0.06]} />
            <meshStandardMaterial color="#4a3728" roughness={0.7} />
          </mesh>
        ))}
        {/* Monitor */}
        <mesh position={[0, 1.05, -0.2]}>
          <boxGeometry args={[0.6, 0.38, 0.03]} />
          <meshStandardMaterial color="#0b0e16" emissive="#3d6dff" emissiveIntensity={0.45} roughness={0.4} />
        </mesh>
        <mesh position={[0, 0.82, -0.2]}>
          <boxGeometry args={[0.08, 0.12, 0.08]} />
          <meshStandardMaterial color="#1a2030" roughness={0.6} />
        </mesh>
      </group>
      <group position={[0.2, 0, 0.55]}>
        <mesh position={[0, 0.46, 0]} castShadow>
          <boxGeometry args={[0.46, 0.05, 0.46]} />
          <meshStandardMaterial color="#2f3948" roughness={0.8} />
        </mesh>
        <mesh position={[0, 0.68, -0.2]}>
          <boxGeometry args={[0.46, 0.44, 0.05]} />
          <meshStandardMaterial color="#2f3948" roughness={0.8} />
        </mesh>
        {[[-0.17, -0.17], [0.17, -0.17], [-0.17, 0.17], [0.17, 0.17]].map(([x, z], i) => (
          <mesh key={i} position={[x, 0.23, z]}>
            <cylinderGeometry args={[0.02, 0.02, 0.46, 8]} />
            <meshStandardMaterial color="#20262f" roughness={0.5} metalness={0.6} />
          </mesh>
        ))}
      </group>

      {/* Bookshelf against the left wall */}
      <group position={[-W / 2 + 0.2, 0, -0.6]}>
        <mesh position={[0, 1.0, 0]}>
          <boxGeometry args={[0.35, 2.0, 1.4]} />
          <meshStandardMaterial color="#3a2c22" roughness={0.8} />
        </mesh>
        {[0.5, 1.0, 1.5].map((y, i) => (
          <mesh key={i} position={[0, y, 0]}>
            <boxGeometry args={[0.36, 0.04, 1.36]} />
            <meshStandardMaterial color="#241a13" roughness={0.9} />
          </mesh>
        ))}
      </group>

      {/* Rug */}
      <mesh position={[0, 0.012, 0.4]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[2.6, 1.8]} />
        <meshStandardMaterial color="#5a2b3a" roughness={1} />
      </mesh>

      {/* Hanging lamp */}
      <mesh position={[0, H - 0.35, 0]}>
        <coneGeometry args={[0.28, 0.3, 20, 1, true]} />
        <meshStandardMaterial color="#d8c7a8" roughness={0.5} side={THREE.DoubleSide} />
      </mesh>
      <mesh ref={lampRef} position={[0, H - 0.5, 0]}>
        <sphereGeometry args={[0.06, 12, 12]} />
        <meshStandardMaterial color="#fff2cc" emissive="#ffd98a" emissiveIntensity={1.6} />
      </mesh>
      <pointLight position={[0, H - 0.5, 0]} intensity={9} distance={9} color="#ffdca8" />
      {/* Window spill */}
      <pointLight position={[0.6, 1.6, -D / 2 + 0.4]} intensity={2.2} distance={5} color="#6f9cff" />
    </group>
  )
}

/* ------------------------------------------------------------- BUILDING */

export function Building() {
  const facade = useMemo(() => getFacadeTexture({ cols: 5, rows: 14, seed: 3, litRatio: 0.55 }), [])
  const facadeMat = useMemo(
    () => new THREE.MeshStandardMaterial({ map: facade, emissiveMap: facade, emissive: '#ffffff', emissiveIntensity: 1.05, color: '#1b2233', roughness: 0.85, metalness: 0.15 }),
    [facade]
  )
  const roofMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#1a2130', roughness: 0.95 }), [])
  // A small pool of facades so neighbouring towers aren't identical clones.
  const pool = useMemo(() => [3, 9, 15, 21].map((seed) => {
    const tex = getFacadeTexture({ cols: 4 + (seed % 3), rows: 12 + (seed % 8), seed, litRatio: 0.4 + (seed % 5) * 0.05 })
    return new THREE.MeshStandardMaterial({ map: tex, emissiveMap: tex, emissive: '#ffffff', emissiveIntensity: 0.9, color: '#141b2a', roughness: 0.9, metalness: 0.18 })
  }), [])
  useEffect(() => () => { facadeMat.dispose(); roofMat.dispose(); pool.forEach((m) => m.dispose()) }, [facadeMat, roofMat, pool])

  const neighbors = useMemo(() => {
    const rng = mulberry32(12)
    return Array.from({ length: 8 }, (_, i) => {
      const side = i < 5 ? -1 : 1
      const w = 3.4 + rng() * 3.4
      const h = 13 + rng() * 27
      return {
        x: side * (7 + rng() * 7) + (rng() - 0.5) * 3,
        z: -5 - rng() * 13,
        w, d: w * (0.8 + rng() * 0.5), h,
        inset: 0.5 + rng() * 0.28,
        tierH: h * (0.18 + rng() * 0.24),
        mat: i % pool.length,
        beacon: h > 30,
      }
    })
  }, [pool])

  const H = 30, W = 12
  return (
    <group>
      {/* Ground / plaza */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[80, 80]} />
        <meshStandardMaterial color="#0a0f1a" roughness={1} />
      </mesh>
      {/* Main tower with setbacks (base → mid → crown). */}
      <group position={[0, 0, 0]}>
        <mesh position={[0, H * 0.31, 0]} castShadow>
          <boxGeometry args={[W, H * 0.62, 8]} />
          <primitive object={facadeMat} attach="material" />
        </mesh>
        <mesh position={[0, H * 0.735, 0]}>
          <boxGeometry args={[W * 0.78, H * 0.23, 6.4]} />
          <primitive object={facadeMat} attach="material" />
        </mesh>
        <mesh position={[0, H * 0.925, 0]}>
          <boxGeometry args={[W * 0.52, H * 0.15, 4.9]} />
          <primitive object={facadeMat} attach="material" />
        </mesh>
        {/* Rooftop equipment */}
        <mesh position={[-2.0, H + 0.5, 1]}>
          <cylinderGeometry args={[0.7, 0.7, 1.2, 12]} />
          <primitive object={roofMat} attach="material" />
        </mesh>
        <mesh position={[2.0, H + 0.4, -1]}>
          <boxGeometry args={[1.9, 0.9, 1.9]} />
          <primitive object={roofMat} attach="material" />
        </mesh>
        {/* Antenna + beacon */}
        <mesh position={[0, H + 3.6, 0]}>
          <cylinderGeometry args={[0.06, 0.06, 6.4, 6]} />
          <meshStandardMaterial color="#2a3247" roughness={0.6} metalness={0.7} />
        </mesh>
        <mesh position={[0, H + 7, 0]}>
          <sphereGeometry args={[0.18, 10, 10]} />
          <meshStandardMaterial color="#ff5b5b" emissive="#ff3b3b" emissiveIntensity={2.5} />
        </mesh>
      </group>

      {/* Neighbouring silhouettes: varied facades + a stepped upper tier. */}
      {neighbors.map((n, i) => (
        <group key={i} position={[n.x, 0, n.z]}>
          <mesh position={[0, (n.h - n.tierH) / 2, 0]}>
            <boxGeometry args={[n.w, n.h - n.tierH, n.d]} />
            <primitive object={pool[n.mat]} attach="material" />
          </mesh>
          <mesh position={[0, n.h - n.tierH / 2, 0]}>
            <boxGeometry args={[n.w * n.inset, n.tierH, n.d * n.inset]} />
            <primitive object={pool[(n.mat + 1) % pool.length]} attach="material" />
          </mesh>
          <mesh position={[0, n.h + 0.2, 0]}>
            <boxGeometry args={[n.w * n.inset * 0.7, 0.4, n.d * n.inset * 0.7]} />
            <primitive object={roofMat} attach="material" />
          </mesh>
          {n.beacon && (
            <mesh position={[0, n.h + 0.9, 0]}>
              <sphereGeometry args={[0.14, 8, 8]} />
              <meshStandardMaterial color="#ff5b5b" emissive="#ff3b3b" emissiveIntensity={2.2} />
            </mesh>
          )}
        </group>
      ))}

      <ContactShadow radius={6} opacity={0.5} />
      <pointLight position={[0, 4, 12]} intensity={4} distance={30} color="#7fa8ff" />
    </group>
  )
}

/* ----------------------------------------------------------------- CITY */

export function City() {
  const road = useMemo(() => getRoadTexture(), [])
  const roadMat = useMemo(() => new THREE.MeshStandardMaterial({ map: road, roughness: 1 }), [road])
  useEffect(() => () => roadMat.dispose(), [roadMat])

  // Five shared facade materials; buildings pick one so draw state is reused.
  const facadeMats = useMemo(() => {
    return [
      getFacadeTexture({ cols: 6, rows: 18, seed: 11, litRatio: 0.5 }),
      getFacadeTexture({ cols: 5, rows: 12, seed: 22, litRatio: 0.6 }),
      getFacadeTexture({ cols: 8, rows: 22, seed: 33, litRatio: 0.45 }),
      getFacadeTexture({ cols: 4, rows: 9, seed: 44, litRatio: 0.65 }),
      getFacadeTexture({ cols: 7, rows: 15, seed: 55, litRatio: 0.5 }),
    ].map((tex) => new THREE.MeshStandardMaterial({
      map: tex, emissiveMap: tex, emissive: '#ffffff', emissiveIntensity: 1.0,
      color: '#141b2b', roughness: 0.9, metalness: 0.2,
    }))
  }, [])
  const roofMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#0d1320', roughness: 1 }), [])
  useEffect(() => () => { facadeMats.forEach((m) => m.dispose()); roofMat.dispose() }, [facadeMats, roofMat])

  // Three concentric rings of blocks; a couple of roads cut through. Blocks
  // vary in footprint, height and how many setback tiers they stack so the
  // skyline doesn't read as one repeated box.
  const blocks = useMemo(() => {
    const rng = mulberry32(2024)
    const out = []
    const rings = [
      { count: 26, rMin: 12, rMax: 32, hMin: 16, hMax: 52 },
      { count: 44, rMin: 34, rMax: 66, hMin: 10, hMax: 36 },
      { count: 70, rMin: 70, rMax: 122, hMin: 6, hMax: 22 },
    ]
    rings.forEach((ring, ri) => {
      for (let i = 0; i < ring.count; i++) {
        const a = (i / ring.count) * Math.PI * 2 + rng() * 0.16
        const r = ring.rMin + rng() * (ring.rMax - ring.rMin)
        const h = ring.hMin + rng() * (ring.hMax - ring.hMin)
        const w = 2.6 + rng() * 5
        out.push({
          x: Math.cos(a) * r, z: Math.sin(a) * r,
          w, d: w * (0.6 + rng() * 0.7), h,
          tiers: rng() < 0.5 ? (rng() < 0.5 ? 1 : 2) : 0,
          inset: 0.6 + rng() * 0.24,
          tierH: h * (0.14 + rng() * 0.2),
          mat: (ri + i) % facadeMats.length,
          beacon: h > 40 && rng() < 0.5,
        })
      }
    })
    return out
  }, [facadeMats])

  return (
    <group>
      {/* Ground with road grid */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[400, 400]} />
        <primitive object={roadMat} attach="material" />
      </mesh>
      {blocks.map((b, i) => {
        const tierH = b.tiers ? b.tierH : 0
        const totalTierH = b.tiers === 2 ? tierH * 1.7 : tierH
        const baseH = b.h - totalTierH
        return (
          <group key={i} position={[b.x, 0, b.z]}>
            <mesh position={[0, baseH / 2, 0]}>
              <boxGeometry args={[b.w, baseH, b.d]} />
              <primitive object={facadeMats[b.mat]} attach="material" />
            </mesh>
            {b.tiers >= 1 && (
              <mesh position={[0, baseH + tierH / 2, 0]}>
                <boxGeometry args={[b.w * b.inset, tierH, b.d * b.inset]} />
                <primitive object={facadeMats[(b.mat + 1) % facadeMats.length]} attach="material" />
              </mesh>
            )}
            {b.tiers === 2 && (
              <mesh position={[0, baseH + tierH * 1.2 + tierH * 0.35, 0]}>
                <boxGeometry args={[b.w * b.inset * b.inset, tierH * 0.7, b.d * b.inset * b.inset]} />
                <primitive object={facadeMats[(b.mat + 2) % facadeMats.length]} attach="material" />
              </mesh>
            )}
            <mesh position={[0, b.h + 0.15, 0]}>
              <boxGeometry args={[b.w * 0.55, 0.3, b.d * 0.55]} />
              <primitive object={roofMat} attach="material" />
            </mesh>
            {b.beacon && (
              <mesh position={[0, b.h + 0.7, 0]}>
                <sphereGeometry args={[0.16, 8, 8]} />
                <meshStandardMaterial color="#ff5b5b" emissive="#ff3b3b" emissiveIntensity={2} />
              </mesh>
            )}
          </group>
        )
      })}
      {/* Street-level glow hints */}
      <pointLight position={[0, 6, 0]} intensity={6} distance={60} color="#ffca7a" />
      <pointLight position={[40, 8, 40]} intensity={3} distance={50} color="#7fb0ff" />
      <pointLight position={[-40, 8, -30]} intensity={3} distance={50} color="#7fb0ff" />
    </group>
  )
}
