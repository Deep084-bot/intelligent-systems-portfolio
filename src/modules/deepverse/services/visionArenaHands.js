import { HandLandmarker, FilesetResolver } from '@mediapipe/tasks-vision'

const WASM_URL = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
const MODEL_URL = 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/latest/hand_landmarker.task'

export async function createHandLandmarker() {
  const vision = await FilesetResolver.forVisionTasks(WASM_URL)
  return HandLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath: MODEL_URL,
      delegate: 'GPU',
    },
    runningMode: 'VIDEO',
    numHands: 1,
    minHandDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5,
  })
}

export function detectHand(handLandmarker, video, time) {
  try {
    const result = handLandmarker.detectForVideo(video, time)
    if (result.landmarks && result.landmarks.length > 0) {
      return result.landmarks[0]
    }
  } catch {
  }
  return null
}
