import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { STAGES } from '../stages'

// Custom glowing silhouette shader
function createHumanShader() {
  return new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uColor: { value: new THREE.Color('#7dd3fc') },
      uGlowColor: { value: new THREE.Color('#0ea5e9') },
    },
    vertexShader: `
      varying vec3 vNormal;
      varying vec3 vPosition;

      void main() {
        vNormal = normalize(normalMatrix * normal);
        vPosition = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform float uTime;
      uniform vec3 uColor;
      uniform vec3 uGlowColor;
      varying vec3 vNormal;
      varying vec3 vPosition;

      void main() {
        // Fresnel-like edge glow
        vec3 viewDir = normalize(cameraPosition - vPosition);
        float fresnel = pow(1.0 - abs(dot(vNormal, viewDir)), 2.5);

        // Subtle pulse
        float pulse = 0.85 + 0.15 * sin(uTime * 0.8);

        // Core color with edge glow
        vec3 color = mix(uColor, uGlowColor, fresnel);
        float alpha = 0.7 + fresnel * 0.3;

        gl_FragColor = vec4(color * pulse, alpha);
      }
    `,
    transparent: true,
    side: THREE.DoubleSide,
    depthWrite: false,
  })
}

export default function HumanScene({ blend, progress }) {
  const stage = STAGES[1]
  const localP = Math.min(1, Math.max(0, (progress - stage.start) / (stage.end - stage.start)))
  const s = Math.max(0.05, 1 - localP * 0.8)

  const groupRef = useRef()
  const bodyRef = useRef()
  const glowRef = useRef()
  const auraRef = useRef()
  const floorRef = useRef()

  // Human shader material
  const bodyMaterial = useMemo(() => createHumanShader(), [])

  // Create human silhouette geometry using merged shapes
  const bodyGeometry = useMemo(() => {
    // Head - sphere
    const head = new THREE.SphereGeometry(0.18, 24, 24)

    // Torso - tapered cylinder
    const torso = new THREE.CylinderGeometry(0.15, 0.22, 0.6, 16)

    // Arms - tubes
    const armCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.22, 0.15, 0),
      new THREE.Vector3(0.35, -0.1, 0),
      new THREE.Vector3(0.32, -0.45, 0),
    ])
    const armGeo = new THREE.TubeGeometry(armCurve, 12, 0.04, 8, false)

    // Merge all geometries
    const merged = new THREE.BufferGeometry()
    const geometries = [head, torso, armGeo]

    // Mirror arm
    const armCurve2 = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.22, 0.15, 0),
      new THREE.Vector3(-0.35, -0.1, 0),
      new THREE.Vector3(-0.32, -0.45, 0),
    ])
    const armGeo2 = new THREE.TubeGeometry(armCurve2, 12, 0.04, 8, false)
    geometries.push(armGeo2)

    // Legs
    const legCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.1, -0.3, 0),
      new THREE.Vector3(0.12, -0.7, 0),
      new THREE.Vector3(0.08, -1.1, 0),
    ])
    const legGeo = new THREE.TubeGeometry(legCurve, 12, 0.055, 8, false)
    geometries.push(legGeo)

    const legCurve2 = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.1, -0.3, 0),
      new THREE.Vector3(-0.12, -0.7, 0),
      new THREE.Vector3(-0.08, -1.1, 0),
    ])
    const legGeo2 = new THREE.TubeGeometry(legCurve2, 12, 0.055, 8, false)
    geometries.push(legGeo2)

    // Position head
    head.translate(0, 0.55, 0)
    torso.translate(0, 0.05, 0)

    // Merge using BufferGeometryUtils pattern
    const mergedGeo = new THREE.BufferGeometry()
    let totalVertices = 0
    geometries.forEach(g => { totalVertices += g.attributes.position.count })

    const positions = new Float32Array(totalVertices * 3)
    let offset = 0
    geometries.forEach(g => {
      const pos = g.attributes.position.array
      positions.set(pos, offset)
      offset += pos.length
    })

    mergedGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    mergedGeo.computeVertexNormals()

    return mergedGeo
  }, [])

  // Floor reflection
  const floorGeometry = useMemo(() => {
    return new THREE.PlaneGeometry(8, 8)
  }, [])

  const floorMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uColor: { value: new THREE.Color('#7dd3fc') },
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
        uniform vec3 uColor;
        varying vec2 vUv;
        varying vec3 vPosition;

        void main() {
          float dist = length(vUv - vec2(0.5)) * 2.0;
          float alpha = smoothstep(1.0, 0.0, dist) * 0.15;

          // Ripple effect
          float ripple = sin(dist * 8.0 - uTime * 2.0) * 0.5 + 0.5;
          alpha *= 0.7 + ripple * 0.3;

          gl_FragColor = vec4(uColor, alpha);
        }
      `,
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false,
    })
  }, [])

  // Glow aura material
  const auraMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uColor: { value: new THREE.Color('#0ea5e9') },
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
        uniform vec3 uColor;
        varying vec3 vNormal;

        void main() {
          float intensity = pow(0.65 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
          float pulse = 0.7 + 0.3 * sin(uTime * 1.2);
          gl_FragColor = vec4(uColor, intensity * pulse * 0.4);
        }
      `,
      transparent: true,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
  }, [])

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()

    if (bodyRef.current && bodyRef.current.material.uniforms) {
      bodyRef.current.material.uniforms.uTime.value = t
    }
    if (glowRef.current) {
      const pulse = 0.85 + 0.15 * Math.sin(t * 0.8)
      glowRef.current.material.opacity = blend * 0.35 * pulse
    }
    if (auraRef.current) {
      auraRef.current.material.uniforms.uTime.value = t
      const auraPulse = 1.0 + 0.08 * Math.sin(t * 0.6)
      auraRef.current.scale.setScalar(auraPulse)
    }
    if (floorRef.current) {
      floorRef.current.material.uniforms.uTime.value = t
    }
    if (groupRef.current) {
      // Subtle floating animation
      groupRef.current.position.y = Math.sin(t * 0.5) * 0.03
    }
  })

  return (
    <group ref={groupRef} scale={s}>
      {/* Main body silhouette */}
      <mesh ref={bodyRef} geometry={bodyGeometry} material={bodyMaterial} />

      {/* Outer glow */}
      <mesh ref={glowRef} scale={1.15}>
        <sphereGeometry args={[0.8, 16, 16]} />
        <meshBasicMaterial
          color="#0ea5e9"
          transparent
          opacity={0}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Aura halo */}
      <mesh ref={auraRef}>
        <sphereGeometry args={[0.9, 24, 24]} />
        <primitive object={auraMaterial} attach="material" />
      </mesh>

      {/* Floor reflection */}
      <mesh
        ref={floorRef}
        geometry={floorGeometry}
        material={floorMaterial}
        position={[0, -1.15, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
      />

      {/* Ambient light for atmosphere */}
      <pointLight color="#7dd3fc" intensity={0.5} distance={3} decay={2} />
    </group>
  )
}
