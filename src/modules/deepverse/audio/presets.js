// DeepVerse — procedural music presets.
//
// Pure data + pure helpers. No Web Audio, no DOM, no React. The MusicEngine
// turns each of these definitions into sound; nothing here schedules anything.
//
// Every preset is a genuinely different pattern (different root, tempo, scale,
// instrumentation and density), never a renamed copy of another. `semitone`
// offsets are relative to `root` in equal temperament.

export const PRESETS = [
  {
    id: 'cosmic-drift',
    name: 'Cosmic Drift',
    description: 'Slow, spacious ambient for drifting between the stars.',
    bpm: 44,
    steps: 32,
    root: 110.0, // A2
    trim: 0.85,
    pad: [
      { type: 'sine', semitone: 0, detune: -7, gain: 0.16, lfoRate: 0.05, lfoDepth: 140, filter: 900 },
      { type: 'sine', semitone: 7, detune: 6, gain: 0.12, lfoRate: 0.037, lfoDepth: 90, filter: 1200 },
      { type: 'triangle', semitone: 12, detune: 0, gain: 0.05, lfoRate: 0.021, lfoDepth: 60, filter: 2000 },
    ],
    events: [
      { step: 0, semitone: 0, dur: 3.2, type: 'sine', gain: 0.16, attack: 0.9, release: 2.4, filter: 1400 },
      { step: 8, semitone: 12, dur: 3.0, type: 'sine', gain: 0.13, attack: 0.7, release: 2.2, filter: 1900 },
      { step: 16, semitone: 7, dur: 3.4, type: 'sine', gain: 0.15, attack: 1.0, release: 2.6, filter: 1600 },
      { step: 24, semitone: 19, dur: 3.0, type: 'triangle', gain: 0.1, attack: 0.6, release: 2.2, filter: 2400 },
    ],
  },
  {
    id: 'greenhouse',
    name: 'Greenhouse',
    description: 'Warm, gentle plucks that feel like afternoon sunlight.',
    bpm: 68,
    steps: 16,
    root: 130.81, // C3
    trim: 0.8,
    pad: [
      { type: 'triangle', semitone: 0, detune: 0, gain: 0.05, lfoRate: 0.06, lfoDepth: 40, filter: 800 },
      { type: 'sine', semitone: 7, detune: 5, gain: 0.04, lfoRate: 0.04, lfoDepth: 30, filter: 1400 },
    ],
    events: [
      { step: 0, semitone: 0, dur: 1.2, type: 'triangle', gain: 0.22, filter: 2200 },
      { step: 2, semitone: 4, dur: 1.0, type: 'triangle', gain: 0.16, filter: 2200 },
      { step: 4, semitone: 7, dur: 1.4, type: 'triangle', gain: 0.2, filter: 2000 },
      { step: 6, semitone: 9, dur: 1.0, type: 'triangle', gain: 0.14, filter: 2400 },
      { step: 8, semitone: 12, dur: 1.6, type: 'triangle', gain: 0.2, filter: 2600 },
      { step: 10, semitone: 9, dur: 1.0, type: 'triangle', gain: 0.13, filter: 2400 },
      { step: 12, semitone: 7, dur: 1.3, type: 'triangle', gain: 0.17, filter: 2000 },
      { step: 14, semitone: 4, dur: 1.1, type: 'triangle', gain: 0.15, filter: 2200 },
    ],
  },
  {
    id: 'night-drive',
    name: 'Night Drive',
    description: 'A steady synth pulse for an empty road after dark.',
    bpm: 100,
    steps: 16,
    root: 82.41, // E2
    trim: 0.68,
    pad: [
      { type: 'sawtooth', semitone: 0, detune: -4, gain: 0.05, lfoRate: 0.08, lfoDepth: 120, filter: 600 },
    ],
    events: [
      { step: 0, semitone: 0, dur: 0.5, type: 'sawtooth', gain: 0.22, filter: 500 },
      { step: 4, semitone: 0, dur: 0.5, type: 'sawtooth', gain: 0.22, filter: 500 },
      { step: 8, semitone: 0, dur: 0.5, type: 'sawtooth', gain: 0.22, filter: 500 },
      { step: 12, semitone: 0, dur: 0.5, type: 'sawtooth', gain: 0.22, filter: 500 },
      { step: 2, semitone: 12, dur: 0.28, type: 'triangle', gain: 0.1, filter: 1600 },
      { step: 6, semitone: 19, dur: 0.28, type: 'triangle', gain: 0.1, filter: 1600 },
      { step: 10, semitone: 15, dur: 0.28, type: 'triangle', gain: 0.1, filter: 1600 },
      { step: 14, semitone: 12, dur: 0.28, type: 'triangle', gain: 0.1, filter: 1600 },
    ],
  },
  {
    id: 'focus-mode',
    name: 'Focus Mode',
    description: 'Restrained and quiet, made to think alongside.',
    bpm: 52,
    steps: 32,
    root: 146.83, // D3
    trim: 0.7,
    pad: [
      { type: 'sine', semitone: 0, detune: 0, gain: 0.09, lfoRate: 0.03, lfoDepth: 50, filter: 1000 },
      { type: 'sine', semitone: 12, detune: 3, gain: 0.05, lfoRate: 0.02, lfoDepth: 30, filter: 1600 },
    ],
    events: [
      { step: 0, semitone: 0, dur: 3.0, type: 'sine', gain: 0.1, attack: 1.2, release: 2.4, filter: 1400 },
      { step: 16, semitone: 7, dur: 3.0, type: 'sine', gain: 0.09, attack: 1.2, release: 2.4, filter: 1400 },
    ],
  },
]

export const PRESET_IDS = PRESETS.map((p) => p.id)

export function getPreset(id) {
  if (typeof id !== 'string') return null
  return PRESETS.find((p) => p.id === id) || null
}

export function isPresetId(id) {
  return getPreset(id) !== null
}

export function presetIndex(id) {
  return PRESETS.findIndex((p) => p.id === id)
}

export function nextPresetId(id) {
  const i = presetIndex(id)
  if (i < 0) return PRESETS[0].id
  return PRESETS[(i + 1) % PRESETS.length].id
}

export function presetList() {
  return PRESETS.map(({ id, name, description }) => ({ id, name, description }))
}

// Equal-tempered frequency for a semitone offset from the preset root.
export function noteFrequency(root, semitone) {
  return root * Math.pow(2, semitone / 12)
}
