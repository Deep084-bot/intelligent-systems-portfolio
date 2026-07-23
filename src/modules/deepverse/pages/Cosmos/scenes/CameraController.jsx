import { useFrame, useThree } from '@react-three/fiber'
import { useRef } from 'react'
import { STAGES } from '../stages'

function getTargetZ(progress) {
  for (let i = 0; i < STAGES.length - 1; i++) {
    const s = STAGES[i]
    const next = STAGES[i + 1]
    const mid = (s.end + next.start) / 2
    if (progress <= mid) {
      const t = (progress - s.start) / (s.end - s.start)
      const z = s.camera.z + (next.camera.z - s.camera.z) * Math.min(1, Math.max(0, t))
      return z
    }
  }
  return STAGES[STAGES.length - 1].camera.z
}

export default function CameraController({ progressRef }) {
  const { camera } = useThree()
  const currentZ = useRef(camera.position.z)

  useFrame(() => {
    const progress = progressRef.current
    const targetZ = getTargetZ(progress)
    currentZ.current += (targetZ - currentZ.current) * 0.04
    camera.position.set(0, 0, currentZ.current)
    camera.lookAt(0, 0, 0)
  })

  return null
}
