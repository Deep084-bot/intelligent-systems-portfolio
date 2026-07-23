/**
 * StringPhysics - String vibration and visual state management
 *
 * Manages the physical state of each string independently.
 * Tracks vibration, decay, and visual effects without coupling to input source.
 */

export class StringPhysics {
  constructor(stringCount = 6) {
    this.strings = Array.from({ length: stringCount }, (_, index) => ({
      index,
      isVibrating: false,
      vibrateIntensity: 0,
      pluckPosition: null, // Normalized 0-1 position where string was plucked
      pluckX: null, // Absolute SVG X coordinate
      decayTimer: null,
    }))
  }

  /**
   * Trigger string vibration from collision
   */
  pluck(stringIndex, velocity, localX, absoluteX) {
    const string = this.strings[stringIndex]
    if (!string) return

    // Clear existing decay timer
    if (string.decayTimer) {
      clearTimeout(string.decayTimer)
    }

    // Set vibration state
    string.isVibrating = true
    string.vibrateIntensity = velocity
    string.pluckPosition = localX
    string.pluckX = absoluteX

    // Calculate decay time based on string index (lower strings sustain longer)
    const decayTime = 600 + (5 - stringIndex) * 50

    // Schedule decay
    string.decayTimer = setTimeout(() => {
      string.isVibrating = false
      string.vibrateIntensity = 0
      string.pluckPosition = null
      string.pluckX = null
      string.decayTimer = null
    }, decayTime)
  }

  /**
   * Get current state of a string
   */
  getStringState(stringIndex) {
    return this.strings[stringIndex] || null
  }

  /**
   * Get all string states (for rendering)
   */
  getAllStates() {
    return this.strings.map(s => ({
      index: s.index,
      isVibrating: s.isVibrating,
      vibrateIntensity: s.vibrateIntensity,
      pluckPosition: s.pluckPosition,
      pluckX: s.pluckX,
    }))
  }

  /**
   * Clean up
   */
  destroy() {
    this.strings.forEach(string => {
      if (string.decayTimer) {
        clearTimeout(string.decayTimer)
      }
    })
    this.strings = []
  }
}

export default StringPhysics
