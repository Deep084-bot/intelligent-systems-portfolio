// Set to true to enable per-frame finger state logging
const DEBUG_GESTURES = false

// Project `point` onto the directed axis from->to and return the
// normalized projection distance.  The return value is a scalar:
//
//   proj > 1.0  → point extends beyond `to`
//   proj < 0.0  → point lies behind `from`
//   0 ≤ proj ≤ 1 → point lies between `from` and `to`
function project(point, from, to) {
  const dx = to.x - from.x
  const dy = to.y - from.y
  const vx = point.x - from.x
  const vy = point.y - from.y

  const dot = vx * dx + vy * dy
  const lenSq = dx * dx + dy * dy
  if (lenSq === 0) return 0

  return dot / lenSq
}

/**
 * Classify a single finger as OPEN or CLOSED using 2D landmark
 * projection.
 *
 * MediaPipe hand landmark indices (per finger):
 *   MCP (metacarpophalangeal) – knuckle at palm
 *   PIP (proximal interphalangeal) – middle joint
 *   DIP (distal interphalangeal) – joint below tip
 *   TIP – fingertip
 *
 * When the finger is extended the TIP, DIP, PIP, MCP landmarks form
 * a straight line.  Projecting TIP onto the MCP→PIP axis gives a
 * value well beyond 1.0.
 *
 * When the finger is curled the TIP folds back towards the palm, so
 * its projection lands between MCP and PIP (proj < 1.0) or even
 * behind MCP (proj < 0.0).
 */
function isFingerOpen(landmarks, tipIdx, pipIdx, mcpIdx) {
  const mcp = landmarks[mcpIdx]
  const pip = landmarks[pipIdx]
  const tip = landmarks[tipIdx]

  const proj = project(tip, mcp, pip)
  return proj > 1.0
}

/**
 * Classify the thumb using a distance heuristic instead of
 * projection (the thumb abducts sideways rather than extending
 * forward like the fingers).
 *
 * Compares the squared distance from the thumb TIP to the index MCP
 * versus the thumb IP joint to the same reference.  When the thumb
 * is adducted (closed) the tip is roughly as close as the IP joint;
 * when abducted (open) the tip is significantly farther.
 */
function isThumbOpen(landmarks) {
  // Squared distance from thumb tip (4) to index MCP (5)
  const tipDx = landmarks[4].x - landmarks[5].x
  const tipDy = landmarks[4].y - landmarks[5].y
  const tipDistSq = tipDx * tipDx + tipDy * tipDy

  // Squared distance from thumb IP joint (3) to index MCP (5)
  const ipDx = landmarks[3].x - landmarks[5].x
  const ipDy = landmarks[3].y - landmarks[5].y
  const ipDistSq = ipDx * ipDx + ipDy * ipDy

  return tipDistSq > ipDistSq * 1.5
}

export function classifyGesture(landmarks) {
  if (!landmarks || landmarks.length < 21) return 'none'

  // MediaPipe landmark indices for each finger:
  //   Index  – MCP=5,  PIP=6,  TIP=8
  //   Middle – MCP=9,  PIP=10, TIP=12
  //   Ring   – MCP=13, PIP=14, TIP=16
  //   Pinky  – MCP=17, PIP=18, TIP=20
  const indexOpen = isFingerOpen(landmarks, 8, 6, 5)
  const middleOpen = isFingerOpen(landmarks, 12, 10, 9)
  const ringOpen = isFingerOpen(landmarks, 16, 14, 13)
  const pinkyOpen = isFingerOpen(landmarks, 20, 18, 17)
  const thumbOpen = isThumbOpen(landmarks)

  const fingerState = {
    Thumb: thumbOpen ? 'OPEN' : 'CLOSED',
    Index: indexOpen ? 'OPEN' : 'CLOSED',
    Middle: middleOpen ? 'OPEN' : 'CLOSED',
    Ring: ringOpen ? 'OPEN' : 'CLOSED',
    Pinky: pinkyOpen ? 'OPEN' : 'CLOSED',
  }

  // Count how many fingers (excluding thumb) are open
  const openCount = [indexOpen, middleOpen, ringOpen, pinkyOpen].filter(Boolean).length

  let gesture = 'none'

  // Rock  – all four fingers CLOSED (fist)
  if (openCount === 0) {
    gesture = 'rock'
  }
  // Paper – all four fingers OPEN
  else if (openCount === 4) {
    gesture = 'paper'
  }
  // Scissors – index + middle OPEN, ring + pinky CLOSED
  else if (indexOpen && middleOpen && !ringOpen && !pinkyOpen) {
    gesture = 'scissors'
  }

  if (DEBUG_GESTURES) {
    console.log(
      `Thumb: ${fingerState.Thumb}  Index: ${fingerState.Index}  ` +
      `Middle: ${fingerState.Middle}  Ring: ${fingerState.Ring}  ` +
      `Pinky: ${fingerState.Pinky}  Gesture: ${gesture}`
    )
  }

  return gesture
}
