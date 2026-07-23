import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// Create window texture procedurally
function createWindowTexture(width, height, windowRows, windowCols) {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')

  // Dark glass background
  ctx.fillStyle = '#0a1525'
  ctx.fillRect(0, 0, width, height)

  const cellW = width / windowCols
  const cellH = height / windowRows

  for (let row = 0; row < windowRows; row++) {
    for (let col = 0; col < windowCols; col++) {
      const x = col * cellW
      const y = row * cellH

      // Random lit windows
      const isLit = Math.random() > 0.4

      if (isLit) {
        // Window glow color - warm to cool variation
        const warmth = Math.random()
        let r, g, b
        if (warmth > 0.7) {
          // Warm yellow
          r = 255; g = 220 + Math.random() * 35; b = 150 + Math.random() * 50
        } else if (warmth > 0.3) {
          // Cool white
          r = 220 + Math.random() * 35; g = 235 + Math.random() * 20; b = 255
        } else {
          // Cyan accent
          r = 100 + Math.random() * 50; g = 220 + Math.random() * 35; b = 255
        }

        const gradient = ctx.createRadialGradient(
          x + cellW / 2, y + cellH / 2, 0,
          x + cellW / 2, y + cellH / 2, cellW * 0.4
        )
        gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0.9)`)
        gradient.addColorStop(0.5, `rgba(${r}, ${g}, ${b}, 0.5)`)
        gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0.1)`)

        ctx.fillStyle = gradient
        ctx.fillRect(x + 2, y + 2, cellW - 4, cellH - 4)
      } else {
        // Dark window
        ctx.fillStyle = 'rgba(20, 35, 55, 0.8)'
        ctx.fillRect(x + 2, y + 2, cellW - 4, cellH - 4)
      }
    }
  }

  const texture = new THREE.CanvasTexture(canvas)
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping
  texture.needsUpdate = true
  return texture
}

export default function BuildingScene({ blend }) {
  const groupRef = useRef()
  const windowRef = useRef()
  const glowRef = useRef()
  const accentRef = useRef()

  // Building dimensions
  const buildingWidth = 1.2
  const buildingHeight = 8
  const buildingDepth = 1.2
  const windowRows = 35
  const windowCols = 6

  // Window texture
  const windowTexture = useMemo(() => {
    return createWindowTexture(256, 1024, windowRows, windowCols)
  }, [])

  // Building geometry
  const buildingGeometry = useMemo(() => {
    return new THREE.BoxGeometry(buildingWidth, buildingHeight, buildingDepth)
  }, [])

  // Roof antenna
  const antennaGeometry = useMemo(() => {
    const points = [
      new THREE.Vector3(0, buildingHeight / 2 + 0.5, 0),
      new THREE.Vector3(0, buildingHeight / 2 + 1.5, 0),
    ]
    const curve = new THREE.CatmullRomCurve3(points)
    return new THREE.TubeGeometry(curve, 8, 0.02, 8, false)
  }, [])

  // Ground plane
  const groundGeometry = useMemo(() => {
    return new THREE.PlaneGeometry(12, 12)
  }, [])

  // Side windows (vertical strips)
  const sideWindowTexture = useMemo(() => {
    return createWindowTexture(128, 1024, windowRows, 2)
  }, [])

  // Building material
  const buildingMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: '#0a0f1a',
      roughness: 0.3,
      metalness: 0.8,
    })
  }, [])

  // Accent light strips
  const accentGeometry = useMemo(() => {
    return new THREE.BoxGeometry(buildingWidth + 0.02, 0.05, buildingDepth + 0.02)
  }, [])

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()

    if (groupRef.current) {
      groupRef.current.rotation.y = t * 0.03
    }

    if (windowRef.current) {
      // Window flicker effect
      const flicker = 0.85 + 0.15 * Math.sin(t * 0.5)
      windowRef.current.material.opacity = blend * flicker
    }

    if (glowRef.current) {
      // Atmospheric glow at base
      const pulse = 0.6 + 0.4 * Math.sin(t * 0.3)
      glowRef.current.material.opacity = blend * 0.15 * pulse
    }

    if (accentRef.current) {
      // Rooftop beacon
      const beacon = t * 2
      const alpha = (Math.sin(beacon) * 0.5 + 0.5) * 0.8 + 0.2
      accentRef.current.material.opacity = blend * alpha
      accentRef.current.material.color.setHSL(0.0, 1.0, 0.5 + alpha * 0.3)
    }
  })

  return (
    <group ref={groupRef}>
      {/* Main building */}
      <mesh geometry={buildingGeometry} material={buildingMaterial}>
        <meshStandardMaterial color="#080c14" roughness={0.4} metalness={0.6} />
      </mesh>

      {/* Front windows */}
      <mesh position={[0, 0, buildingDepth/2 + 0.001]}>
        <planeGeometry args={[buildingWidth * 0.9, buildingHeight * 0.85]} />
        <meshBasicMaterial
          ref={windowRef}
          map={windowTexture}
          transparent
          opacity={blend * 0.9}
          depthWrite={false}
        />
      </mesh>

      {/* Back windows */}
      <mesh position={[0, 0, -buildingDepth/2 - 0.001]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[buildingWidth * 0.9, buildingHeight * 0.85]} />
        <meshBasicMaterial
          map={windowTexture}
          transparent
          opacity={blend * 0.7}
          depthWrite={false}
        />
      </mesh>

      {/* Side windows - left */}
      <mesh position={[-buildingWidth/2 - 0.001, 0, 0]} rotation={[0, -Math.PI/2, 0]}>
        <planeGeometry args={[buildingDepth * 0.9, buildingHeight * 0.85]} />
        <meshBasicMaterial
          map={sideWindowTexture}
          transparent
          opacity={blend * 0.6}
          depthWrite={false}
        />
      </mesh>

      {/* Side windows - right */}
      <mesh position={[buildingWidth/2 + 0.001, 0, 0]} rotation={[0, Math.PI/2, 0]}>
        <planeGeometry args={[buildingDepth * 0.9, buildingHeight * 0.85]} />
        <meshBasicMaterial
          map={sideWindowTexture}
          transparent
          opacity={blend * 0.6}
          depthWrite={false}
        />
      </mesh>

      {/* Rooftop antenna */}
      <mesh geometry={antennaGeometry}>
        <meshBasicMaterial color="#2a3545" />
      </mesh>

      {/* Rooftop beacon */}
      <mesh ref={accentRef} position={[0, buildingHeight/2 + 1.5, 0]}>
        <sphereGeometry args={[0.04, 8, 8]} />
        <meshBasicMaterial
          color="#ff3333"
          transparent
          opacity={blend * 0.8}
        />
      </mesh>

      {/* Ground glow / atmospheric haze */}
      <mesh ref={glowRef} position={[0, -buildingHeight/2 - 0.1, 0]} rotation={[-Math.PI/2, 0, 0]}>
        <planeGeometry args={[buildingWidth * 3, buildingWidth * 3]} />
        <meshBasicMaterial
          color="#1a3050"
          transparent
          opacity={0}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Ground plane */}
      <mesh
        geometry={groundGeometry}
        position={[0, -buildingHeight/2 - 0.01, 0]}
        rotation={[-Math.PI/2, 0, 0]}
      >
        <meshStandardMaterial color="#050810" roughness={0.9} />
      </mesh>

      {/* Building edge highlights */}
      <lineSegments>
        <edgesGeometry args={[buildingGeometry]} />
        <lineBasicMaterial color="#1a2535" transparent opacity={blend * 0.3} />
      </lineSegments>

      {/* Lighting */}
      <ambientLight intensity={blend * 0.1} />
      <pointLight position={[0, buildingHeight/2 + 2, 2]} color="#4488aa" intensity={blend * 0.5} distance={8} />
      <pointLight position={[0, -buildingHeight/2 + 1, 2]} color="#ffaa44" intensity={blend * 0.3} distance={5} />
    </group>
  )
}
