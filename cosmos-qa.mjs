// Cosmos pure-logic regression suite. Runs under plain Node (no DOM): verifies
// the stage cross-fade maths, the scale mapping used by the distance readout,
// the cinematic-ending state bridge, and the deterministic RNG. Browser/DOM
// behaviour (sequencing, overlap, re-entry) is covered by the puppeteer harness.
import { stageVisibility, STAGE_WINDOWS, mulberry32 } from './src/modules/deepverse/pages/Cosmos/scenes/helpers.js'
import { endingState, resetEndingState } from './src/modules/deepverse/pages/Cosmos/scenes/endingState.js'
import { progressToMeters, progressToLogScale, metersToLabel, STAGE_SCALES } from './src/modules/deepverse/pages/Cosmos/utils/scaleMapping.js'
import { lerp, clamp, smoothstep, fadeInOut } from './src/modules/deepverse/pages/Cosmos/utils/lerp.js'

let passed = 0, failed = 0
const fails = []
function ok(cond, name, detail) {
  if (cond) passed++
  else { failed++; fails.push(name + (detail ? ` — ${detail}` : '')) }
}
function near(a, b, eps = 1e-9) { return Math.abs(a - b) <= eps }

/* ------------------------------------------------------ stage crossfade */
for (const [name, w] of Object.entries(STAGE_WINDOWS)) {
  ok(w.length === 4, `window ${name} has 4 edges`)
  ok(w[0] < w[1] && w[1] <= w[2] && w[2] < w[3], `window ${name} edges are ordered`, String(w))
  const mid = (w[1] + w[2]) / 2
  ok(near(stageVisibility(mid, w), 1, 1e-6), `window ${name} fully visible mid-window`, String(stageVisibility(mid, w)))
  ok(stageVisibility(w[0] - 0.05, w) === 0, `window ${name} hidden before fade-in`)
  ok(stageVisibility(w[3] + 0.05, w) === 0, `window ${name} hidden after fade-out`)
}
// Windows must sweep the journey in order and cover it end to end.
const names = Object.keys(STAGE_WINDOWS)
const centres = names.map((n) => (STAGE_WINDOWS[n][1] + STAGE_WINDOWS[n][2]) / 2)
ok(centres.every((c, i) => i === 0 || c > centres[i - 1]), 'stage windows progress in order', centres.join(','))
ok(STAGE_WINDOWS.universe[2] >= 0.99, 'final stage reaches the end of the journey')
ok(STAGE_WINDOWS.human[0] < 0, 'first stage is already visible at progress 0')

/* --------------------------------------------------- scale mapping */
ok(near(progressToLogScale(0), -1) && near(progressToLogScale(1), 26), 'log scale spans -1..26')
ok(near(progressToMeters(0), 0.1) && near(progressToMeters(1), 1e26, 1e10), 'meters spans 0.1 m .. 1e26 m')
let monotone = true
for (let p = 0; p < 1; p += 0.02) if (progressToMeters(p + 0.02) <= progressToMeters(p)) monotone = false
ok(monotone, 'distance readout increases monotonically with progress')
ok(/m$/.test(metersToLabel(1.7)), 'human scale labels in metres', metersToLabel(1.7))
ok(/km$/.test(metersToLabel(STAGE_SCALES.earth)), 'earth scale labels in km', metersToLabel(STAGE_SCALES.earth))
ok(/ly$/.test(metersToLabel(STAGE_SCALES.milkyWay)), 'galaxy scale labels in light years', metersToLabel(STAGE_SCALES.milkyWay))
ok(metersToLabel(progressToMeters(1)) !== metersToLabel(progressToMeters(0)), 'readout changes across the journey')

/* ------------------------------------------------------- lerp utils */
ok(near(lerp(2, 10, 0), 2) && near(lerp(2, 10, 1), 10) && near(lerp(2, 10, 0.5), 6), 'lerp interpolates endpoints')
ok(near(smoothstep(0, 1, -1), 0) && near(smoothstep(0, 1, 2), 1) && near(smoothstep(0, 1, 0.5), 0.5), 'smoothstep clamps + eases')
ok(near(clamp(5, 0, 3), 3) && near(clamp(-5, 0, 3), 0), 'clamp bounds values')
ok(near(fadeInOut(0.5, 0.2, 0.4, 0.6, 0.8), 1), 'fadeInOut is 1 in the steady band')
ok(fadeInOut(0.1, 0.2, 0.4, 0.6, 0.8) === 0 && fadeInOut(0.9, 0.2, 0.4, 0.6, 0.8) === 0, 'fadeInOut is 0 outside the window')

/* --------------------------------------------------- ending state bridge */
resetEndingState()
ok(endingState.active === false && endingState.dim === 0, 'ending state starts inactive + undimmed')
endingState.active = true
endingState.dim = 0.9
resetEndingState()
ok(endingState.active === false && endingState.dim === 0, 'resetEndingState restores defaults')
ok(typeof endingState === 'object' && 'dim' in endingState, 'ending state is a stable shared object')

/* --------------------------------------------------------- RNG determinism */
const a = mulberry32(2024)
const b = mulberry32(2024)
let same = true, inRange = true
for (let i = 0; i < 100; i++) { const x = a(), y = b(); if (x !== y) same = false; if (!(x >= 0 && x < 1)) inRange = false }
ok(same, 'mulberry32 is deterministic for a fixed seed')
ok(inRange, 'mulberry32 values stay in [0,1)')
ok(mulberry32(1)() !== mulberry32(2)(), 'different seeds diverge')

console.log(`\ncosmos-qa: ${passed} passed, ${failed} failed`)
if (fails.length) console.log('FAILS:\n  ' + fails.join('\n  '))
process.exit(failed ? 1 : 0)
