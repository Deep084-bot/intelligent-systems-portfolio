/**
 * CollisionEngine - String collision detection and physics
 *
 * Processes normalized interaction events and detects string collisions.
 * Input-agnostic: works with mouse, touch, or MediaPipe equally.
 */

export class CollisionEngine {
  constructor(stringConfig) {
    this.strings = stringConfig // Array of { index, y, x1, x2, hitRadius }
    this.activeCollisions = new Map() // Track which pointers are colliding with which strings
  }

  /**
   * Test if a point collides with any string
   * @returns {{ stringIndex: number, localX: number, velocity: number } | null}
   */
  testCollision(x, y, pointerId, velocity = 0) {
    // Pick the NEAREST string within the hit radius rather than the first
    // match. The hit radius equals the string spacing, so a first-match loop
    // would always resolve to the lowest-index string in an overlap zone and
    // make the highest strings (index 4/5) impossible to pluck.
    let match = null

    for (const string of this.strings) {
      if (x >= string.x1 && x <= string.x2) {
        const distance = Math.abs(y - string.y)

        if (distance <= string.hitRadius && (!match || distance < match.distance)) {
          match = {
            string,
            distance,
            // Normalized position along string (0 to 1)
            localX: (x - string.x1) / (string.x2 - string.x1),
          }
        }
      }
    }

    if (match) {
      const lastString = this.activeCollisions.get(pointerId)
      const isNewCollision = lastString !== match.string.index

      if (isNewCollision) {
        this.activeCollisions.set(pointerId, match.string.index)
      }

      return {
        stringIndex: match.string.index,
        localX: match.localX,
        absoluteX: x, // Absolute SVG coordinate
        velocity: isNewCollision ? Math.min(velocity * 2, 1.0) : 0, // Scale velocity to 0-1
        isNewCollision,
      }
    }

    // No collision - clear active collision for this pointer
    this.activeCollisions.delete(pointerId)
    return null
  }

  /**
   * Calculate proximity to nearest string (for hover effects)
   * @returns {{ stringIndex: number, distance: number, localX: number } | null}
   */
  testProximity(x, y) {
    let nearest = null
    let minDistance = Infinity

    for (const string of this.strings) {
      if (x >= string.x1 && x <= string.x2) {
        const distance = Math.abs(y - string.y)

        if (distance < minDistance) {
          minDistance = distance
          const localX = (x - string.x1) / (string.x2 - string.x1)

          nearest = {
            stringIndex: string.index,
            distance,
            localX,
            absoluteX: x,
          }
        }
      }
    }

    return nearest
  }

  /**
   * Clear collision state for a specific pointer (on pointer-up or pointer-leave)
   */
  clearPointer(pointerId) {
    this.activeCollisions.delete(pointerId)
  }

  /**
   * Update string configuration (if layout changes)
   */
  updateStrings(stringConfig) {
    this.strings = stringConfig
  }

  /**
   * Clean up
   */
  destroy() {
    this.activeCollisions.clear()
  }
}

export default CollisionEngine
