/**
 * InteractionLayer - DOM event binding and string layout definition
 *
 * Bridges the visual layer with the interaction orchestrator.
 * Defines string positions and handles DOM event routing.
 */

import { useEffect, useRef, useState } from 'react'
import StringLayer from './StringLayer'

// String layout configuration
// Extended to 960px (80% of viewport), positioned for interaction-first composition
const STRING_CONFIG = [
  { index: 0, note: 'E', y: 310, x1: 160, x2: 1120, hitRadius: 30 },
  { index: 1, note: 'B', y: 370, x1: 160, x2: 1120, hitRadius: 30 },
  { index: 2, note: 'G', y: 430, x1: 160, x2: 1120, hitRadius: 30 },
  { index: 3, note: 'D', y: 490, x1: 160, x2: 1120, hitRadius: 30 },
  { index: 4, note: 'A', y: 550, x1: 160, x2: 1120, hitRadius: 30 },
  { index: 5, note: 'E', y: 610, x1: 160, x2: 1120, hitRadius: 30 },
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
      viewBox="0 0 1200 800"
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
