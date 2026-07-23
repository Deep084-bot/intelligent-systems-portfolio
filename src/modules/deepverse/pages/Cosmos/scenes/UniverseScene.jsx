import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const GALAXY_COUNT = 2000

// Generate cosmic web structure with filaments and clusters
function createCosmicWebGeometry() {
  const positions = new Float32Array(GALAXY_COUNT * 3)
  const colors = new Float32Array(GALAXY_COUNT * 3)
  const sizes = new Float32Array(GALAXY_COUNT)

  // Create galaxy cluster centers
  const clusters = []
  const clusterCount = 15

  for (let c = 0; c < clusterCount; c++) {
    const theta = Math.random() * Math.PI * 2
    const phi = Math.acos(2 * Math.random() - 1)
    const r = 30 + Math.random() * 50

    clusters.push({
      x: r * Math.sin(phi) * Math.cos(theta),
      y: r * Math.sin(phi) * Math.sin(theta) * 0.3, // Flattened
      z: r * Math.cos(phi),
      radius: 5 + Math.random() * 10,
      galaxies: Math.floor(50 + Math.random() * 150),
    })
  }

  let index = 0

  // Generate galaxies in clusters and filaments
  for (let c = 0; c < clusters.length; c++) {
    const cluster = clusters[c]
    const clusterGalaxies = Math.min(cluster.galaxies, Math.floor(GALAXY_COUNT * 0.7 / clusterCount))

    for (let i = 0; i < clusterGalaxies && index < GALAXY_COUNT; i++) {
      // Clustered distribution
      const angle = Math.random() * Math.PI * 2
      const dist = Math.pow(Math.random(), 0.5) * cluster.radius

      const x = cluster.x + Math.cos(angle) * dist
      const y = cluster.y + (Math.random() - 0.5) * dist * 0.5
      const z = cluster.z + Math.sin(angle) * dist

      positions[index * 3] = x
      positions[index * 3 + 1] = y
      positions[index * 3 + 2] = z

      // Cluster galaxies are varied
      const colorType = Math.random()
      if (colorType > 0.7) {
        // Elliptical - yellowish
        colors[index * 3] = 1.0
        colors[index * 3 + 1] = 0.9
        colors[index * 3 + 2] = 0.75
      } else if (colorType > 0.4) {
        // Spiral - white/blue
        colors[index * 3] = 0.9
        colors[index * 3 + 1] = 0.95
        colors[index * 3 + 2] = 1.0
      } else {
        // Irregular - blue
        colors[index * 3] = 0.7
        colors[index * 3 + 1] = 0.8
        colors[index * 3 + 2] = 1.0
      }

      sizes[index] = 0.3 + Math.random() * 0.7
      index++
    }
  }

  // Fill remaining with intergalactic field galaxies
  while (index < GALAXY_COUNT) {
    const theta = Math.random() * Math.PI * 2
    const phi = Math.acos(2 * Math.random() - 1)
    const r = 20 + Math.random() * 70

    positions[index * 3] = r * Math.sin(phi) * Math.cos(theta)
    positions[index * 3 + 1] = r * Math.sin(phi) * Math.sin(theta) * 0.2
    positions[index * 3 + 2] = r * Math.cos(phi)

    // Field galaxies - mostly blue
    if (Math.random() > 0.5) {
      colors[index * 3] = 0.7 + Math.random() * 0.3
      colors[index * 3 + 1] = 0.8 + Math.random() * 0.2
      colors[index * 3 + 2] = 1.0
    } else {
      colors[index * 3] = 1.0
      colors[index * 3 + 1] = 0.95
      colors[index * 3 + 2] = 0.9
    }

    sizes[index] = 0.2 + Math.random() * 0.4
    index++
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1))

  return geometry
}

// Galaxy clusters (larger, brighter)
function GalaxyClusters({ blend }) {
  const ref = useRef()

  const { positions, sizes, colors } = useMemo(() => {
    const count = 30
    const pos = new Float32Array(count * 3)
    const s = new Float32Array(count)
    const c = new Float32Array(count * 3)

    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      const r = 40 + Math.random() * 40

      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta)
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta) * 0.25
      pos[i * 3 + 2] = r * Math.cos(phi)

      s[i] = 3 + Math.random() * 5

      // Bright elliptical galaxies
      c[i * 3] = 1.0
      c[i * 3 + 1] = 0.95
      c[i * 3 + 2] = 0.85
    }

    return { positions: pos, sizes: s, colors: c }
  }, [])

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1))
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    return geo
  }, [positions, sizes, colors])

  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uBlend: { value: blend },
      },
      vertexShader: `
        attribute float size;
        attribute vec3 color;
        varying vec3 vColor;
        varying float vSize;
        uniform float uTime;

        void main() {
          vColor = color;
          vSize = size;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);

          float pulse = 0.8 + 0.2 * sin(uTime * 0.5 + position.x * 0.1);

          gl_PointSize = size * pulse * 150.0 / -mvPosition.z;
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        varying float vSize;
        uniform float uBlend;

        void main() {
          float dist = length(gl_PointCoord - vec2(0.5));
          if (dist > 0.5) discard;

          // Soft elliptical glow
          float alpha = smoothstep(0.5, 0.0, dist);

          gl_FragColor = vec4(vColor, alpha * uBlend * 0.8);
        }
      `,
      transparent: true,
      vertexColors: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
  }, [blend])

  useFrame(({ clock }) => {
    if (ref.current) {
      ref.current.material.uniforms.uTime.value = clock.getElapsedTime()
    }
  })

  return <points ref={ref} geometry={geometry} material={material} frustumCulled={false} />
}

// Main galaxy field
function GalaxyField({ blend }) {
  const ref = useRef()

  const geometry = useMemo(() => createCosmicWebGeometry(), [])

  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uBlend: { value: blend },
      },
      vertexShader: `
        attribute float size;
        attribute vec3 color;
        varying vec3 vColor;
        varying float vSize;
        uniform float uTime;

        void main() {
          vColor = color;
          vSize = size;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);

          float twinkle = 0.7 + 0.3 * sin(uTime * 2.0 + position.x + position.z);

          gl_PointSize = size * twinkle * 80.0 / -mvPosition.z;
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        varying float vSize;
        uniform float uBlend;

        void main() {
          float dist = length(gl_PointCoord - vec2(0.5));
          if (dist > 0.5) discard;

          float alpha = smoothstep(0.5, 0.0, dist);

          gl_FragColor = vec4(vColor, alpha * uBlend);
        }
      `,
      transparent: true,
      vertexColors: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
  }, [blend])

  useFrame(({ clock }) => {
    if (ref.current) {
      ref.current.material.uniforms.uTime.value = clock.getElapsedTime()
    }
  })

  return <points ref={ref} geometry={geometry} material={material} frustumCulled={false} />
}

// Nebula regions
function Nebulae({ blend }) {
  const groupRef = useRef()

  const nebulae = useMemo(() => {
    const result = []
    for (let i = 0; i < 12; i++) {
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      const r = 25 + Math.random() * 50

      result.push({
        position: [
          r * Math.sin(phi) * Math.cos(theta),
          r * Math.sin(phi) * Math.sin(theta) * 0.2,
          r * Math.cos(phi),
        ],
        scale: 8 + Math.random() * 15,
        hue: 240 + Math.random() * 60, // Blue to purple
        rotation: Math.random() * Math.PI,
      })
    }
    return result
  }, [])

  useFrame(({ clock }) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = clock.getElapsedTime() * 0.002
    }
  })

  return (
    <group ref={groupRef}>
      {nebulae.map((nebula, i) => (
        <mesh
          key={i}
          position={nebula.position}
          rotation={[0, 0, nebula.rotation]}
        >
          <planeGeometry args={[nebula.scale, nebula.scale]} />
          <meshBasicMaterial
            color={`hsl(${nebula.hue}, 60%, 15%)`}
            transparent
            opacity={blend * 0.08}
            side={THREE.DoubleSide}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      ))}
    </group>
  )
}

// Distant background stars
function BackgroundStars({ blend }) {
  const ref = useRef()

  const { positions, sizes } = useMemo(() => {
    const count = 1000
    const pos = new Float32Array(count * 3)
    const s = new Float32Array(count)

    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      const r = 80 + Math.random() * 20

      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta)
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
      pos[i * 3 + 2] = r * Math.cos(phi)

      s[i] = 0.1 + Math.random() * 0.3
    }

    return { positions: pos, sizes: s }
  }, [])

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1))
    return geo
  }, [positions, sizes])

  useFrame(({ clock }) => {
    if (ref.current) {
      const t = clock.getElapsedTime()
      ref.current.material.opacity = blend * 0.3
      ref.current.rotation.y = t * 0.001
    }
  })

  return (
    <points ref={ref} geometry={geometry}>
      <pointsMaterial
        color="#aabbcc"
        size={0.5}
        transparent
        opacity={blend * 0.3}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}

export default function UniverseScene({ blend }) {
  return (
    <group>
      <BackgroundStars blend={blend} />
      <Nebulae blend={blend} />
      <GalaxyField blend={blend} />
      <GalaxyClusters blend={blend} />
    </group>
  )
}
