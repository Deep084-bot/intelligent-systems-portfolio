import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

export default function RoomScene({ blend }) {
  const lightRef = useRef()
  const glowRef = useRef()
  const windowGlowRef = useRef()
  const floorRef = useRef()
  const dustRef = useRef()

  // Room dimensions
  const roomWidth = 5
  const roomHeight = 3.2
  const roomDepth = 4

  // Create window geometry (back wall)
  const windowGeometry = useMemo(() => {
    const shape = new THREE.Shape()
    const w = 1.2
    const h = 1.6
    const r = 0.08

    shape.moveTo(-w/2 + r, -h/2)
    shape.lineTo(w/2 - r, -h/2)
    shape.quadraticCurveTo(w/2, -h/2, w/2, -h/2 + r)
    shape.lineTo(w/2, h/2 - r)
    shape.quadraticCurveTo(w/2, h/2, w/2 - r, h/2)
    shape.lineTo(-w/2 + r, h/2)
    shape.quadraticCurveTo(-w/2, h/2, -w/2, h/2 - r)
    shape.lineTo(-w/2, -h/2 + r)
    shape.quadraticCurveTo(-w/2, -h/2, -w/2 + r, -h/2)

    const geometry = new THREE.ShapeGeometry(shape)
    return geometry
  }, [])

  // Floor with wood grain
  const floorGeometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(roomWidth, roomDepth, 32, 32)
    const pos = geo.attributes.position.array
    for (let i = 0; i < pos.length; i += 3) {
      pos[i + 2] += (Math.random() - 0.5) * 0.01 // Subtle variation
    }
    geo.computeVertexNormals()
    return geo
  }, [])

  // Wall material with subtle texture
  const wallMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uWindowPos: { value: new THREE.Vector2(0.5, 0.5) },
      },
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vPosition;
        void main() {
          vUv = uv;
          vPosition = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform vec2 uWindowPos;
        varying vec2 vUv;
        varying vec3 vPosition;

        void main() {
          // Base wall color - warm off-white
          vec3 wallColor = vec3(0.15, 0.13, 0.12);

          // Window glow from behind
          vec2 toWindow = vUv - uWindowPos;
          float windowDist = length(toWindow);
          float windowGlow = smoothstep(0.6, 0.0, windowDist);

          // Warm light from window
          vec3 lightColor = vec3(1.0, 0.85, 0.65);
          vec3 color = mix(wallColor, lightColor, windowGlow * 0.7);

          // Subtle ambient variation
          float ambient = 0.9 + 0.1 * sin(vUv.x * 10.0 + vUv.y * 8.0);
          color *= ambient;

          gl_FragColor = vec4(color, 1.0);
        }
      `,
    })
  }, [])

  // Window light beam (volumetric)
  const lightBeamMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
      },
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vPosition;
        void main() {
          vUv = uv;
          vPosition = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        varying vec2 vUv;
        varying vec3 vPosition;

        void main() {
          // Light beam gradient
          float gradient = 1.0 - vUv.y;
          gradient = pow(gradient, 1.5);

          // Horizontal spread
          float spread = 1.0 - abs(vUv.x - 0.5) * 2.0;
          spread = pow(spread, 2.0);

          // Dust particles in beam
          float dust = sin(vUv.x * 30.0 + uTime * 0.5) * sin(vUv.y * 20.0 - uTime * 0.3);
          dust = dust * 0.5 + 0.5;

          float alpha = gradient * spread * (0.08 + dust * 0.02);

          vec3 color = vec3(1.0, 0.9, 0.75);
          gl_FragColor = vec4(color, alpha);
        }
      `,
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
  }, [])

  // Lamp glow material
  const lampGlowMaterial = useMemo(() => {
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
          float intensity = pow(0.5 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
          float flicker = 0.95 + 0.05 * sin(uTime * 8.0);
          vec3 color = vec3(1.0, 0.85, 0.5);
          gl_FragColor = vec4(color, intensity * flicker * 0.6);
        }
      `,
      transparent: true,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
  }, [])

  // Floating dust particles
  const dustGeometry = useMemo(() => {
    const count = 50
    const positions = new Float32Array(count * 3)
    const sizes = new Float32Array(count)

    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * roomWidth * 0.8
      positions[i * 3 + 1] = Math.random() * roomHeight * 0.8
      positions[i * 3 + 2] = (Math.random() - 0.5) * roomDepth * 0.8
      sizes[i] = 0.02 + Math.random() * 0.03
    }

    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1))
    return geo
  }, [])

  const dustMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
      },
      vertexShader: `
        attribute float size;
        varying float vAlpha;
        uniform float uTime;

        void main() {
          vec3 pos = position;
          // Gentle floating motion
          pos.y += sin(uTime * 0.3 + position.x * 2.0) * 0.05;
          pos.x += cos(uTime * 0.2 + position.z * 2.0) * 0.03;

          vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
          gl_PointSize = size * 100.0;
          gl_Position = projectionMatrix * mvPosition;

          vAlpha = 0.3 + 0.2 * sin(uTime + position.y * 10.0);
        }
      `,
      fragmentShader: `
        varying float vAlpha;

        void main() {
          float dist = length(gl_PointCoord - vec2(0.5));
          if (dist > 0.5) discard;
          float alpha = smoothstep(0.5, 0.0, dist) * vAlpha;
          gl_FragColor = vec4(1.0, 0.95, 0.85, alpha * 0.4);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
  }, [])

  // Lamp position
  const lampPosition = useMemo(() => {
    return [1.2, 1.0, 0.5]
  }, [])

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()

    if (lightRef.current) {
      const pulse = 0.85 + 0.15 * Math.sin(t * 0.8)
      lightRef.current.material.opacity = blend * 0.9 * pulse
    }
    if (glowRef.current) {
      const pulse = 0.8 + 0.2 * Math.sin(t * 0.6)
      glowRef.current.material.opacity = blend * 0.35 * pulse
      glowRef.current.scale.setScalar(1 + 0.05 * Math.sin(t * 0.7))
    }
    if (windowGlowRef.current) {
      windowGlowRef.current.material.uniforms.uTime.value = t
    }
    if (floorRef.current) {
      floorRef.current.material.uniforms.uTime.value = t
    }
    if (dustRef.current) {
      dustRef.current.material.uniforms.uTime.value = t
    }
  })

  return (
    <group>
      {/* Back wall with window */}
      <mesh position={[0, 0, -roomDepth/2]} material={wallMaterial}>
        <planeGeometry args={[roomWidth, roomHeight]} />
      </mesh>

      {/* Window opening */}
      <mesh position={[0, 0.1, -roomDepth/2 + 0.01]}>
        <planeGeometry args={[1.2, 1.6]} />
        <meshBasicMaterial color="#1a1a2e" />
      </mesh>

      {/* Window glow behind */}
      <mesh ref={windowGlowRef} position={[0, 0.1, -roomDepth/2 - 0.1]}>
        <planeGeometry args={[2.5, 3]} />
        <primitive object={lightBeamMaterial} attach="material" />
      </mesh>

      {/* Light beam from window */}
      <mesh position={[0.3, -0.3, -roomDepth/2 + 1]} rotation={[0.3, 0.1, 0]}>
        <planeGeometry args={[2, 2.5]} />
        <meshBasicMaterial
          color="#fff5e6"
          transparent
          opacity={blend * 0.03}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Floor */}
      <mesh
        ref={floorRef}
        geometry={floorGeometry}
        position={[0, -roomHeight/2, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <meshStandardMaterial
          color="#2a2520"
          roughness={0.8}
          metalness={0.1}
        />
      </mesh>

      {/* Side walls (subtle) */}
      <mesh position={[-roomWidth/2, 0, 0]} rotation={[0, Math.PI/2, 0]}>
        <planeGeometry args={[roomDepth, roomHeight]} />
        <meshBasicMaterial color="#0a0a0a" transparent opacity={blend * 0.3} />
      </mesh>
      <mesh position={[roomWidth/2, 0, 0]} rotation={[0, -Math.PI/2, 0]}>
        <planeGeometry args={[roomDepth, roomHeight]} />
        <meshBasicMaterial color="#0a0a0a" transparent opacity={blend * 0.3} />
      </mesh>

      {/* Ceiling */}
      <mesh position={[0, roomHeight/2, 0]} rotation={[Math.PI/2, 0, 0]}>
        <planeGeometry args={[roomWidth, roomDepth]} />
        <meshBasicMaterial color="#050505" transparent opacity={blend * 0.5} />
      </mesh>

      {/* Table */}
      <mesh position={[lampPosition[0], lampPosition[1] - 0.5, lampPosition[2]]}>
        <boxGeometry args={[0.5, 0.03, 0.4]} />
        <meshStandardMaterial color="#3d3428" roughness={0.7} />
      </mesh>
      <mesh position={[lampPosition[0], lampPosition[1] - 0.75, lampPosition[2]]}>
        <cylinderGeometry args={[0.02, 0.02, 0.5, 8]} />
        <meshStandardMaterial color="#2a2520" roughness={0.6} metalness={0.3} />
      </mesh>

      {/* Lamp shade */}
      <mesh ref={lightRef} position={lampPosition}>
        <coneGeometry args={[0.15, 0.2, 16, 1, true]} />
        <meshBasicMaterial
          color="#fff5e6"
          transparent
          opacity={0}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* Lamp light bulb */}
      <mesh position={lampPosition}>
        <sphereGeometry args={[0.04, 12, 12]} />
        <meshBasicMaterial color="#ffcc66" />
      </mesh>

      {/* Lamp glow */}
      <mesh ref={glowRef} position={lampPosition}>
        <sphereGeometry args={[0.3, 16, 16]} />
        <primitive object={lampGlowMaterial} attach="material" />
      </mesh>

      {/* Point light from lamp */}
      <pointLight
        position={lampPosition}
        color="#ffcc66"
        intensity={blend * 2}
        distance={4}
        decay={2}
      />

      {/* Floating dust particles */}
      <points ref={dustRef} geometry={dustGeometry} material={dustMaterial} />

      {/* Ambient light */}
      <ambientLight intensity={blend * 0.15} color="#6688aa" />
    </group>
  )
}
