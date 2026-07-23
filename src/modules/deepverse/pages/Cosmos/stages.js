export const STAGES = [
  { id: 'invitation', start: 0, end: 0.03, label: null, fact: null,
    camera: { z: 3 } },
  { id: 'human', start: 0.02, end: 0.16,
    label: 'This is where your universe begins.', fact: null,
    camera: { z: 5 } },
  { id: 'room', start: 0.10, end: 0.24, label: 'A room.', fact: null,
    camera: { z: 7 } },
  { id: 'building', start: 0.20, end: 0.36, label: 'A building.', fact: null,
    camera: { z: 12 } },
  { id: 'city', start: 0.30, end: 0.46, label: 'A city.', fact: null,
    camera: { z: 20 } },
  { id: 'earth', start: 0.40, end: 0.56,
    label: 'Earth.',
    fact: 'It takes light 1.3 seconds to reach the Moon from here.',
    camera: { z: 32 } },
  { id: 'moon', start: 0.50, end: 0.66, label: 'The Moon.',
    fact: '384,400 kilometers. 1.3 light-seconds.',
    camera: { z: 48 } },
  { id: 'sun', start: 0.60, end: 0.76, label: 'The Sun.',
    fact: 'A million Earths could fit inside.',
    camera: { z: 70 } },
  { id: 'solarSystem', start: 0.70, end: 0.84,
    label: 'The Solar System.',
    fact: 'It takes sunlight 8 minutes to reach Earth.',
    camera: { z: 120 } },
  { id: 'milkyWay', start: 0.80, end: 0.88, label: 'The Milky Way.',
    fact: '100 billion stars. One of them was ours.',
    camera: { z: 200 } },
  { id: 'universe', start: 0.84, end: 1.00,
    label: 'The Observable Universe.',
    fact: 'Two trillion galaxies. And we have seen almost nothing.',
    camera: { z: 350 } },
]

export function getActiveStageIds(progress) {
  const overlap = 0.03
  const result = []
  for (let i = 0; i < STAGES.length; i++) {
    const s = STAGES[i]
    if (progress >= s.start - overlap && progress <= s.end + overlap) {
      result.push(i)
    }
  }
  return result
}

export function getStageBlend(stage, progress) {
  const fadeIn = stage.start
  const fadeInFull = stage.start + 0.03
  const fadeOutStart = stage.end - 0.03
  const fadeOut = stage.end

  if (progress <= fadeIn || progress >= fadeOut) return 0
  if (progress >= fadeInFull && progress <= fadeOutStart) return 1

  if (progress < fadeInFull) {
    const t = (progress - fadeIn) / (fadeInFull - fadeIn)
    return t * t * (3 - 2 * t)
  }
  const t = (fadeOut - progress) / (fadeOut - fadeOutStart)
  return t * t * (3 - 2 * t)
}
