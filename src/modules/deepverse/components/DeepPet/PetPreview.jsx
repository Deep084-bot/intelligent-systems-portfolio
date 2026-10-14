import { useMemo } from 'react'
import useReducedMotion from './useReducedMotion'
import PetBody from './PetBody'
import './DeepPet.css'

// A small, non-interactive DeepPet used as a character preview inside the portal
// card. It reuses the exact same renderer + motion as the floating pet, so the
// preview and the companion can never drift apart. No event bus, no idle timer,
// no canvas — just the visual shell, so it stays cheap on the portal grid.
export default function PetPreview({ state = 'curious', size = 72 }) {
  const reduced = useReducedMotion()
  const style = useMemo(() => ({ width: size, height: size }), [size])

  return (
    <div
      className="deeppet deeppet--preview"
      data-state={state}
      data-reduced={reduced ? 'true' : 'false'}
      style={style}
      aria-hidden="true"
    >
      <div className="deeppet-stage">
        <PetBody state={state} />
      </div>
    </div>
  )
}
