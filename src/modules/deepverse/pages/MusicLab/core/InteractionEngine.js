/**
 * InteractionEngine - Input-agnostic interaction system
 *
 * Converts all input sources (mouse, touch, MediaPipe) into normalized
 * interaction events that the collision system can process uniformly.
 */

export class InteractionEngine {
  constructor() {
    this.listeners = new Set()
    this.activePointers = new Map() // Track multiple simultaneous touches
  }

  /**
   * Subscribe to interaction events
   * @param {Function} callback - Receives normalized interaction events
   * @returns {Function} Unsubscribe function
   */
  subscribe(callback) {
    this.listeners.add(callback)
    return () => this.listeners.delete(callback)
  }

  /**
   * Emit normalized interaction event to all subscribers
   */
  emit(event) {
    this.listeners.forEach(listener => listener(event))
  }

  /**
   * Normalize mouse event to interaction coordinates
   */
  handleMouseMove(nativeEvent, bounds) {
    const pointer = this.normalizePointer(nativeEvent, bounds)
    this.emit({
      type: 'pointer-move',
      pointerId: 'mouse',
      x: pointer.x,
      y: pointer.y,
      pressure: nativeEvent.buttons > 0 ? 1.0 : 0,
      source: 'mouse',
    })
  }

  handleMouseDown(nativeEvent, bounds) {
    const pointer = this.normalizePointer(nativeEvent, bounds)
    this.activePointers.set('mouse', { x: pointer.x, y: pointer.y, timestamp: Date.now() })
    this.emit({
      type: 'pointer-down',
      pointerId: 'mouse',
      x: pointer.x,
      y: pointer.y,
      pressure: 1.0,
      source: 'mouse',
    })
  }

  handleMouseUp(nativeEvent, bounds) {
    const pointer = this.normalizePointer(nativeEvent, bounds)
    this.activePointers.delete('mouse')
    this.emit({
      type: 'pointer-up',
      pointerId: 'mouse',
      x: pointer.x,
      y: pointer.y,
      pressure: 0,
      source: 'mouse',
    })
  }

  handleMouseLeave() {
    this.activePointers.delete('mouse')
    this.emit({
      type: 'pointer-leave',
      pointerId: 'mouse',
      source: 'mouse',
    })
  }

  /**
   * Normalize touch events to interaction coordinates
   */
  handleTouchMove(nativeEvent, bounds) {
    Array.from(nativeEvent.changedTouches).forEach(touch => {
      const pointer = this.normalizeTouchPointer(touch, bounds)
      this.emit({
        type: 'pointer-move',
        pointerId: `touch-${touch.identifier}`,
        x: pointer.x,
        y: pointer.y,
        pressure: touch.force || 1.0,
        source: 'touch',
      })
    })
  }

  handleTouchStart(nativeEvent, bounds) {
    Array.from(nativeEvent.changedTouches).forEach(touch => {
      const pointer = this.normalizeTouchPointer(touch, bounds)
      this.activePointers.set(`touch-${touch.identifier}`, { x: pointer.x, y: pointer.y, timestamp: Date.now() })
      this.emit({
        type: 'pointer-down',
        pointerId: `touch-${touch.identifier}`,
        x: pointer.x,
        y: pointer.y,
        pressure: touch.force || 1.0,
        source: 'touch',
      })
    })
  }

  handleTouchEnd(nativeEvent, bounds) {
    Array.from(nativeEvent.changedTouches).forEach(touch => {
      const pointer = this.normalizeTouchPointer(touch, bounds)
      this.activePointers.delete(`touch-${touch.identifier}`)
      this.emit({
        type: 'pointer-up',
        pointerId: `touch-${touch.identifier}`,
        x: pointer.x,
        y: pointer.y,
        pressure: 0,
        source: 'touch',
      })
    })
  }

  /**
   * Normalize MediaPipe hand landmark to interaction coordinates
   * (Will be implemented when MediaPipe is added - architecture ready)
   */
  handleHandLandmark(landmark, bounds) {
    // landmark: { x: 0-1, y: 0-1, z: depth, visibility: 0-1 }
    // Convert normalized coordinates to SVG space
    const pointer = {
      x: landmark.x * 1200,
      y: landmark.y * 800,
      z: landmark.z || 0,
    }

    this.emit({
      type: 'pointer-move',
      pointerId: `hand-${landmark.id || 0}`,
      x: pointer.x,
      y: pointer.y,
      z: pointer.z,
      pressure: landmark.visibility || 1.0,
      source: 'mediapipe',
    })
  }

  /**
   * Convert DOM coordinates to SVG viewBox coordinates (1200x800)
   */
  normalizePointer(event, bounds) {
    const x = event.clientX - bounds.left
    const y = event.clientY - bounds.top
    return {
      x: (x / bounds.width) * 1200,
      y: (y / bounds.height) * 800,
    }
  }

  normalizeTouchPointer(touch, bounds) {
    const x = touch.clientX - bounds.left
    const y = touch.clientY - bounds.top
    return {
      x: (x / bounds.width) * 1200,
      y: (y / bounds.height) * 800,
    }
  }

  /**
   * Calculate velocity from pointer movement
   */
  calculateVelocity(pointerId, currentX, currentY) {
    const previous = this.activePointers.get(pointerId)
    if (!previous) return 0

    const timeDelta = Date.now() - previous.timestamp
    const distance = Math.sqrt(
      Math.pow(currentX - previous.x, 2) +
      Math.pow(currentY - previous.y, 2)
    )

    // Update stored position
    this.activePointers.set(pointerId, { x: currentX, y: currentY, timestamp: Date.now() })

    // Convert to velocity (pixels per millisecond)
    return timeDelta > 0 ? distance / timeDelta : 0
  }

  /**
   * Clean up
   */
  destroy() {
    this.listeners.clear()
    this.activePointers.clear()
  }
}

export default InteractionEngine
