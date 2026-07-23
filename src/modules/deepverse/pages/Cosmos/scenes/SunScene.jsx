import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// Main sun surface with plasma animation
function SunSurface({ blend }) {
  const ref = useRef()

  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
      },
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vPosition;
        varying vec3 vNormal;
        uniform float uTime;

        void main() {
          vUv = uv;
          vNormal = normalize(normalMatrix * normal);

          // Subtle surface distortion
          vec3 pos = position;
          float distortion = sin(pos.x * 5.0 + uTime * 0.5) * sin(pos.y * 5.0 + uTime * 0.4) * 0.05;
          pos += normal * distortion;

          vPosition = pos;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        varying vec2 vUv;
        varying vec3 vPosition;
        varying vec3 vNormal;

        // Simplex noise functions
        vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
        vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
        vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
        vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

        float snoise(vec3 v) {
          const vec2 C = vec2(1.0/6.0, 1.0/3.0);
          const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

          vec3 i  = floor(v + dot(v, C.yyy));
          vec3 x0 = v - i + dot(i, C.xxx);

          vec3 g = step(x0.yzx, x0.xyz);
          vec3 l = 1.0 - g;
          vec3 i1 = min(g.xyz, l.zxy);
          vec3 i2 = max(g.xyz, l.zxy);

          vec3 x1 = x0 - i1 + C.xxx;
          vec3 x2 = x0 - i2 + C.yyy;
          vec3 x3 = x0 - D.yyy;

          i = mod289(i);
          vec4 p = permute(permute(permute(
            i.z + vec4(0.0, i1.z, i2.z, 1.0))
            + i.y + vec4(0.0, i1.y, i2.y, 1.0))
            + i.x + vec4(0.0, i1.x, i2.x, 1.0));

          float n_ = 0.142857142857;
          vec3 ns = n_ * D.wyz - D.xzx;

          vec4 j = p - 49.0 * floor(p * ns.z * ns.z);

          vec4 x_ = floor(j * ns.z);
          vec4 y_ = floor(j - 7.0 * x_);

          vec4 x = x_ *ns.x + ns.yyyy;
          vec4 y = y_ *ns.x + ns.yyyy;
          vec4 h = 1.0 - abs(x) - abs(y);

          vec4 b0 = vec4(x.xy, y.xy);
          vec4 b1 = vec4(x.zw, y.zw);

          vec4 s0 = floor(b0)*2.0 + 1.0;
          vec4 s1 = floor(b1)*2.0 + 1.0;
          vec4 sh = -step(h, vec4(0.0));

          vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
          vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;

          vec3 p0 = vec3(a0.xy, h.x);
          vec3 p1 = vec3(a0.zw, h.y);
          vec3 p2 = vec3(a1.xy, h.z);
          vec3 p3 = vec3(a1.zw, h.w);

          vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
          p0 *= norm.x;
          p1 *= norm.y;
          p2 *= norm.z;
          p3 *= norm.w;

          vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
          m = m * m;
          return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
        }

        void main() {
          vec3 pos = vPosition * 2.0;

          // Multiple layers of noise for plasma effect
          float n1 = snoise(pos + uTime * 0.3);
          float n2 = snoise(pos * 2.0 - uTime * 0.2);
          float n3 = snoise(pos * 4.0 + uTime * 0.1);
          float n4 = snoise(pos * 8.0 - uTime * 0.15);

          float plasma = n1 * 0.5 + n2 * 0.25 + n3 * 0.15 + n4 * 0.1;
          plasma = plasma * 0.5 + 0.5;

          // Color gradient from deep red to yellow to white
          vec3 color1 = vec3(0.8, 0.1, 0.0);  // Deep red
          vec3 color2 = vec3(1.0, 0.4, 0.0);  // Orange
          vec3 color3 = vec3(1.0, 0.8, 0.2);  // Yellow
          vec3 color4 = vec3(1.0, 1.0, 0.9);  // White hot

          vec3 color;
          if (plasma < 0.33) {
            color = mix(color1, color2, plasma * 3.0);
          } else if (plasma < 0.66) {
            color = mix(color2, color3, (plasma - 0.33) * 3.0);
          } else {
            color = mix(color3, color4, (plasma - 0.66) * 3.0);
          }

          // Brightness variation
          float brightness = 0.85 + 0.15 * plasma;

          gl_FragColor = vec4(color * brightness, 1.0);
        }
      `,
    })
  }, [])

  useFrame(({ clock }) => {
    if (ref.current) {
      ref.current.material.uniforms.uTime.value = clock.getElapsedTime()
    }
  })

  return (
    <mesh ref={ref}>
      <sphereGeometry args={[5, 64, 64]} />
      <primitive object={material} attach="material" />
    </mesh>
  )
}

// Sun corona (outer atmosphere)
function SunCorona({ blend }) {
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
          vPosition = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        varying vec3 vNormal;
        varying vec3 vPosition;

        void main() {
          // Fresnel effect for corona
          vec3 viewDir = normalize(-vPosition);
          float intensity = pow(0.5 - dot(vNormal, viewDir), 2.5);

          // Animated corona streamers
          float angle = atan(vNormal.y, vNormal.x);
          float streamers = sin(angle * 8.0 + uTime * 0.5) * 0.3 + 0.7;

          // Color - orange to red
          vec3 color = mix(vec3(1.0, 0.3, 0.0), vec3(1.0, 0.6, 0.1), intensity);

          float alpha = intensity * streamers * 0.6;

          gl_FragColor = vec4(color, alpha);
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
    <mesh ref={ref} scale={1.4}>
      <sphereGeometry args={[5, 32, 32]} />
      <primitive object={material} attach="material" />
    </mesh>
  )
}

// Solar flares
function SolarFlares({ blend }) {
  const groupRef = useRef()

  const flares = useMemo(() => {
    const result = []
    for (let i = 0; i < 8; i++) {
      const theta = Math.random() * Math.PI * 2
      const phi = Math.random() * Math.PI * 0.4
      result.push({
        theta,
        phi,
        speed: 0.3 + Math.random() * 0.5,
        scale: 0.5 + Math.random() * 1.0,
      })
    }
    return result
  }, [])

  useFrame(({ clock }) => {
    if (groupRef.current) {
      const t = clock.getElapsedTime()
      groupRef.current.children.forEach((flare, i) => {
        const data = flares[i]
        const pulse = 0.7 + 0.3 * Math.sin(t * data.speed * 2 + i)
        flare.scale.setScalar(data.scale * pulse)
        flare.material.opacity = blend * 0.4 * pulse
      })
    }
  })

  return (
    <group ref={groupRef}>
      {flares.map((flare, i) => (
        <mesh key={i} position={[0, 0, 0]} rotation={[flare.phi, flare.theta, 0]}>
          <coneGeometry args={[0.3 * flare.scale, 3 * flare.scale, 8]} />
          <meshBasicMaterial
            color="#ff6622"
            transparent
            opacity={blend * 0.3}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      ))}
    </group>
  )
}

// Outer glow
function SunGlow({ blend }) {
  const ref = useRef()

  useFrame(({ clock }) => {
    if (ref.current) {
      const t = clock.getElapsedTime()
      const pulse = 1 + 0.05 * Math.sin(t * 0.5)
      ref.current.scale.setScalar(pulse)
      ref.current.material.opacity = blend * 0.15
    }
  })

  return (
    <mesh ref={ref}>
      <sphereGeometry args={[12, 24, 24]} />
      <meshBasicMaterial
        color="#ff4400"
        transparent
        opacity={blend * 0.15}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  )
}

// Volumetric light rays
function LightRays({ blend }) {
  const ref = useRef()

  const material = useMemo(() => {
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
          // Radial rays from center
          vec2 center = vec2(0.5, 0.5);
          vec2 dir = vUv - center;
          float angle = atan(dir.y, dir.x);

          float rays = sin(angle * 12.0 + uTime * 0.2) * 0.5 + 0.5;
          rays = pow(rays, 3.0);

          float dist = length(vUv - center);
          float falloff = 1.0 - smoothstep(0.0, 0.8, dist);

          float alpha = rays * falloff * 0.1;

          vec3 color = vec3(1.0, 0.6, 0.2);
          gl_FragColor = vec4(color, alpha);
        }
      `,
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
  }, [])

  useFrame(({ clock }) => {
    if (ref.current) {
      ref.current.material.uniforms.uTime.value = clock.getElapsedTime()
    }
  })

  return (
    <mesh ref={ref} position={[0, 0, -5]}>
      <planeGeometry args={[30, 30]} />
      <primitive object={material} attach="material" />
    </mesh>
  )
}

export default function SunScene({ blend }) {
  return (
    <group>
      <SunSurface blend={blend} />
      <SunCorona blend={blend} />
      <SolarFlares blend={blend} />
      <SunGlow blend={blend} />
      <LightRays blend={blend} />

      {/* Point light emanating from sun */}
      <pointLight color="#ffaa44" intensity={blend * 3} distance={100} decay={1} />
    </group>
  )
}
