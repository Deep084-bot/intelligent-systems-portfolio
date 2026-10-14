/**
 * Guitar - Main component integrating the interaction-first architecture
 *
 * Connects AudioEngine with InteractionOrchestrator and GuitarScene.
 * All interaction logic is handled by the orchestrator - this component
 * only manages lifecycle and dependency injection.
 */

import { useState, useEffect } from 'react'
import GuitarScene from './GuitarScene'
import InteractionOrchestrator from '../core/InteractionOrchestrator'

export default function Guitar({ audioEngine }) {
  // The orchestrator must live in state, not a ref: GuitarScene and
  // InteractionLayer can only wire up collision + DOM events once they
  // actually receive it. A ref mutation would not trigger the re-render
  // that hands the orchestrator down, leaving the strings silent.
  const [orchestrator, setOrchestrator] = useState(null)

  useEffect(() => {
    if (!audioEngine) return undefined

    const instance = new InteractionOrchestrator(audioEngine)
    setOrchestrator(instance)

    // StrictMode-safe: tear the instance down cleanly on unmount/remount and
    // drop the reference so InteractionLayer removes its DOM listeners.
    return () => {
      instance.destroy()
      setOrchestrator((current) => (current === instance ? null : current))
    }
  }, [audioEngine])

  return <GuitarScene orchestrator={orchestrator} />
}
