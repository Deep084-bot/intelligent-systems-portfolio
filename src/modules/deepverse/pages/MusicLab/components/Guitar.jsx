/**
 * Guitar - Main component integrating the interaction-first architecture
 *
 * Connects AudioEngine with InteractionOrchestrator and GuitarScene.
 * All interaction logic is handled by the orchestrator - this component
 * only manages lifecycle and dependency injection.
 */

import { useRef, useEffect } from 'react'
import GuitarScene from './GuitarScene'
import InteractionOrchestrator from '../core/InteractionOrchestrator'

export default function Guitar({ audioEngine }) {
  const orchestratorRef = useRef(null)

  // Initialize interaction orchestrator with audio engine
  useEffect(() => {
    orchestratorRef.current = new InteractionOrchestrator(audioEngine)

    return () => {
      orchestratorRef.current?.destroy()
    }
  }, [audioEngine])

  return <GuitarScene orchestrator={orchestratorRef.current} />
}
