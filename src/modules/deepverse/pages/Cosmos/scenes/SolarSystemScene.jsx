import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// Planet data with colors and characteristics
const PLANET_DATA = [
  { name: 'Mercury', dist: 5, r: 0.25, color: '#a0a0a0', roughness: 0.9 },
  { name: 'Venus', dist: 7, r: 0.4, color: '#d4a574', roughness: 0.7 },
  { name: 'Earth', dist: 10, r: 0.45, color: '#4488cc', roughness: 0.6, hasAtmosphere: true },
  { name: 'Mars', dist: 13, r: 0.3, color: '#c45c3a', roughness: 0.85 },
  { name: 'Jupiter', dist: 18, r: 1.2, color: '#d4a574', roughness: 0.5, hasBands: true },
  { name: 'Saturn', dist: 24, r: 1.0, color: '#e4c896', roughness: 0.5, hasRings: true },
  { name: 'Uranus', dist: 30, r: 0.6, color: '#88ccdd', roughness: 0.4 },
  { name: 'Neptune', dist: 35, r: 0.55, color: '#4466cc', roughness: 0.4 },
]

// Create procedural planet textures
function createPlanetTexture(baseColor, hasBands = false) {
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 128
  const ctx = canvas.getContext('2d')

  // Parse base color
  const tempColor = new THREE.Color(baseColor)
  const r = Math.floor(tempColor.r * 255)
  const g = Math.floor(tempColor.g * 255)
  const b = Math.floor(tempColor.b * 255)

  if (hasBands) {
    // Jupiter-like bands
    const bandCount = 12
    for (let y = 0; y < 128; y++) {
      const bandIndex = Math.floor(y / (128 / bandCount))
      const variation = Math.sin(bandIndex * 1.5) * 30

      for (let x = 0; x < 256; x++) {
        const noise = (Math.random() - 0.5) * 20
        const finalR = Math.max(0, Math.min(255, r + variation + noise))
        const finalG = Math.max(0, Math.min(255, g + variation * 0.8 + noise))
        const finalB = Math.max(0, Math.min(255, b + variation * 0.5 + noise))

        ctx.fillStyle = `rgb(${finalR},${finalG},${finalB})`
        ctx.fillRect(x, y, 1, 1)
      }
    }
  } else {
    // Solid with noise
    for (let y = 0; y < 128; y++) {
      for (let x = 0; x < 256; x++) {
        const noise = (Math.random() - 0.5) * 20
        const finalR = Math.max(0, Math.min(255, r + noise))
        const finalG = Math.max(0, Math.min(255, g + noise))
        const finalB = Math.max(0, Math.min(255, b + noise))

        ctx.fillStyle = `rgb(${finalR},${finalG},${finalB})`
        ctx.fillRect(x, y, 1, 1)
      }
    }
  }

  const texture = new THREE.CanvasTexture(canvas)
  texture.wrapS = THREE.RepeatWrapping
  return texture
}

// Saturn's rings
function SaturnRings({ blend }) {
  const innerRadius = 1.3
  const outerRadius = 2.2

  const ringGeometry = useMemo(() => {
    const segments = 64
    const rings = 20
    const positions = []
    const colors = []
    const indices = []

    let vertexIndex = 0

    for (let r = 0; r <= rings; r++) {
      const radius = innerRadius + (outerRadius - innerRadius) * (r / rings)
      for (let s = 0; s <= segments; s++) {
        const theta = (s / segments) * Math.PI * 2

        const x = Math.cos(theta) * radius
        const z = Math.sin(theta) * radius
        positions.push(x, 0, z)

        // Ring color varies with distance
        const distFactor = r / rings
        const brightness = 0.7 + Math.random() * 0.3
        colors.push(brightness * 0.9, brightness * 0.85, brightness * 0.7)

        if (r < rings && s < segments) {
          const current = vertexIndex
          const next = vertexIndex + segments + 1
          const nextRow = vertexIndex + 1

          indices.push(current, next, nextRow)
          indices.push(next, next + 1, nextRow)
        }

        vertexIndex++
      }
    }

    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
    geometry.setIndex(indices)
    geometry.computeVertexNormals()

    return geometry
  }, [innerRadius, outerRadius])

  return (
    <mesh geometry={ringGeometry} rotation={[Math.PI / 2 + 0.4, 0, 0]}>
      <meshBasicMaterial
        vertexColors
        transparent
        opacity={blend * 0.7}
        side={THREE.DoubleSide}
        depthWrite={false}
      />
    </mesh>
  )
}

// Individual planet
function Planet({ data, blend, planetRef }) {
  const meshRef = useRef()

  const texture = useMemo(() => createPlanetTexture(data.color, data.hasBands), [data])

  useFrame(({ clock }) => {
    if (meshRef.current && planetRef) {
      const t = clock.getElapsedTime()
      const angle = t * (0.05 + data.dist * 0.005) + data.dist
      const x = Math.cos(angle) * data.dist
      const z = Math.sin(angle) * data.dist
      meshRef.current.position.x = x
      meshRef.current.position.z = z

      // Self rotation
      meshRef.current.rotation.y = t * 0.2

      // Update ref for parent
      if (planetRef) {
        planetRef.current = meshRef.current
      }
    }
  })

  return (
    <group>
      <mesh ref={meshRef}>
        <sphereGeometry args={[data.r, 24, 24]} />
        <meshStandardMaterial
          map={texture}
          roughness={data.roughness}
          metalness={0.1}
        />
      </mesh>

      {/* Atmosphere for Earth-like planets */}
      {data.hasAtmosphere && (
        <mesh position={meshRef.current?.position || [0, 0, 0]}>
          <sphereGeometry args={[data.r * 1.05, 16, 16]} />
          <meshBasicMaterial
            color="#88ccff"
            transparent
            opacity={blend * 0.15}
            depthWrite={false}
          />
        </mesh>
      )}

      {/* Saturn's rings */}
      {data.hasRings && <SaturnRings blend={blend} />}
    </group>
  )
}

// Orbit path
function OrbitPath({ distance, blend }) {
  const points = useMemo(() => {
    const pts = []
    const segments = 64
    for (let i = 0; i <= segments; i++) {
      const theta = (i / segments) * Math.PI * 2
      pts.push(Math.cos(theta) * distance, 0, Math.sin(theta) * distance)
    }
    return pts
  }, [distance])

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.Float32BufferAttribute(points, 3))
    return geo
  }, [points])

  return (
    <line geometry={geometry}>
      <lineBasicMaterial
        color="#ffffff"
        transparent
        opacity={blend * 0.08}
        depthWrite={false}
      />
    </line>
  )
}

// Sun with glow
function Sun({ blend }) {
  const glowRef = useRef()

  useFrame(({ clock }) => {
    if (glowRef.current) {
      const t = clock.getElapsedTime()
      const pulse = 1 + 0.05 * Math.sin(t * 0.5)
      glowRef.current.scale.setScalar(pulse)
    }
  })

  return (
    <group>
      {/* Sun core */}
      <mesh>
        <sphereGeometry args={[1.8, 32, 32]} />
        <meshBasicMaterial color="#ffee88" />
      </mesh>

      {/* Sun glow */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[2.5, 24, 24]} />
        <meshBasicMaterial
          color="#ffaa44"
          transparent
          opacity={blend * 0.25}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Corona */}
      <mesh scale={1.3}>
        <sphereGeometry args={[1.8, 16, 16]} />
        <meshBasicMaterial
          color="#ff6622"
          transparent
          opacity={blend * 0.1}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  )
}

// Asteroid belt (simplified)
function AsteroidBelt({ blend }) {
  const ref = useRef()
  const count = 200

  const { positions, sizes } = useMemo(() => {
    const pos = new Float32Array(count * 3)
    const s = new Float32Array(count)

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2
      const radius = 14.5 + (Math.random() - 0.5) * 2
      const height = (Math.random() - 0.5) * 0.5

      pos[i * 3] = Math.cos(angle) * radius
      pos[i * 3 + 1] = height
      pos[i * 3 + 2] = Math.sin(angle) * radius

      s[i] = 0.05 + Math.random() * 0.1
    }

    return { positions: pos, sizes: s }
  }, [count])

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1))
    return geo
  }, [positions, sizes])

  useFrame(({ clock }) => {
    if (ref.current) {
      ref.current.rotation.y = clock.getElapsedTime() * 0.01
    }
  })

  return (
    <points ref={ref} geometry={geometry}>
      <pointsMaterial
        color="#888888"
        size={0.15}
        transparent
        opacity={blend * 0.5}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  )
}

export default function SolarSystemScene({ blend }) {
  const groupRef = useRef()
  const planetRefs = useRef(PLANET_DATA.map(() => ({ current: null })))

  useFrame(({ clock }) => {
    if (groupRef.current) {
      groupRef.current.rotation.z = clock.getElapsedTime() * 0.008
    }
  })

  return (
    <group ref={groupRef}>
      {/* Sun */}
      <Sun blend={blend} />

      {/* Planets */}
      {PLANET_DATA.map((data, i) => (
        <Planet key={data.name} data={data} blend={blend} planetRef={planetRefs.current[i]} />
      ))}

      {/* Orbit paths */}
      {PLANET_DATA.map((data) => (
        <OrbitPath key={`orbit-${data.name}`} distance={data.dist} blend={blend} />
      ))}

      {/* Asteroid belt */}
      <AsteroidBelt blend={blend} />

      {/* Lighting */}
      <pointLight position={[0, 0, 0]} color="#fffaf0" intensity={blend * 2} distance={80} decay={1} />
      <ambientLight intensity={blend * 0.1} color="#333355" />
    </group>
  )
}
