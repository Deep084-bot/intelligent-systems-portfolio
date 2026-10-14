// DeepVerse — procedural music presets.
//
// Pure data + pure helpers. No Web Audio, no DOM, no React. The MusicEngine
// turns each of these definitions into sound; nothing here schedules anything.
//
// Each preset is a real musical idea, not a renamed copy of another:
//   - a key/scale and a four-chord progression,
//   - a distinct register, tempo, instrumentation and rhythmic density,
//   - its own mix trim.
// All `semitone` / `notes` values are offsets from `root` in equal temperament.
//
// Event shape (all optional except the note selector):
//   step     index into the loop (0..steps-1)
//   notes    array of semitone offsets (a chord); `semitone` is the single-note form
//   type     oscillator type: 'sine' | 'triangle' | 'sawtooth' | 'square'
//   gain     peak gain of the event (pre-master)
//   attack   seconds to reach peak (slow = pad-like, fast = pluck)
//   dur      seconds held at peak
//   release  seconds to fade to silence after `dur`
//   filter   lowpass cutoff (Hz) — keeps highs soft
//   strum    seconds between chord tones (small = gentle strum)
//   pan      -1..1 stereo placement (spaciousness); ignored where unsupported
//
// Pad layer shape: { type, notes|semitone, detune, gain, filter, lfoRate, lfoDepth }

export const PRESETS = [
  // -------------------------------------------------------------------------
  // Cosmic Drift — A aeolian (natural minor), very slow celestial ambient.
  // Progression i–VI–III–VII (Am – F – C – G). Chords bloom with long attack
  // and release so they overlap into an evolving wash. Sparse high bells drift
  // across the stereo field. No percussion, no transients.
  // -------------------------------------------------------------------------
  {
    id: 'cosmic-drift',
    name: 'Cosmic Drift',
    description: 'Slow, celestial ambient with soft evolving harmonies.',
    bpm: 40,
    steps: 32,
    root: 110.0, // A2
    trim: 0.9,
    pad: [
      { type: 'sine', notes: [0, 7], detune: -6, gain: 0.06, filter: 800, lfoRate: 0.031, lfoDepth: 60 },
      { type: 'sine', notes: [12], detune: 5, gain: 0.028, filter: 1600, lfoRate: 0.019, lfoDepth: 30 },
    ],
    events: [
      { step: 0, notes: [0, 3, 7], gain: 0.05, attack: 2.8, dur: 3.2, release: 5.5, type: 'sine', filter: 1100 },
      { step: 8, notes: [8, 12, 15], gain: 0.045, attack: 2.8, dur: 3.2, release: 5.5, type: 'sine', filter: 1200 },
      { step: 16, notes: [3, 7, 10], gain: 0.05, attack: 2.8, dur: 3.2, release: 5.5, type: 'sine', filter: 1100 },
      { step: 24, notes: [10, 14, 17], gain: 0.045, attack: 2.8, dur: 3.2, release: 5.5, type: 'sine', filter: 1200 },
      { step: 4, semitone: 24, gain: 0.03, attack: 0.5, dur: 0.2, release: 6.0, type: 'sine', filter: 2800, pan: -0.35 },
      { step: 20, semitone: 19, gain: 0.03, attack: 0.5, dur: 0.2, release: 6.0, type: 'sine', filter: 2800, pan: 0.35 },
    ],
  },

  // -------------------------------------------------------------------------
  // Greenhouse — C major, warm and organic. Progression I–vi–IV–V
  // (C – Am – F – G). Triangle "wooden" plucks carry a gentle, natural rhythm
  // with a small strum; a soft bass note and a warm chord pad sit underneath.
  // -------------------------------------------------------------------------
  {
    id: 'greenhouse',
    name: 'Greenhouse',
    description: 'Warm, organic plucks in a relaxed, sunlit rhythm.',
    bpm: 76,
    steps: 32,
    root: 130.81, // C3
    trim: 0.85,
    pad: [
      { type: 'triangle', notes: [0, 7], detune: 0, gain: 0.038, filter: 750, lfoRate: 0.057, lfoDepth: 35 },
      { type: 'sine', notes: [12], detune: 4, gain: 0.022, filter: 1500, lfoRate: 0.041, lfoDepth: 24 },
    ],
    events: [
      // warm chord pad strikes, one per chord
      { step: 0, notes: [0, 4, 7], gain: 0.045, attack: 0.6, dur: 1.4, release: 2.6, type: 'triangle', filter: 1600, strum: 0.03 },
      { step: 8, notes: [9, 12, 16], gain: 0.045, attack: 0.6, dur: 1.4, release: 2.6, type: 'triangle', filter: 1600, strum: 0.03 },
      { step: 16, notes: [5, 9, 12], gain: 0.045, attack: 0.6, dur: 1.4, release: 2.6, type: 'triangle', filter: 1600, strum: 0.03 },
      { step: 24, notes: [7, 11, 14], gain: 0.045, attack: 0.6, dur: 1.4, release: 2.6, type: 'triangle', filter: 1600, strum: 0.03 },
      // soft bass on each chord root
      { step: 0, semitone: 0, gain: 0.13, attack: 0.02, dur: 1.2, release: 1.2, type: 'triangle', filter: 700 },
      { step: 8, semitone: 9, gain: 0.13, attack: 0.02, dur: 1.2, release: 1.2, type: 'triangle', filter: 700 },
      { step: 16, semitone: 5, gain: 0.13, attack: 0.02, dur: 1.2, release: 1.2, type: 'triangle', filter: 700 },
      { step: 24, semitone: 7, gain: 0.13, attack: 0.02, dur: 1.2, release: 1.2, type: 'triangle', filter: 700 },
      // gentle pentatonic melody (C D E G A ...), leaving space between phrases
      { step: 2, semitone: 12, gain: 0.09, attack: 0.01, dur: 0.7, release: 1.3, type: 'triangle', filter: 2600 },
      { step: 5, semitone: 16, gain: 0.08, attack: 0.01, dur: 0.7, release: 1.3, type: 'triangle', filter: 2600 },
      { step: 6, semitone: 14, gain: 0.075, attack: 0.01, dur: 0.6, release: 1.2, type: 'triangle', filter: 2600 },
      { step: 10, semitone: 19, gain: 0.08, attack: 0.01, dur: 0.7, release: 1.3, type: 'triangle', filter: 2600 },
      { step: 13, semitone: 16, gain: 0.075, attack: 0.01, dur: 0.6, release: 1.2, type: 'triangle', filter: 2600 },
      { step: 14, semitone: 12, gain: 0.08, attack: 0.01, dur: 0.7, release: 1.3, type: 'triangle', filter: 2600 },
      { step: 18, semitone: 17, gain: 0.08, attack: 0.01, dur: 0.7, release: 1.3, type: 'triangle', filter: 2600 },
      { step: 21, semitone: 21, gain: 0.075, attack: 0.01, dur: 0.6, release: 1.2, type: 'triangle', filter: 2600 },
      { step: 23, semitone: 16, gain: 0.075, attack: 0.01, dur: 0.6, release: 1.2, type: 'triangle', filter: 2600 },
      { step: 26, semitone: 19, gain: 0.08, attack: 0.01, dur: 0.7, release: 1.3, type: 'triangle', filter: 2600 },
      { step: 29, semitone: 23, gain: 0.07, attack: 0.01, dur: 0.6, release: 1.2, type: 'triangle', filter: 2600 },
      { step: 31, semitone: 19, gain: 0.07, attack: 0.01, dur: 0.6, release: 1.2, type: 'triangle', filter: 2600 },
    ],
  },

  // -------------------------------------------------------------------------
  // Night Drive — E minor, rhythmic and atmospheric. Four bars of
  // i–VI–III–VII (Em – C – G – D). A restrained lowpassed saw bassline anchors
  // each bar, a triangle arpeggio pulses on the offbeats, and a soft chord
  // stab opens every bar. Deliberately avoids bright or harsh highs.
  // -------------------------------------------------------------------------
  {
    id: 'night-drive',
    name: 'Night Drive',
    description: 'A rhythmic, atmospheric electronic pulse.',
    bpm: 104,
    steps: 64,
    root: 82.41, // E2
    trim: 0.75,
    pad: [
      { type: 'sawtooth', notes: [0], detune: -4, gain: 0.045, filter: 480, lfoRate: 0.06, lfoDepth: 80 },
    ],
    events: [
      // chord stab + bassline movement + offbeat arpeggio, per bar
      { step: 0, notes: [0, 3, 7], gain: 0.05, attack: 0.4, dur: 1.2, release: 2.4, type: 'triangle', filter: 1400, strum: 0.02 },
      { step: 0, semitone: 0, gain: 0.15, attack: 0.01, dur: 0.28, release: 0.16, type: 'sawtooth', filter: 380 },
      { step: 4, semitone: 0, gain: 0.15, attack: 0.01, dur: 0.28, release: 0.16, type: 'sawtooth', filter: 380 },
      { step: 8, semitone: 7, gain: 0.13, attack: 0.01, dur: 0.28, release: 0.16, type: 'sawtooth', filter: 380 },
      { step: 12, semitone: 0, gain: 0.15, attack: 0.01, dur: 0.28, release: 0.16, type: 'sawtooth', filter: 380 },

      { step: 16, notes: [8, 12, 15], gain: 0.05, attack: 0.4, dur: 1.2, release: 2.4, type: 'triangle', filter: 1400, strum: 0.02 },
      { step: 16, semitone: 8, gain: 0.15, attack: 0.01, dur: 0.28, release: 0.16, type: 'sawtooth', filter: 380 },
      { step: 20, semitone: 8, gain: 0.15, attack: 0.01, dur: 0.28, release: 0.16, type: 'sawtooth', filter: 380 },
      { step: 24, semitone: 15, gain: 0.13, attack: 0.01, dur: 0.28, release: 0.16, type: 'sawtooth', filter: 380 },
      { step: 28, semitone: 8, gain: 0.15, attack: 0.01, dur: 0.28, release: 0.16, type: 'sawtooth', filter: 380 },

      { step: 32, notes: [3, 7, 10], gain: 0.05, attack: 0.4, dur: 1.2, release: 2.4, type: 'triangle', filter: 1400, strum: 0.02 },
      { step: 32, semitone: 3, gain: 0.15, attack: 0.01, dur: 0.28, release: 0.16, type: 'sawtooth', filter: 380 },
      { step: 36, semitone: 3, gain: 0.15, attack: 0.01, dur: 0.28, release: 0.16, type: 'sawtooth', filter: 380 },
      { step: 40, semitone: 10, gain: 0.13, attack: 0.01, dur: 0.28, release: 0.16, type: 'sawtooth', filter: 380 },
      { step: 44, semitone: 3, gain: 0.15, attack: 0.01, dur: 0.28, release: 0.16, type: 'sawtooth', filter: 380 },

      { step: 48, notes: [10, 14, 17], gain: 0.05, attack: 0.4, dur: 1.2, release: 2.4, type: 'triangle', filter: 1400, strum: 0.02 },
      { step: 48, semitone: 10, gain: 0.15, attack: 0.01, dur: 0.28, release: 0.16, type: 'sawtooth', filter: 380 },
      { step: 52, semitone: 10, gain: 0.15, attack: 0.01, dur: 0.28, release: 0.16, type: 'sawtooth', filter: 380 },
      { step: 56, semitone: 17, gain: 0.13, attack: 0.01, dur: 0.28, release: 0.16, type: 'sawtooth', filter: 380 },
      { step: 60, semitone: 10, gain: 0.15, attack: 0.01, dur: 0.28, release: 0.16, type: 'sawtooth', filter: 380 },

      // offbeat arpeggio, cycling the current chord's tones an octave up
      { step: 1, semitone: 12, gain: 0.05, dur: 0.2, release: 0.18, type: 'triangle', filter: 1500 },
      { step: 3, semitone: 15, gain: 0.05, dur: 0.2, release: 0.18, type: 'triangle', filter: 1500 },
      { step: 5, semitone: 19, gain: 0.05, dur: 0.2, release: 0.18, type: 'triangle', filter: 1500 },
      { step: 7, semitone: 15, gain: 0.05, dur: 0.2, release: 0.18, type: 'triangle', filter: 1500 },
      { step: 9, semitone: 12, gain: 0.05, dur: 0.2, release: 0.18, type: 'triangle', filter: 1500 },
      { step: 11, semitone: 19, gain: 0.05, dur: 0.2, release: 0.18, type: 'triangle', filter: 1500 },
      { step: 13, semitone: 15, gain: 0.05, dur: 0.2, release: 0.18, type: 'triangle', filter: 1500 },
      { step: 15, semitone: 12, gain: 0.05, dur: 0.2, release: 0.18, type: 'triangle', filter: 1500 },

      { step: 17, semitone: 20, gain: 0.05, dur: 0.2, release: 0.18, type: 'triangle', filter: 1500 },
      { step: 19, semitone: 24, gain: 0.05, dur: 0.2, release: 0.18, type: 'triangle', filter: 1500 },
      { step: 21, semitone: 27, gain: 0.05, dur: 0.2, release: 0.18, type: 'triangle', filter: 1500 },
      { step: 23, semitone: 24, gain: 0.05, dur: 0.2, release: 0.18, type: 'triangle', filter: 1500 },
      { step: 25, semitone: 20, gain: 0.05, dur: 0.2, release: 0.18, type: 'triangle', filter: 1500 },
      { step: 27, semitone: 27, gain: 0.05, dur: 0.2, release: 0.18, type: 'triangle', filter: 1500 },
      { step: 29, semitone: 24, gain: 0.05, dur: 0.2, release: 0.18, type: 'triangle', filter: 1500 },
      { step: 31, semitone: 20, gain: 0.05, dur: 0.2, release: 0.18, type: 'triangle', filter: 1500 },

      { step: 33, semitone: 15, gain: 0.05, dur: 0.2, release: 0.18, type: 'triangle', filter: 1500 },
      { step: 35, semitone: 19, gain: 0.05, dur: 0.2, release: 0.18, type: 'triangle', filter: 1500 },
      { step: 37, semitone: 22, gain: 0.05, dur: 0.2, release: 0.18, type: 'triangle', filter: 1500 },
      { step: 39, semitone: 19, gain: 0.05, dur: 0.2, release: 0.18, type: 'triangle', filter: 1500 },
      { step: 41, semitone: 15, gain: 0.05, dur: 0.2, release: 0.18, type: 'triangle', filter: 1500 },
      { step: 43, semitone: 22, gain: 0.05, dur: 0.2, release: 0.18, type: 'triangle', filter: 1500 },
      { step: 45, semitone: 19, gain: 0.05, dur: 0.2, release: 0.18, type: 'triangle', filter: 1500 },
      { step: 47, semitone: 15, gain: 0.05, dur: 0.2, release: 0.18, type: 'triangle', filter: 1500 },

      { step: 49, semitone: 22, gain: 0.05, dur: 0.2, release: 0.18, type: 'triangle', filter: 1500 },
      { step: 51, semitone: 26, gain: 0.05, dur: 0.2, release: 0.18, type: 'triangle', filter: 1500 },
      { step: 53, semitone: 29, gain: 0.05, dur: 0.2, release: 0.18, type: 'triangle', filter: 1500 },
      { step: 55, semitone: 26, gain: 0.05, dur: 0.2, release: 0.18, type: 'triangle', filter: 1500 },
      { step: 57, semitone: 22, gain: 0.05, dur: 0.2, release: 0.18, type: 'triangle', filter: 1500 },
      { step: 59, semitone: 29, gain: 0.05, dur: 0.2, release: 0.18, type: 'triangle', filter: 1500 },
      { step: 61, semitone: 26, gain: 0.05, dur: 0.2, release: 0.18, type: 'triangle', filter: 1500 },
      { step: 63, semitone: 22, gain: 0.05, dur: 0.2, release: 0.18, type: 'triangle', filter: 1500 },
    ],
  },

  // -------------------------------------------------------------------------
  // Focus Mode — D major, deliberately minimal. A low D/A drone and a steady,
  // even sine pulse alternating D and A. No progression and no variation, by
  // design: the point is an unobtrusive, consistent bed with no bright highs.
  // -------------------------------------------------------------------------
  {
    id: 'focus-mode',
    name: 'Focus Mode',
    description: 'Steady and unobtrusive, made to think alongside.',
    bpm: 48,
    steps: 32,
    root: 146.83, // D3
    trim: 0.65,
    pad: [
      { type: 'sine', notes: [0, 7], detune: 0, gain: 0.07, filter: 800, lfoRate: 0.025, lfoDepth: 40 },
      { type: 'sine', notes: [12], detune: 3, gain: 0.025, filter: 1500, lfoRate: 0.017, lfoDepth: 20 },
    ],
    events: [
      { step: 0, semitone: 0, gain: 0.06, attack: 0.7, dur: 1.4, release: 2.8, type: 'sine', filter: 1000 },
      { step: 8, semitone: 7, gain: 0.055, attack: 0.7, dur: 1.4, release: 2.8, type: 'sine', filter: 1000 },
      { step: 16, semitone: 0, gain: 0.06, attack: 0.7, dur: 1.4, release: 2.8, type: 'sine', filter: 1000 },
      { step: 24, semitone: 7, gain: 0.055, attack: 0.7, dur: 1.4, release: 2.8, type: 'sine', filter: 1000 },
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
