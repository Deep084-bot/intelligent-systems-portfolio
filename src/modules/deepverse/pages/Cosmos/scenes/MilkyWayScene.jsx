import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const STAR_COUNT = 8000
const ARM_COUNT = 5

// Create spiral galaxy with multiple arms
function createGalaxyGeometry() {
  const positions = new Float32Array(STAR_COUNT * 3)
  const colors = new Float32Array(STAR_COUNT * 3)
  const sizes = new Float32Array(STAR_COUNT)
  const galaxyR = 80

  let starIndex = 0

  // Galactic core (bulge) - inner region
  const coreCount = Math.floor(STAR_COUNT * 0.15)
  for (let i = 0; i < coreCount; i++) {
    // Elliptical distribution for core
    const angle = Math.random() * Math.PI * 2
    const r = Math.pow(Math.random(), 0.5) * 10
    const height = (Math.random() - 0.5) * 3

    const x = Math.cos(angle) * r
    const z = Math.sin(angle) * r * 0.7 // Flattened core

    positions[starIndex * 3] = x
    positions[starIndex * 3 + 1] = height
    positions[starIndex * 3 + 2] = z

    // Core stars are older - yellower
    const colorRand = Math.random()
    if (colorRand > 0.7) {
      colors[starIndex * 3] = 1.0
      colors[starIndex * 3 + 1] = 0.9
      colors[starIndex * 3 + 2] = 0.7
    } else if (colorRand > 0.3) {
      colors[starIndex * 3] = 1.0
      colors[starIndex * 3 + 1] = 0.95
      colors[starIndex * 3 + 2] = 0.85
    } else {
      colors[starIndex * 3] = 0.9
      colors[starIndex * 3 + 1] = 0.85
      colors[starIndex * 3 + 2] = 0.8
    }

    sizes[starIndex] = 0.3 + Math.random() * 0.5
    starIndex++
  }

  // Spiral arms
  const armStars = STAR_COUNT - coreCount
  const starsPerArm = Math.floor(armStars / ARM_COUNT)

  for (let arm = 0; arm < ARM_COUNT; arm++) {
    const armOffset = (arm / ARM_COUNT) * Math.PI * 2

    for (let i = 0; i < starsPerArm; i++) {
      // Distance from center - more stars in middle
      const t = Math.pow(Math.random(), 0.7)
      const r = 8 + t * (galaxyR - 8)

      // Logarithmic spiral
      const armSpread = 0.3 + t * 0.5
      const armAngle = armOffset + r * 0.08 + (Math.random() - 0.5) * armSpread

      // Height variation - disk gets thinner further out
      const diskHeight = 0.5 + t * 2
      const height = (Math.random() - 0.5) * diskHeight

      const x = Math.cos(armAngle) * r
      const z = Math.sin(armAngle) * r

      // Add some scatter
      const scatter = (Math.random() - 0.5) * 3
      positions[starIndex * 3] = x + scatter
      positions[starIndex * 3 + 1] = height + scatter * 0.3
      positions[starIndex * 3 + 2] = z + scatter

      // Star colors based on distance - inner = older/yellow, outer = newer/blue
      const colorRand = Math.random()
      const distFactor = t

      if (distFactor < 0.3) {
        // Inner - older stars, yellowish
        if (colorRand > 0.6) {
          colors[starIndex * 3] = 1.0
          colors[starIndex * 3 + 1] = 0.9
          colors[starIndex * 3 + 2] = 0.7
        } else {
          colors[starIndex * 3] = 1.0
          colors[starIndex * 3 + 1] = 0.85
          colors[starIndex * 3 + 2] = 0.8
        }
      } else if (distFactor < 0.6) {
        // Middle - sun-like stars
        if (colorRand > 0.5) {
          colors[starIndex * 3] = 1.0
          colors[starIndex * 3 + 1] = 1.0
          colors[starIndex * 3 + 2] = 0.9
        } else {
          colors[starIndex * 3] = 0.9
          colors[starIndex * 3 + 1] = 0.95
          colors[starIndex * 3 + 2] = 1.0
        }
      } else {
        // Outer - young stars, blue
        if (colorRand > 0.6) {
          colors[starIndex * 3] = 0.7
          colors[starIndex * 3 + 1] = 0.85
          colors[starIndex * 3 + 2] = 1.0
        } else if (colorRand > 0.3) {
          colors[starIndex * 3] = 0.8
          colors[starIndex * 3 + 1] = 0.9
          colors[starIndex * 3 + 2] = 1.0
        } else {
          colors[starIndex * 3] = 1.0
          colors[starIndex * 3 + 1] = 0.95
          colors[starIndex * 3 + 2] = 0.9
        }
      }

      // Size variation
      const sizeRand = Math.random()
      if (sizeRand > 0.995) {
        sizes[starIndex] = 1.5 + Math.random() * 1.0 // Giant stars
      } else if (sizeRand > 0.97) {
        sizes[starIndex] = 0.8 + Math.random() * 0.5 // Bright stars
      } else {
        sizes[starIndex] = 0.2 + Math.random() * 0.4 // Regular stars
      }

      starIndex++
    }
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1))

  return geometry
}

// Galaxy core glow
function GalaxyCore({ blend }) {
  const ref = useRef()

  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
      },
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vPosition;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        varying vec3 vNormal;
        varying vec3 vPosition;

        void main() {
          vec3 viewDir = normalize(-vPosition);
          float intensity = pow(0.4 - dot(vNormal, viewDir), 2.0);

          // Subtle pulse
          float pulse = 0.9 + 0.1 * sin(uTime * 0.5);

          vec3 color = mix(vec3(1.0, 0.8, 0.5), vec3(1.0, 0.95, 0.8), intensity);

          gl_FragColor = vec4(color, intensity * pulse * 0.4);
        }
      `,
      transparent: true,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
  }, [])

  useFrame(({ clock }) => {
    if (ref.current) {
      ref.current.material.uniforms.uTime.value = clock.getElapsedTime()
    }
  })

  return (
    <mesh ref={ref} scale={1.5}>
      <sphereGeometry args={[8, 32, 32]} />
      <primitive object={material} attach="material" />
    </mesh>
  )
}

// Dust lanes (darker regions)
function DustLanes({ blend }) {
  const groupRef = useRef()

  const lanes = useMemo(() => {
    const result = []
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2
      result.push({
        angle,
        width: 0.3 + Math.random() * 0.4,
        length: 20 + Math.random() * 30,
      })
    }
    return result
  }, [])

  useFrame(({ clock }) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = clock.getElapsedTime() * 0.005
    }
  })

  return (
    <group ref={groupRef}>
      {lanes.map((lane, i) => (
        <mesh
          key={i}
          position={[Math.cos(lane.angle) * lane.length * 0.4, 0, Math.sin(lane.angle) * lane.length * 0.4]}
          rotation={[Math.PI / 2, lane.angle, 0]}
        >
          <planeGeometry args={[lane.width, lane.length]} />
          <meshBasicMaterial
            color="#0a0a15"
            transparent
            opacity={blend * 0.15}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  )
}

// Stars material
function GalaxyStars({ blend }) {
  const ref = useRef()

  const geometry = useMemo(() => createGalaxyGeometry(), [])

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

          // Twinkle
          float twinkle = 0.7 + 0.3 * sin(uTime * 3.0 + position.x * 0.5 + position.z * 0.3);

          gl_PointSize = size * twinkle * 100.0 / -mvPosition.z;
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

          // Brighter center
          float centerGlow = 1.0;

          gl_FragColor = vec4(vColor * centerGlow, alpha * uBlend);
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
      ref.current.rotation.y = clock.getElapsedTime() * 0.008
      ref.current.material.uniforms.uTime.value = clock.getElapsedTime()
    }
  })

  return (
    <points ref={ref} geometry={geometry} material={material} frustumCulled={false} />
  )
}

// Outer halo
function GalacticHalo({ blend }) {
  const ref = useRef()

  useFrame(({ clock }) => {
    if (ref.current) {
      ref.current.rotation.y = clock.getElapsedTime() * 0.003
    }
  })

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={500}
          array={(() => {
            const arr = new Float32Array(500 * 3)
            for (let i = 0; i < 500; i++) {
              const theta = Math.random() * Math.PI * 2
              const phi = Math.acos(2 * Math.random() - 1)
              const r = 60 + Math.random() * 40
              arr[i * 3] = r * Math.sin(phi) * Math.cos(theta)
              arr[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
              arr[i * 3 + 2] = r * Math.cos(phi)
            }
            return arr
          })()}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        color="#aabbcc"
        size={0.5}
        transparent
        opacity={blend * 0.15}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}

export default function MilkyWayScene({ blend }) {
  return (
    <group>
      <GalaxyStars blend={blend} />
      <GalaxyCore blend={blend} />
      <DustLanes blend={blend} />
      <GalacticHalo blend={blend} />
    </group>
  )
}
