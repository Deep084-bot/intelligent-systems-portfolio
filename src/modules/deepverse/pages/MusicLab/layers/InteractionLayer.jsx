/**
 * InteractionLayer - DOM event binding and string layout definition
 *
 * Bridges the visual layer with the interaction orchestrator.
 * Defines string positions and handles DOM event routing.
 */

import { useEffect, useRef, useState } from 'react'
import StringLayer from './StringLayer'

// String layout — real acoustic guitar proportions, nut (x=148) to bridge saddle (x=1175)
// Strings are 18px apart; index 0 = low E (thickest), index 5 = high E (thinnest)
const STRING_CONFIG = [
  { index: 0, note: 'E2', y: 224, x1: 148, x2: 1175, hitRadius: 18 },
  { index: 1, note: 'A2', y: 242, x1: 148, x2: 1175, hitRadius: 18 },
  { index: 2, note: 'D3', y: 260, x1: 148, x2: 1175, hitRadius: 18 },
  { index: 3, note: 'G3', y: 278, x1: 148, x2: 1175, hitRadius: 18 },
  { index: 4, note: 'B3', y: 296, x1: 148, x2: 1175, hitRadius: 18 },
  { index: 5, note: 'E4', y: 314, x1: 148, x2: 1175, hitRadius: 18 },
]

export default function InteractionLayer({ orchestrator }) {
  const svgRef = useRef(null)
  const [uiState, setUIState] = useState({
    strings: [],
    hoveredString: null,
    hoverX: null,
  })

  // Initialize collision engine with string layout
  useEffect(() => {
    if (orchestrator) {
      orchestrator.initializeCollision(STRING_CONFIG)
    }
  }, [orchestrator])

  // Subscribe to state changes from orchestrator
  useEffect(() => {
    if (!orchestrator) return

    const unsubscribe = orchestrator.onStateChange((newState) => {
      setUIState(newState)
    })

    // Get initial state
    setUIState(orchestrator.getUIState())

    return unsubscribe
  }, [orchestrator])

  // Bind DOM events to orchestrator
  useEffect(() => {
    if (!orchestrator || !svgRef.current) return

    const cleanup = orchestrator.bindDOMEvents(svgRef.current)
    return cleanup
  }, [orchestrator])

  return (
    <svg
      ref={svgRef}
      viewBox="0 0 1600 560"
      className="w-full h-full absolute inset-0 cursor-pointer"
      preserveAspectRatio="xMidYMid meet"
      style={{ touchAction: 'none' }}
    >
      {STRING_CONFIG.map((config) => {
        const stringState = uiState.strings[config.index] || {}
        return (
          <StringLayer
            key={config.index}
            index={config.index}
            x1={config.x1}
            x2={config.x2}
            y={config.y}
            isVibrating={stringState.isVibrating || false}
            vibrateIntensity={stringState.vibrateIntensity || 0}
            isHovered={uiState.hoveredString === config.index}
            hoverX={uiState.hoveredString === config.index ? uiState.hoverX : null}
            pluckX={stringState.pluckX || null}
          />
        )
      })}
    </svg>
  )
}

export { STRING_CONFIG }
