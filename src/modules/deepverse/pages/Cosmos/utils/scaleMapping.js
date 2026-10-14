const MIN_LOG = -1
const MAX_LOG = 26
const LOG_RANGE = MAX_LOG - MIN_LOG

export function progressToLogScale(progress) {
  const clamped = Math.min(Math.max(progress, 0), 1)
  return MIN_LOG + clamped * LOG_RANGE
}

export function progressToMeters(progress) {
  const logScale = progressToLogScale(progress)
  return Math.pow(10, logScale)
}

export function metersToLabel(meters) {
  if (meters < 1e3) return `${meters.toFixed(1)} m`
  if (meters < 1e6) return `${(meters / 1e3).toFixed(1)} km`
  if (meters < 1e9) return `${(meters / 1e6).toFixed(1)} thousand km`
  if (meters < 1e12) return `${(meters / 1e9).toFixed(1)} million km`
  if (meters < 1e15) return `${(meters / 1e12).toFixed(1)} billion km`
  if (meters < 9.461e15) return `${(meters / 9.461e15).toFixed(1)} ly`
  return `${(meters / 9.461e20).toFixed(1)} Mly`
}

export const STAGE_SCALES = {
  invitation: 0.1,
  human: 1.7,
  room: 10,
  building: 100,
  city: 1e4,
  earth: 1.27e7,
  moon: 3.844e8,
  sun: 1.39e9,
  solarSystem: 4.5e12,
  milkyWay: 9.461e20,
  universe: 8.8e26,
}
