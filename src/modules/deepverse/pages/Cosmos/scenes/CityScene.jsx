import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// Generate city skyline data
function generateCityData() {
  const buildings = []
  const gridSize = 8
  const spacing = 0.8

  for (let x = -gridSize; x <= gridSize; x++) {
    for (let z = -gridSize; z <= gridSize; z++) {
      // Distance from center - fewer buildings in middle for visual interest
      const dist = Math.sqrt(x * x + z * z)
      if (dist > gridSize * 0.9) continue

      // Random height based on distance from center
      let height
      if (dist < 2) {
        // Downtown - tall buildings
        height = 3 + Math.random() * 6
      } else if (dist < 5) {
        // Midtown - medium buildings
        height = 1.5 + Math.random() * 4
      } else {
        // Suburbs - low buildings
        height = 0.5 + Math.random() * 2
      }

      // Skip some spots for streets
      if (Math.random() > 0.7) continue

      // Building dimensions
      const width = 0.2 + Math.random() * 0.4
      const depth = 0.2 + Math.random() * 0.4

      // Position with some randomness
      const px = x * spacing + (Math.random() - 0.5) * 0.3
      const pz = z * spacing + (Math.random() - 0.5) * 0.3

      // Window pattern
      const windowRows = Math.floor(height * 3)
      const windowCols = Math.floor(width * 5)

      // Building type
      const type = dist < 2 ? 'skyscraper' : dist < 5 ? 'office' : 'residential'

      buildings.push({
        x: px,
        z: pz,
        width,
        height,
        depth,
        windowRows,
        windowCols,
        type,
        lit: Math.random() > 0.3,
      })
    }
  }

  return buildings
}

// Create building window texture
function createBuildingTexture(width, height, rows, cols, lit) {
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(64, cols * 8)
  canvas.height = Math.max(128, rows * 8)
  const ctx = canvas.getContext('2d')

  // Base color
  if (lit) {
    ctx.fillStyle = '#0a1525'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
  } else {
    ctx.fillStyle = '#050810'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
  }

  const cellW = canvas.width / cols
  const cellH = canvas.height / rows

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      if (Math.random() > 0.6) continue

      const x = col * cellW
      const y = row * cellH

      // Random warmth
      const warmth = Math.random()
      let r, g, b
      if (warmth > 0.6) {
        r = 255; g = 200 + Math.random() * 55; b = 100 + Math.random() * 80
      } else if (warmth > 0.3) {
        r = 200 + Math.random() * 55; g = 220 + Math.random() * 35; b = 255
      } else {
        r = 100 + Math.random() * 80; g = 200 + Math.random() * 55; b = 255
      }

      const gradient = ctx.createRadialGradient(
        x + cellW / 2, y + cellH / 2, 0,
        x + cellW / 2, y + cellH / 2, cellW * 0.4
      )
      gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0.85)`)
      gradient.addColorStop(0.6, `rgba(${r}, ${g}, ${b}, 0.4)`)
      gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0.05)`)

      ctx.fillStyle = gradient
      ctx.fillRect(x + 1, y + 1, cellW - 2, cellH - 2)
    }
  }

  const texture = new THREE.CanvasTexture(canvas)
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping
  return texture
}

export default function CityScene({ blend }) {
  const groupRef = useRef()
  const glowRef = useRef()
  const fogRef = useRef()

  // Generate city buildings
  const buildings = useMemo(() => generateCityData(), [])

  // Create textures for different building types
  const textures = useMemo(() => {
    return buildings.map(b => createBuildingTexture(
      b.width, b.height, b.windowRows, b.windowCols, b.lit
    ))
  }, [buildings])

  // Ground plane
  const groundGeometry = useMemo(() => {
    return new THREE.PlaneGeometry(20, 20)
  }, [])

  // Fog layer
  const fogGeometry = useMemo(() => {
    return new THREE.PlaneGeometry(25, 25)
  }, [])

  // Atmospheric glow
  const glowMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        varying vec2 vUv;

        void main() {
          float dist = length(vUv - vec2(0.5)) * 2.0;
          float alpha = smoothstep(1.0, 0.3, dist) * 0.3;

          // Subtle color variation
          vec3 color = mix(
            vec3(0.1, 0.15, 0.25),
            vec3(0.2, 0.1, 0.15),
            sin(vUv.x * 3.0 + uTime * 0.1) * 0.5 + 0.5
          );

          gl_FragColor = vec4(color, alpha);
        }
      `,
      transparent: true,
      depthWrite: false,
    })
  }, [])

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()

    if (groupRef.current) {
      groupRef.current.rotation.y = t * 0.008
    }

    if (glowRef.current) {
      const pulse = 0.7 + 0.3 * Math.sin(t * 0.2)
      glowRef.current.material.opacity = blend * 0.4 * pulse
    }

    if (fogRef.current) {
      fogRef.current.material.uniforms.uTime.value = t
    }
  })

  return (
    <group ref={groupRef}>
      {/* Buildings */}
      {buildings.map((building, i) => (
        <group key={i} position={[building.x, building.height / 2, building.z]}>
          {/* Building body */}
          <mesh>
            <boxGeometry args={[building.width, building.height, building.depth]} />
            <meshStandardMaterial
              color={building.type === 'skyscraper' ? '#0a0f1a' : '#0c1018'}
              roughness={0.4}
              metalness={0.6}
            />
          </mesh>

          {/* Windows - front */}
          <mesh position={[building.depth / 2 + 0.001, 0, 0]} rotation={[0, 0, 0]}>
            <planeGeometry args={[building.width * 0.85, building.height * 0.9]} />
            <meshBasicMaterial
              map={textures[i]}
              transparent
              opacity={blend * (building.lit ? 0.95 : 0.4)}
              depthWrite={false}
            />
          </mesh>

          {/* Windows - back */}
          <mesh position={[-building.depth / 2 - 0.001, 0, 0]} rotation={[0, Math.PI, 0]}>
            <planeGeometry args={[building.width * 0.85, building.height * 0.9]} />
            <meshBasicMaterial
              map={textures[i]}
              transparent
              opacity={blend * (building.lit ? 0.8 : 0.3)}
              depthWrite={false}
            />
          </mesh>

          {/* Edge highlights for skyscrapers */}
          {building.type === 'skyscraper' && (
            <lineSegments>
              <edgesGeometry args={[new THREE.BoxGeometry(building.width, building.height, building.depth)]} />
              <lineBasicMaterial color="#1a2535" transparent opacity={blend * 0.15} />
            </lineSegments>
          )}
        </group>
      ))}

      {/* Ground */}
      <mesh
        geometry={groundGeometry}
        position={[0, -0.01, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <meshStandardMaterial color="#030508" roughness={0.95} />
      </mesh>

      {/* Atmospheric glow */}
      <mesh ref={glowRef} position={[0, 0.5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[15, 15]} />
        <meshBasicMaterial
          color="#ffaa44"
          transparent
          opacity={0}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Fog layer */}
      <mesh ref={fogRef} geometry={fogGeometry} position={[0, 0.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <primitive object={glowMaterial} attach="material" />
      </mesh>

      {/* Lighting */}
      <ambientLight intensity={blend * 0.08} color="#334466" />
      <pointLight position={[0, 5, 0]} color="#ff8844" intensity={blend * 0.4} distance={15} decay={2} />
      <pointLight position={[3, 3, 3]} color="#4488ff" intensity={blend * 0.2} distance={10} decay={2} />
    </group>
  )
}
