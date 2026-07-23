import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// Procedural star texture with soft glow
function createStarTexture(innerPct = 0.1, color = '#ffffff') {
  const canvas = document.createElement('canvas')
  canvas.width = 128
  canvas.height = 128
  const ctx = canvas.getContext('2d')

  const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64)
  gradient.addColorStop(0, color)
  gradient.addColorStop(innerPct, color.replace('1)', '0.85)').replace('rgb', 'rgba'))
  gradient.addColorStop(innerPct * 2.5, color.replace('1)', '0.3)').replace('rgb', 'rgba'))
  gradient.addColorStop(innerPct * 5, color.replace('1)', '0.08)').replace('rgb', 'rgba'))
  gradient.addColorStop(1, 'rgba(0,0,0,0)')

  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, 128, 128)

  const texture = new THREE.CanvasTexture(canvas)
  texture.needsUpdate = true
  return texture
}

let sharedTextures = {}
function getStarTexture(type = 'default') {
  if (!sharedTextures[type]) {
    const colors = {
      default: 'rgba(220,230,255,1)',
      blue: 'rgba(180,200,255,1)',
      warm: 'rgba(255,230,200,1)',
      red: 'rgba(255,180,180,1)',
      giant: 'rgba(255,255,255,1)',
    }
    sharedTextures[type] = createStarTexture(type === 'giant' ? 0.2 : 0.08, colors[type] || colors.default)
  }
  return sharedTextures[type]
}

// Nebula cloud texture
function createNebulaTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 512
  const ctx = canvas.getContext('2d')

  // Deep space background
  ctx.fillStyle = 'rgba(5,5,15,0)'
  ctx.fillRect(0, 0, 512, 512)

  // Multiple layers of nebula clouds
  for (let layer = 0; layer < 5; layer++) {
    const centers = []
    const count = 3 + Math.floor(Math.random() * 4)
    for (let i = 0; i < count; i++) {
      centers.push({
        x: Math.random() * 512,
        y: Math.random() * 512,
        r: 80 + Math.random() * 200,
      })
    }

    // Color variation for each layer
    const hue = 220 + Math.random() * 60 // Blue to purple
    const sat = 30 + Math.random() * 40
    const light = 15 + Math.random() * 20

    for (const center of centers) {
      const gradient = ctx.createRadialGradient(
        center.x, center.y, 0,
        center.x, center.y, center.r
      )
      gradient.addColorStop(0, `hsla(${hue}, ${sat}%, ${light}%, 0.15)`)
      gradient.addColorStop(0.4, `hsla(${hue}, ${sat}%, ${light}%, 0.08)`)
      gradient.addColorStop(1, 'rgba(0,0,0,0)')

      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, 512, 512)
    }
  }

  const texture = new THREE.CanvasTexture(canvas)
  texture.needsUpdate = true
  return texture
}

let nebulaTexture = null
function getNebulaTexture() {
  if (!nebulaTexture) nebulaTexture = createNebulaTexture()
  return nebulaTexture
}

// Generate star positions with volumetric distribution
function generateStarPositions(count, spread, depthBias = 0.5, clusterStrength = 0) {
  const pos = new Float32Array(count * 3)
  const sizes = new Float32Array(count)
  const types = new Float32Array(count)

  for (let i = 0; i < count; i++) {
    // Spherical distribution with depth bias
    const u = Math.random()
    const v = Math.random()
    const theta = u * Math.PI * 2
    const phi = Math.acos(2 * v - 1)

    // Bias toward more stars in the distance for depth
    const r = Math.pow(Math.random(), depthBias) * spread

    pos[i * 3] = r * Math.sin(phi) * Math.cos(theta)
    pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta) * 0.6 // Flatten slightly
    pos[i * 3 + 2] = r * Math.cos(phi) - spread * 0.3

    // Star sizes - most tiny, few giants
    const sizeRand = Math.random()
    if (sizeRand > 0.995) {
      sizes[i] = 3 + Math.random() * 4 // Giant stars
      types[i] = 2
    } else if (sizeRand > 0.97) {
      sizes[i] = 1.5 + Math.random() * 1.5 // Bright stars
      types[i] = 1
    } else {
      sizes[i] = 0.3 + Math.random() * 0.8 // Tiny background stars
      types[i] = 0
    }
  }

  return { pos, sizes, types }
}

// Individual star layer with custom colors
function StarLayer({ positions, sizes, types, spread, speed, baseOpacity, layerName }) {
  const ref = useRef()
  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1))
    geo.setAttribute('type', new THREE.BufferAttribute(types, 1))
    return geo
  }, [positions, sizes, types])

  // Custom shader material for star rendering
  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uOpacity: { value: baseOpacity },
        uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
      },
      vertexShader: `
        attribute float size;
        attribute float type;
        varying float vType;
        varying float vSize;
        uniform float uPixelRatio;

        void main() {
          vType = type;
          vSize = size;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = size * uPixelRatio * (200.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform float uOpacity;
        varying float vType;
        varying float vSize;

        void main() {
          float dist = length(gl_PointCoord - vec2(0.5));
          if (dist > 0.5) discard;

          float alpha = smoothstep(0.5, 0.0, dist);

          // Color based on star type
          vec3 color;
          if (vType > 1.5) {
            // Giant - bright white/blue
            color = vec3(0.9, 0.95, 1.0);
            alpha *= 1.0;
          } else if (vType > 0.5) {
            // Bright - warm white
            color = vec3(1.0, 0.95, 0.85);
            alpha *= 0.9;
          } else {
            // Tiny - blue to warm variation
            float t = fract(vSize * 0.5 + uTime * 0.01);
            color = mix(vec3(0.7, 0.8, 1.0), vec3(1.0, 0.9, 0.8), t);
            alpha *= 0.7;
          }

          // Twinkle effect
          float twinkle = 0.7 + 0.3 * sin(uTime * 2.0 + vSize * 10.0);
          alpha *= twinkle * uOpacity;

          gl_FragColor = vec4(color, alpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
  }, [baseOpacity])

  useFrame(({ clock }) => {
    if (!ref.current) return
    const t = clock.getElapsedTime()
    ref.current.rotation.y = t * speed * 0.002
    ref.current.rotation.x = Math.sin(t * speed * 0.001) * 0.005
    material.uniforms.uTime.value = t
  })

  return (
    <points ref={ref} geometry={geometry} material={material} frustumCulled={false} />
  )
}

// Nebula background layer
function NebulaLayer() {
  const ref = useRef()

  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(4000, 4000)
    return geo
  }, [])

  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uNebula: { value: getNebulaTexture() },
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
        uniform sampler2D uNebula;
        varying vec2 vUv;

        void main() {
          vec2 uv = vUv;

          // Slow drift
          uv += vec2(uTime * 0.002, uTime * 0.001);

          vec4 nebula = texture2D(uNebula, uv);
          float alpha = (nebula.r + nebula.g + nebula.b) * 0.3;

          gl_FragColor = vec4(nebula.rgb, alpha * 0.4);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    })
  }, [])

  useFrame(({ clock }) => {
    if (!ref.current) return
    material.uniforms.uTime.value = clock.getElapsedTime()
  })

  return <mesh ref={ref} geometry={geometry} material={material} position={[0, 0, -1500]} />
}

// Foreground dust particles
function DustLayer() {
  const ref = useRef()
  const count = 200

  const { positions, sizes } = useMemo(() => {
    const pos = new Float32Array(count * 3)
    const s = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 150
      pos[i * 3 + 1] = (Math.random() - 0.5) * 150
      pos[i * 3 + 2] = -10 - Math.random() * 60
      s[i] = 0.5 + Math.random() * 1.5
    }
    return { positions: pos, sizes: s }
  }, [])

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1))
    return geo
  }, [positions, sizes])

  const material = useMemo(() => {
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
          gl_PointSize = size * (150.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;

          // Fade based on depth
          vAlpha = smoothstep(-70.0, -10.0, position.z) * 0.3;
        }
      `,
      fragmentShader: `
        varying float vAlpha;

        void main() {
          float dist = length(gl_PointCoord - vec2(0.5));
          if (dist > 0.5) discard;

          float alpha = smoothstep(0.5, 0.0, dist) * vAlpha;
          gl_FragColor = vec4(0.8, 0.85, 1.0, alpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
  }, [])

  useFrame(({ clock }) => {
    if (!ref.current) return
    const t = clock.getElapsedTime()
    material.uniforms.uTime.value = t
    ref.current.rotation.y = t * 0.01
    ref.current.rotation.x = t * 0.005
  })

  return <points ref={ref} geometry={geometry} material={material} frustumCulled={false} />
}

// Distant galaxy clusters
function GalaxyClusters() {
  const ref = useRef()
  const count = 50

  const { positions, sizes, colors } = useMemo(() => {
    const pos = new Float32Array(count * 3)
    const s = new Float32Array(count)
    const c = new Float32Array(count * 3)

    for (let i = 0; i < count; i++) {
      // Clustered distribution
      const clusterAngle = (i / count) * Math.PI * 2
      const clusterDist = 800 + Math.random() * 1200
      const spread = 100

      pos[i * 3] = Math.cos(clusterAngle) * clusterDist + (Math.random() - 0.5) * spread
      pos[i * 3 + 1] = (Math.random() - 0.5) * spread * 0.5
      pos[i * 3 + 2] = Math.sin(clusterAngle) * clusterDist - 800

      s[i] = 15 + Math.random() * 25

      // Galaxy colors - mostly white/blue with some warm
      const colorRand = Math.random()
      if (colorRand > 0.8) {
        c[i * 3] = 1.0
        c[i * 3 + 1] = 0.85
        c[i * 3 + 2] = 0.7
      } else if (colorRand > 0.6) {
        c[i * 3] = 0.7
        c[i * 3 + 1] = 0.8
        c[i * 3 + 2] = 1.0
      } else {
        c[i * 3] = 1.0
        c[i * 3 + 1] = 1.0
        c[i * 3 + 2] = 1.0
      }
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
      },
      vertexShader: `
        attribute float size;
        attribute vec3 color;
        varying vec3 vColor;
        varying float vSize;

        void main() {
          vColor = color;
          vSize = size;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = size * (100.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        varying float vSize;

        void main() {
          float dist = length(gl_PointCoord - vec2(0.5));
          // Soft elliptical galaxy shape
          float dx = (gl_PointCoord.x - 0.5) * 2.0;
          float dy = (gl_PointCoord.y - 0.5) * 2.0;
          float ellipse = dx * dx * 0.5 + dy * dy;
          float alpha = smoothstep(1.0, 0.0, ellipse) * 0.6;

          gl_FragColor = vec4(vColor, alpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
  }, [])

  useFrame(({ clock }) => {
    if (!ref.current) return
    material.uniforms.uTime.value = clock.getElapsedTime()
    ref.current.rotation.y = clock.getElapsedTime() * 0.003
  })

  return <points ref={ref} geometry={geometry} material={material} frustumCulled={false} />
}

export default function StarfieldScene() {
  // Generate multiple layers with different characteristics
  const nearStars = useMemo(() => generateStarPositions(300, 400, 0.6, 0.3), [])
  const midStars = useMemo(() => generateStarPositions(600, 1200, 0.5, 0.5), [])
  const farStars = useMemo(() => generateStarPositions(1000, 2500, 0.4, 0.7), [])
  const distantStars = useMemo(() => generateStarPositions(800, 4000, 0.3, 0.9), [])

  return (
    <>
      {/* Background nebula */}
      <NebulaLayer />

      {/* Distant galaxy clusters */}
      <GalaxyClusters />

      {/* Multiple star layers - back to front */}
      <StarLayer
        positions={distantStars.pos}
        sizes={distantStars.sizes}
        types={distantStars.types}
        spread={4000}
        speed={0.2}
        baseOpacity={0.25}
        layerName="distant"
      />
      <StarLayer
        positions={farStars.pos}
        sizes={farStars.sizes}
        types={farStars.types}
        spread={2500}
        speed={0.4}
        baseOpacity={0.35}
        layerName="far"
      />
      <StarLayer
        positions={midStars.pos}
        sizes={midStars.sizes}
        types={midStars.types}
        spread={1200}
        speed={0.7}
        baseOpacity={0.5}
        layerName="mid"
      />
      <StarLayer
        positions={nearStars.pos}
        sizes={nearStars.sizes}
        types={nearStars.types}
        spread={400}
        speed={1.2}
        baseOpacity={0.7}
        layerName="near"
      />

      {/* Foreground dust */}
      <DustLayer />
    </>
  )
}
