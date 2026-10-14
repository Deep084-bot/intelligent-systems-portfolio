import { useRef, useLayoutEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { stageVisibility } from './helpers'

// Wraps a stage's meshes/lights and cross-fades the whole subtree based on the
// scroll progress. Children stay mounted (so geometry/textures are built once);
// only their material opacity and light intensity are scaled, which lets
// neighbouring stages dissolve into each other during a transition.
export default function StageGroup({ progressRef, range, children, ...props }) {
  const ref = useRef()
  const bases = useRef({ mats: [], lights: [] })

  useLayoutEffect(() => {
    const mats = []
    const lights = []
    ref.current.traverse((o) => {
      if (o.material) {
        const list = Array.isArray(o.material) ? o.material : [o.material]
        for (const m of list) {
          if (m.userData.__baseOpacity === undefined) {
            m.userData.__baseOpacity = m.opacity
            m.userData.__baseTransparent = m.transparent
          }
          m.transparent = true
          mats.push(m)
        }
      }
      if (o.isLight) {
        if (o.userData.__baseIntensity === undefined) o.userData.__baseIntensity = o.intensity
        lights.push(o)
      }
    })
    bases.current = { mats, lights }
    // Children are static per stage; capture once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useFrame(() => {
    const g = ref.current
    if (!g) return
    const v = stageVisibility(progressRef.current, range)
    g.visible = v > 0.002
    if (!g.visible) return
    const { mats, lights } = bases.current
    for (const m of mats) m.opacity = (m.userData.__baseOpacity ?? 1) * v
    for (const l of lights) l.intensity = (l.userData.__baseIntensity ?? 1) * v
  })

  return (
    <group ref={ref} {...props}>
      {children}
    </group>
  )
}
