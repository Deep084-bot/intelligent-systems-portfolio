import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// Create realistic Moon texture with craters
function createMoonTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 1024
  canvas.height = 512
  const ctx = canvas.getContext('2d')

  // Base gray
  ctx.fillStyle = '#606060'
  ctx.fillRect(0, 0, 1024, 512)

  // Create craters and maria (dark patches)
  for (let y = 0; y < 512; y++) {
    for (let x = 0; x < 1024; x++) {
      const nx = x / 1024
      const ny = y / 512

      // Base noise
      let noise = 0
      noise += Math.sin(nx * 8 + ny * 6) * 0.25
      noise += Math.sin(nx * 16 + ny * 12 + 1.5) * 0.2
      noise += Math.sin(nx * 32 + ny * 24 + 3.0) * 0.15
      noise += Math.sin(nx * 64 + ny * 48 + 5.0) * 0.1
      noise += Math.random() * 0.15

      // Maria (dark plains) - major dark patches
      const mariaNoise = Math.sin(nx * 3 + 0.5) * Math.sin(ny * 4 + 1)
      const isMaria = mariaNoise > 0.3

      let baseGray
      if (isMaria) {
        // Dark maria
        baseGray = 55 + noise * 30
      } else {
        // Highlands
        baseGray = 100 + noise * 40
      }

      // Crater rims and floors
      let brightness = baseGray
      for (let c = 0; c < 150; c++) {
        const cx = Math.random()
        const cy = Math.random()
        const cr = Math.random()

        const dx = nx - cx
        const dy = ny - cy
        const dist = Math.sqrt(dx * dx + dy * dy)

        if (dist < cr * 0.03) {
          // Crater floor - darker
          brightness -= 15 * (1 - dist / (cr * 0.03))
        } else if (dist < cr * 0.05) {
          // Crater rim - brighter
          brightness += 20 * (1 - dist / (cr * 0.05))
        }
      }

      brightness = Math.max(30, Math.min(180, brightness))

      ctx.fillStyle = `rgb(${brightness}, ${brightness}, ${brightness})`
      ctx.fillRect(x, y, 1, 1)
    }
  }

  const texture = new THREE.CanvasTexture(canvas)
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.ClampToEdgeWrapping
  texture.needsUpdate = true
  return texture
}

// Create height map for displacement
function createMoonHeightMap() {
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 128
  const ctx = canvas.getContext('2d')

  ctx.fillStyle = '#808080'
  ctx.fillRect(0, 0, 256, 128)

  for (let y = 0; y < 128; y++) {
    for (let x = 0; x < 256; x++) {
      const nx = x / 256
      const ny = y / 128

      let height = 128

      // Large craters
      for (let c = 0; c < 30; c++) {
        const cx = Math.random()
        const cy = Math.random()
        const cr = 0.02 + Math.random() * 0.06

        const dx = nx - cx
        const dy = ny - cy
        const dist = Math.sqrt(dx * dx + dy * dy)

        if (dist < cr) {
          height -= (1 - dist / cr) * 40
        } else if (dist < cr * 1.3) {
          height += (1 - (dist - cr) / (cr * 0.3)) * 25
        }
      }

      height = Math.max(60, Math.min(200, height))
      const gray = height

      ctx.fillStyle = `rgb(${gray}, ${gray}, ${gray})`
      ctx.fillRect(x, y, 1, 1)
    }
  }

  const texture = new THREE.CanvasTexture(canvas)
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.ClampToEdgeWrapping
  texture.needsUpdate = true
  return texture
}

// Create Earth texture for the sky
function createEarthFromSpaceTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 128
  const ctx = canvas.getContext('2d')

  // Ocean
  ctx.fillStyle = '#0a2a5a'
  ctx.fillRect(0, 0, 256, 128)

  // Continents (simplified)
  ctx.fillStyle = '#1a4a2a'

  // Americas
  ctx.beginPath()
  ctx.ellipse(60, 50, 25, 40, 0.2, 0, Math.PI * 2)
  ctx.fill()

  // Europe/Africa
  ctx.beginPath()
  ctx.ellipse(130, 55, 15, 35, 0, 0, Math.PI * 2)
  ctx.fill()

  // Asia/Australia
  ctx.beginPath()
  ctx.ellipse(190, 60, 20, 25, 0, 0, Math.PI * 2)
  ctx.fill()

  // Ice caps
  ctx.fillStyle = '#eeeeff'
  ctx.fillRect(0, 0, 256, 8)
  ctx.fillRect(0, 120, 256, 8)

  const texture = new THREE.CanvasTexture(canvas)
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.ClampToEdgeWrapping
  texture.needsUpdate = true
  return texture
}

export default function MoonScene({ blend }) {
  const moonRef = useRef()
  const earthRef = useRef()
  const earthGlowRef = useRef()
  const glowRef = useRef()
  const starsRef = useRef()

  const moonRadius = 2.5

  // Create textures
  const textures = useMemo(() => {
    return {
      moon: createMoonTexture(),
      height: createMoonHeightMap(),
      earth: createEarthFromSpaceTexture(),
    }
  }, [])

  // Geometries
  const geometries = useMemo(() => {
    const moonR = moonRadius
    const earthR = 0.5

    // Moon with displacement
    const moonGeo = new THREE.SphereGeometry(moonR, 64, 64)

    // Earth
    const earthGeo = new THREE.SphereGeometry(earthR, 24, 24)

    // Orbit path
    const orbitPoints = []
    const orbitR = 10
    for (let i = 0; i <= 64; i++) {
      const theta = (i / 64) * Math.PI * 2
      orbitPoints.push(Math.cos(theta) * orbitR, 0, Math.sin(theta) * orbitR)
    }
    const orbitGeo = new THREE.BufferGeometry()
    orbitGeo.setAttribute('position', new THREE.Float32BufferAttribute(orbitPoints, 3))

    // Small stars around Moon
    const starCount = 100
    const starPos = new Float32Array(starCount * 3)
    const starSizes = new Float32Array(starCount)
    for (let i = 0; i < starCount; i++) {
      const theta = Math.random() * Math.PI * 2
      const phi = Math.random() * Math.PI
      const r = 15 + Math.random() * 25
      starPos[i * 3] = r * Math.sin(phi) * Math.cos(theta)
      starPos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
      starPos[i * 3 + 2] = r * Math.cos(phi)
      starSizes[i] = 0.5 + Math.random() * 1.5
    }
    const starGeo = new THREE.BufferGeometry()
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3))
    starGeo.setAttribute('size', new THREE.BufferAttribute(starSizes, 1))

    return {
      moon: moonGeo,
      earth: earthGeo,
      orbit: orbitGeo,
      stars: starGeo,
      glow: new THREE.SphereGeometry(moonR * 1.3, 24, 24),
    }
  }, [moonRadius])

  // Moon surface material
  const moonMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      map: textures.moon,
      roughness: 0.95,
      metalness: 0.0,
      bumpMap: textures.height,
      bumpScale: 0.15,
    })
  }, [textures.moon, textures.height])

  // Moon glow shader
  const glowMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
      },
      vertexShader: `
        varying vec3 vNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        varying vec3 vNormal;

        void main() {
          float intensity = pow(0.55 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.5);
          float pulse = 0.8 + 0.2 * sin(uTime * 0.3);
          vec3 color = vec3(0.6, 0.65, 0.8);
          gl_FragColor = vec4(color, intensity * pulse * 0.25);
        }
      `,
      transparent: true,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
  }, [])

  // Stars material
  const starsMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
      },
      vertexShader: `
        attribute float size;
        varying float vAlpha;
        uniform float uTime;

        void main() {
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = size * 80.0 / -mvPosition.z;
          gl_Position = projectionMatrix * mvPosition;

          vAlpha = 0.5 + 0.5 * sin(uTime * 2.0 + position.x * 0.1);
        }
      `,
      fragmentShader: `
        varying float vAlpha;

        void main() {
          float dist = length(gl_PointCoord - vec2(0.5));
          if (dist > 0.5) discard;
          float alpha = smoothstep(0.5, 0.0, dist) * vAlpha;
          gl_FragColor = vec4(0.9, 0.95, 1.0, alpha * 0.6);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
  }, [])

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()

    if (moonRef.current) {
      moonRef.current.rotation.y = t * 0.015
    }

    if (earthRef.current) {
      const angle = t * 0.04
      const orbitR = 10
      earthRef.current.position.x = Math.cos(angle) * orbitR
      earthRef.current.position.z = Math.sin(angle) * orbitR
      earthRef.current.position.y = Math.sin(angle * 0.5) * 2
      earthRef.current.rotation.y = t * 0.1
    }

    if (glowRef.current) {
      glowRef.current.material.uniforms.uTime.value = t
      const pulse = 0.85 + 0.15 * Math.sin(t * 0.25)
      glowRef.current.material.opacity = blend * 0.2 * pulse
    }

    if (earthGlowRef.current && earthRef.current) {
      earthGlowRef.current.position.copy(earthRef.current.position)
      const pulse = 0.85 + 0.15 * Math.sin(t * 0.3)
      earthGlowRef.current.material.opacity = blend * 0.12 * pulse
    }

    if (starsRef.current) {
      starsRef.current.material.uniforms.uTime.value = t
    }
  })

  return (
    <group>
      {/* Moon */}
      <mesh ref={moonRef} geometry={geometries.moon} material={moonMaterial} />

      {/* Moon glow */}
      <mesh ref={glowRef} geometry={geometries.glow}>
        <primitive object={glowMaterial} attach="material" />
      </mesh>

      {/* Earth in the sky */}
      <mesh ref={earthRef} geometry={geometries.earth}>
        <meshStandardMaterial
          map={textures.earth}
          roughness={0.8}
        />
      </mesh>

      {/* Earth glow */}
      <mesh ref={earthGlowRef}>
        <sphereGeometry args={[0.65, 16, 16]} />
        <meshBasicMaterial
          color="#4488cc"
          transparent
          opacity={0}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Orbit path */}
      <line geometry={geometries.orbit}>
        <lineBasicMaterial color="#ffffff" transparent opacity={blend * 0.08} depthWrite={false} />
      </line>

      {/* Background stars */}
      <points ref={starsRef} geometry={geometries.stars} material={starsMaterial} />

      {/* Lighting */}
      {/* Sun light from one direction */}
      <directionalLight position={[5, 3, 2]} intensity={blend * 1.5} color="#fffaf0" />

      {/* Subtle fill from Earth reflection (very subtle blue) */}
      <pointLight position={[0, 0, 0]} color="#6688aa" intensity={blend * 0.1} distance={10} />

      {/* Ambient */}
      <ambientLight intensity={blend * 0.08} color="#222233" />
    </group>
  )
}
