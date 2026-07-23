import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// Glowing particle that represents the viewer's perspective
function PerspectiveParticle({ blend }) {
  const ref = useRef()
  const glowRef = useRef()

  useFrame(({ clock }) => {
    if (!ref.current) return
    const t = clock.getElapsedTime()

    // Gentle floating motion
    ref.current.position.y = Math.sin(t * 0.5) * 0.1
    ref.current.position.x = Math.cos(t * 0.3) * 0.05

    // Pulse
    const pulse = 0.8 + 0.2 * Math.sin(t * 2)
    ref.current.material.opacity = blend * pulse

    // Glow pulse
    if (glowRef.current) {
      const glowPulse = 0.6 + 0.4 * Math.sin(t * 1.5)
      glowRef.current.scale.setScalar(1 + 0.1 * Math.sin(t * 2))
      glowRef.current.material.opacity = blend * 0.25 * glowPulse
    }
  })

  return (
    <group>
      {/* Core */}
      <mesh ref={ref}>
        <sphereGeometry args={[0.08, 16, 16]} />
        <meshBasicMaterial
          color="#7dd3fc"
          transparent
          opacity={0}
          depthWrite={false}
        />
      </mesh>

      {/* Outer glow */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[0.2, 16, 16]} />
        <meshBasicMaterial
          color="#0ea5e9"
          transparent
          opacity={0}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  )
}

// Radiating rings to show scale expansion
function ScaleRings({ blend }) {
  const groupRef = useRef()

  useFrame(({ clock }) => {
    if (!groupRef.current) return
    const t = clock.getElapsedTime()

    groupRef.current.children.forEach((ring, i) => {
      const phase = (t * 0.3 + i * 0.5) % 3
      const scale = phase * 2
      ring.scale.setScalar(scale)

      // Fade as it expands
      const opacity = Math.max(0, (1 - phase / 3)) * 0.15 * blend
      ring.material.opacity = opacity
    })
  })

  return (
    <group ref={groupRef}>
      {[0, 1, 2].map((i) => (
        <mesh key={i} rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.9, 1, 32]} />
          <meshBasicMaterial
            color="#7dd3fc"
            transparent
            opacity={0}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  )
}

// Ambient particles floating around
function AmbientParticles({ blend }) {
  const ref = useRef()
  const count = 50

  const { positions, sizes } = useMemo(() => {
    const pos = new Float32Array(count * 3)
    const s = new Float32Array(count)

    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      const r = 0.5 + Math.random() * 1.5

      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta)
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
      pos[i * 3 + 2] = r * Math.cos(phi)

      s[i] = 0.02 + Math.random() * 0.04
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
    if (!ref.current) return
    const t = clock.getElapsedTime()

    ref.current.rotation.y = t * 0.05
    ref.current.rotation.x = t * 0.03
  })

  return (
    <points ref={ref} geometry={geometry}>
      <pointsMaterial
        color="#7dd3fc"
        size={0.08}
        transparent
        opacity={blend * 0.4}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}

export default function InvitationScene({ blend }) {
  return (
    <group>
      <PerspectiveParticle blend={blend} />
      <ScaleRings blend={blend} />
      <AmbientParticles blend={blend} />

      {/* Soft ambient light */}
      <pointLight color="#7dd3fc" intensity={blend * 0.5} distance={5} decay={2} />
    </group>
  )
}
