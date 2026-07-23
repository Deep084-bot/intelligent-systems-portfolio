/**
 * InteractionOrchestrator - Coordinates interaction, collision, physics, and audio
 *
 * This is the central hub that connects:
 * - InteractionEngine (input normalization)
 * - CollisionEngine (string hit detection)
 * - StringPhysics (vibration state)
 * - AudioEngine (sound playback)
 *
 * Input-agnostic: Designed so MediaPipe can be added without rewriting any component.
 */

import InteractionEngine from './InteractionEngine'
import CollisionEngine from './CollisionEngine'
import StringPhysics from './StringPhysics'

export class InteractionOrchestrator {
  constructor(audioEngine) {
    this.audioEngine = audioEngine

    // Core engines
    this.interactionEngine = new InteractionEngine()
    this.stringPhysics = new StringPhysics(6)

    // String configuration (will be set by visual layer)
    this.collisionEngine = null

    // State for UI updates
    this.hoveredString = null
    this.hoverX = null
    this.stateListeners = new Set()

    // Subscribe to interaction events
    this.unsubscribe = this.interactionEngine.subscribe(this.handleInteractionEvent.bind(this))
  }

  /**
   * Initialize collision engine with string layout
   * Called by GuitarScene when layout is ready
   */
  initializeCollision(stringConfig) {
    this.collisionEngine = new CollisionEngine(stringConfig)
  }

  /**
   * Handle normalized interaction events from any input source
   */
  handleInteractionEvent(event) {
    if (!this.collisionEngine) return

    switch (event.type) {
      case 'pointer-move':
        this.handlePointerMove(event)
        break
      case 'pointer-down':
        this.handlePointerDown(event)
        break
      case 'pointer-up':
      case 'pointer-leave':
        this.handlePointerEnd(event)
        break
    }
  }

  handlePointerMove(event) {
    // Calculate velocity for drag interactions
    const velocity = this.interactionEngine.calculateVelocity(
      event.pointerId,
      event.x,
      event.y
    )

    // Test collision
    const collision = this.collisionEngine.testCollision(
      event.x,
      event.y,
      event.pointerId,
      velocity
    )

    if (collision && collision.isNewCollision) {
      // New string crossed - trigger pluck
      this.pluckString(
        collision.stringIndex,
        collision.velocity,
        collision.localX,
        collision.absoluteX
      )
    }

    // Test proximity for hover effects
    const proximity = this.collisionEngine.testProximity(event.x, event.y)

    if (proximity) {
      this.hoveredString = proximity.stringIndex
      this.hoverX = proximity.absoluteX
    } else {
      this.hoveredString = null
      this.hoverX = null
    }

    this.notifyStateChange()
  }

  handlePointerDown(event) {
    // Direct click/tap on a string
    const collision = this.collisionEngine.testCollision(
      event.x,
      event.y,
      event.pointerId,
      0
    )

    if (collision) {
      this.pluckString(
        collision.stringIndex,
        1.0, // Full velocity for direct click
        collision.localX,
        collision.absoluteX
      )
    }
  }

  handlePointerEnd(event) {
    // Clear collision state for this pointer
    this.collisionEngine.clearPointer(event.pointerId)

    // Clear hover if this was the last active pointer
    if (this.interactionEngine.activePointers.size === 0) {
      this.hoveredString = null
      this.hoverX = null
      this.notifyStateChange()
    }
  }

  /**
   * Pluck a string (trigger physics + audio)
   */
  async pluckString(stringIndex, velocity, localX, absoluteX) {
    // Update physics state
    this.stringPhysics.pluck(stringIndex, velocity, localX, absoluteX)

    // Play audio
    if (this.audioEngine) {
      await this.audioEngine.playString(stringIndex, velocity)
    }

    this.notifyStateChange()
  }

  /**
   * Get current UI state for rendering
   */
  getUIState() {
    return {
      strings: this.stringPhysics.getAllStates(),
      hoveredString: this.hoveredString,
      hoverX: this.hoverX,
    }
  }

  /**
   * Subscribe to state changes
   */
  onStateChange(callback) {
    this.stateListeners.add(callback)
    return () => this.stateListeners.delete(callback)
  }

  /**
   * Notify all listeners of state change
   */
  notifyStateChange() {
    const state = this.getUIState()
    this.stateListeners.forEach(listener => listener(state))
  }

  /**
   * Bind native DOM events to interaction engine
   * Returns cleanup function
   */
  bindDOMEvents(element) {
    const getBounds = () => element.getBoundingClientRect()

    const handlers = {
      mousemove: (e) => this.interactionEngine.handleMouseMove(e, getBounds()),
      mousedown: (e) => this.interactionEngine.handleMouseDown(e, getBounds()),
      mouseup: (e) => this.interactionEngine.handleMouseUp(e, getBounds()),
      mouseleave: () => this.interactionEngine.handleMouseLeave(),
      touchmove: (e) => this.interactionEngine.handleTouchMove(e, getBounds()),
      touchstart: (e) => this.interactionEngine.handleTouchStart(e, getBounds()),
      touchend: (e) => this.interactionEngine.handleTouchEnd(e, getBounds()),
    }

    Object.entries(handlers).forEach(([event, handler]) => {
      element.addEventListener(event, handler, { passive: false })
    })

    return () => {
      Object.entries(handlers).forEach(([event, handler]) => {
        element.removeEventListener(event, handler)
      })
    }
  }

  /**
   * Future: Handle MediaPipe hand landmarks
   * Called by MediaPipeAdapter when hand tracking is enabled
   */
  handleHandLandmarks(landmarks) {
    // landmarks: Array of { x, y, z, id, visibility }
    // Convert to interaction events
    landmarks.forEach(landmark => {
      this.interactionEngine.handleHandLandmark(landmark, null)
    })
  }

  /**
   * Clean up
   */
  destroy() {
    if (this.unsubscribe) {
      this.unsubscribe()
    }
    this.interactionEngine?.destroy()
    this.collisionEngine?.destroy()
    this.stringPhysics?.destroy()
    this.stateListeners.clear()
  }
}

export default InteractionOrchestrator
