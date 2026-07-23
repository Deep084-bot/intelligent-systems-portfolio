import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { STAGES } from '../stages'

// Create detailed Earth texture with continents and oceans
function createEarthTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 1024
  canvas.height = 512
  const ctx = canvas.getContext('2d')

  // Ocean base
  ctx.fillStyle = '#0a2a4a'
  ctx.fillRect(0, 0, 1024, 512)

  // Simplified continent shapes using noise
  for (let y = 0; y < 512; y++) {
    for (let x = 0; x < 1024; x++) {
      const nx = x / 1024
      const ny = y / 512

      // Multi-octave noise for continent shapes
      let noise = 0
      noise += Math.sin(nx * 8 + ny * 6) * 0.3
      noise += Math.sin(nx * 15 + ny * 12 + 1.5) * 0.25
      noise += Math.sin(nx * 25 + ny * 20 + 3.0) * 0.2
      noise += Math.sin(nx * 40 + ny * 35 + 5.0) * 0.15
      noise += Math.random() * 0.1

      const isLand = noise > 0.45

      // Latitude-based climate
      const latFactor = 1 - Math.abs(ny - 0.5) * 2
      const polarIce = latFactor < 0.12

      let r, g, b

      if (polarIce) {
        // Polar ice caps
        r = 240; g = 245; b = 255
      } else if (isLand) {
        // Land - varied terrain
        const elevation = noise - 0.45
        if (elevation > 0.25) {
          // Mountains - snowy peaks
          r = 200 + elevation * 100
          g = 195 + elevation * 100
          b = 195 + elevation * 100
        } else if (elevation > 0.1) {
          // Highlands
          r = 90 + elevation * 200
          g = 100 + elevation * 200
          b = 70 + elevation * 150
        } else {
          // Lowlands - forests and plains
          const greenness = 0.6 + Math.random() * 0.4
          r = 40 + noise * 50
          g = 80 + noise * 80 * greenness
          b = 35 + noise * 30
        }
      } else {
        // Ocean - depth variation
        const depth = 0.5 + noise * 0.5
        r = 10 + depth * 15
        g = 40 + depth * 60
        b = 80 + depth * 80
      }

      ctx.fillStyle = `rgb(${r | 0}, ${g | 0}, ${b | 0})`
      ctx.fillRect(x, y, 1, 1)
    }
  }

  const texture = new THREE.CanvasTexture(canvas)
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.ClampToEdgeWrapping
  texture.needsUpdate = true
  return texture
}

// Create city lights texture for night side
function createCityLightsTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 1024
  canvas.height = 512
  const ctx = canvas.getContext('2d')

  ctx.fillStyle = 'rgba(0,0,0,0)'
  ctx.fillRect(0, 0, 1024, 512)

  // Major city clusters (simplified coordinates)
  const cities = [
    { x: 0.25, y: 0.35, intensity: 1.0 },   // North America East
    { x: 0.18, y: 0.38, intensity: 0.9 },   // North America West
    { x: 0.48, y: 0.32, intensity: 1.0 },   // Europe
    { x: 0.55, y: 0.35, intensity: 0.8 },   // Middle East / India
    { x: 0.72, y: 0.38, intensity: 0.9 },   // East Asia
    { x: 0.85, y: 0.42, intensity: 0.7 },   // Australia
    { x: 0.35, y: 0.55, intensity: 0.5 },   // South America
    { x: 0.52, y: 0.60, intensity: 0.4 },    // Africa
  ]

  for (const city of cities) {
    const cx = city.x * 1024
    const cy = city.y * 512

    // City glow
    const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, 80)
    gradient.addColorStop(0, `rgba(255, 240, 180, ${city.intensity * 0.8})`)
    gradient.addColorStop(0.3, `rgba(255, 220, 140, ${city.intensity * 0.4})`)
    gradient.addColorStop(0.6, `rgba(255, 200, 100, ${city.intensity * 0.15})`)
    gradient.addColorStop(1, 'rgba(0,0,0,0)')

    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, 1024, 512)

    // Random light points within city
    for (let i = 0; i < 200; i++) {
      const dx = (Math.random() - 0.5) * 100
      const dy = (Math.random() - 0.5) * 60

      if (Math.random() > 0.3) {
        ctx.fillStyle = `rgba(255, ${200 + Math.random() * 55}, ${100 + Math.random() * 80}, ${city.intensity * 0.6})`
        ctx.fillRect(cx + dx, cy + dy, 2, 2)
      }
    }
  }

  const texture = new THREE.CanvasTexture(canvas)
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.ClampToEdgeWrapping
  texture.needsUpdate = true
  return texture
}

// Cloud texture with proper coverage
function createCloudTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 1024
  canvas.height = 512
  const ctx = canvas.getContext('2d')

  ctx.fillStyle = 'rgba(0,0,0,0)'
  ctx.fillRect(0, 0, 1024, 512)

  for (let y = 0; y < 512; y++) {
    for (let x = 0; x < 1024; x++) {
      const nx = x / 1024
      const ny = y / 512

      // Cloud noise
      let noise = 0
      noise += Math.sin(nx * 6 + ny * 5) * 0.35
      noise += Math.sin(nx * 12 + ny * 10 + 2.0) * 0.3
      noise += Math.sin(nx * 20 + ny * 18 + 4.0) * 0.2
      noise += Math.sin(nx * 35 + ny * 30 + 6.0) * 0.15

      // Less clouds at poles
      const latFactor = 1 - Math.abs(ny - 0.5) * 2
      const cloudFactor = Math.min(1, latFactor * 1.2)

      const alpha = Math.max(0, Math.min(1, (noise - 0.3) * 2.5)) * cloudFactor

      ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.7})`
      ctx.fillRect(x, y, 1, 1)
    }
  }

  const texture = new THREE.CanvasTexture(canvas)
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.ClampToEdgeWrapping
  texture.needsUpdate = true
  return texture
}

export default function EarthScene({ blend, progress }) {
  const earthRef = useRef()
  const cloudRef = useRef()
  const atmoRef = useRef()
  const glowRef = useRef()
  const moonRef = useRef()
  const cityLightsRef = useRef()

  const stage = STAGES[5]
  const localP = Math.min(1, Math.max(0, (progress - stage.start) / (stage.end - stage.start)))
  const radius = 5.5
  const scale = Math.max(0.01, 1 - localP * 0.6)

  // Create textures
  const textures = useMemo(() => {
    return {
      earth: createEarthTexture(),
      clouds: createCloudTexture(),
      cities: createCityLightsTexture(),
    }
  }, [])

  // Geometries
  const geometries = useMemo(() => {
    const r = radius

    // Moon orbit path
    const orbitPoints = []
    const orbitRadius = r * 3.5
    for (let i = 0; i <= 64; i++) {
      const theta = (i / 64) * Math.PI * 2
      orbitPoints.push(Math.cos(theta) * orbitRadius, Math.sin(theta) * orbitRadius * 0.1, Math.sin(theta) * orbitRadius)
    }
    const orbitGeo = new THREE.BufferGeometry()
    orbitGeo.setAttribute('position', new THREE.Float32BufferAttribute(orbitPoints, 3))

    return {
      earth: new THREE.SphereGeometry(r, 64, 64),
      clouds: new THREE.SphereGeometry(r * 1.015, 48, 48),
      atmosphere: new THREE.SphereGeometry(r * 1.08, 48, 48),
      glow: new THREE.SphereGeometry(r * 1.5, 24, 24),
      moon: new THREE.SphereGeometry(r * 0.12, 24, 24),
      orbit: orbitGeo,
    }
  }, [radius])

  // Atmosphere shader
  const atmosphereMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uSunDirection: { value: new THREE.Vector3(1, 0.5, 0.5).normalize() },
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
        uniform vec3 uSunDirection;
        varying vec3 vNormal;
        varying vec3 vPosition;

        void main() {
          vec3 viewDir = normalize(-vPosition);
          float intensity = pow(0.65 - dot(vNormal, viewDir), 3.0);

          // Atmosphere color - blue to cyan
          vec3 color = mix(vec3(0.2, 0.5, 1.0), vec3(0.4, 0.7, 1.0), intensity);

          gl_FragColor = vec4(color, intensity * 0.5);
        }
      `,
      transparent: true,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
  }, [])

  // City lights shader (shows on night side)
  const cityLightsMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uTexture: { value: textures.cities },
        uSunDirection: { value: new THREE.Vector3(1, 0.5, 0.5).normalize() },
      },
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vPosition;
        void main() {
          vUv = uv;
          vNormal = normalize(normalMatrix * normal);
          vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D uTexture;
        uniform vec3 uSunDirection;
        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vPosition;

        void main() {
          // Day/night terminator
          vec3 worldNormal = normalize(vPosition);
          float sunDot = dot(worldNormal, uSunDirection);

          // Night side (negative sunDot)
          float nightFactor = smoothstep(0.2, -0.3, sunDot);

          vec4 cityLight = texture2D(uTexture, vUv);

          // Fade at terminator
          float fade = smoothstep(-0.3, 0.1, sunDot);

          gl_FragColor = vec4(cityLight.rgb, cityLight.a * nightFactor * fade);
        }
      `,
      transparent: true,
      depthWrite: false,
    })
  }, [textures.cities])

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()

    if (earthRef.current) {
      earthRef.current.rotation.y = t * 0.03
      earthRef.current.scale.setScalar(scale)
    }
    if (cloudRef.current) {
      cloudRef.current.rotation.y = t * 0.045
      cloudRef.current.scale.setScalar(scale * 1.015)
    }
    if (atmoRef.current) {
      atmoRef.current.scale.setScalar(scale * 1.08)
      const pulse = 0.85 + 0.15 * Math.sin(t * 0.3)
      atmoRef.current.material.opacity = blend * 0.45 * pulse
    }
    if (glowRef.current) {
      glowRef.current.scale.setScalar(scale)
      const pulse = 0.7 + 0.3 * Math.sin(t * 0.2)
      glowRef.current.material.opacity = blend * 0.08 * pulse
    }
    if (cityLightsRef.current) {
      cityLightsRef.current.rotation.y = t * 0.03
      cityLightsRef.current.scale.setScalar(scale)
    }
    if (moonRef.current) {
      const angle = t * 0.08
      const orbitR = radius * 3.5 * scale
      moonRef.current.position.x = Math.cos(angle) * orbitR
      moonRef.current.position.z = Math.sin(angle) * orbitR
      moonRef.current.position.y = Math.sin(angle * 0.3) * orbitR * 0.1
    }
  })

  return (
    <group>
      {/* Earth base */}
      <mesh ref={earthRef} geometry={geometries.earth}>
        <meshStandardMaterial
          map={textures.earth}
          roughness={0.8}
          metalness={0.1}
        />
      </mesh>

      {/* City lights on night side */}
      <mesh ref={cityLightsRef} geometry={geometries.earth}>
        <primitive object={cityLightsMaterial} attach="material" />
      </mesh>

      {/* Cloud layer */}
      <mesh ref={cloudRef} geometry={geometries.clouds}>
        <meshBasicMaterial
          map={textures.clouds}
          transparent
          opacity={blend * 0.35}
          depthWrite={false}
        />
      </mesh>

      {/* Atmosphere glow */}
      <mesh ref={atmoRef} geometry={geometries.atmosphere}>
        <primitive object={atmosphereMaterial} attach="material" />
      </mesh>

      {/* Outer glow */}
      <mesh ref={glowRef} geometry={geometries.glow}>
        <meshBasicMaterial
          color="#2266aa"
          transparent
          opacity={0}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Moon orbit */}
      <line geometry={geometries.orbit}>
        <lineBasicMaterial color="#ffffff" transparent opacity={blend * 0.12} depthWrite={false} />
      </line>

      {/* Moon */}
      <mesh ref={moonRef} geometry={geometries.moon}>
        <meshStandardMaterial color="#888890" roughness={0.9} metalness={0.05} />
      </mesh>

      {/* Lighting */}
      <directionalLight position={[5, 2, 3]} intensity={blend * 1.2} color="#fffaf0" />
      <ambientLight intensity={blend * 0.15} color="#334466" />
    </group>
  )
}
