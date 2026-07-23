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
    for (const string of this.strings) {
      // Check if point is within string bounds
      if (x >= string.x1 && x <= string.x2) {
        const distance = Math.abs(y - string.y)

        // Hit detection with configurable radius
        if (distance <= string.hitRadius) {
          // Calculate local X position on string (0 to 1)
          const localX = (x - string.x1) / (string.x2 - string.x1)

          // Check if this is a new collision (crossing threshold)
          const lastString = this.activeCollisions.get(pointerId)
          const isNewCollision = lastString !== string.index

          if (isNewCollision) {
            this.activeCollisions.set(pointerId, string.index)

            return {
              stringIndex: string.index,
              localX, // Normalized position along string (for pluck effect)
              absoluteX: x, // Absolute SVG coordinate
              velocity: Math.min(velocity * 2, 1.0), // Scale velocity to 0-1
              isNewCollision: true,
            }
          }

          // Update position but don't trigger new collision
          return {
            stringIndex: string.index,
            localX,
            absoluteX: x,
            velocity: 0,
            isNewCollision: false,
          }
        }
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
