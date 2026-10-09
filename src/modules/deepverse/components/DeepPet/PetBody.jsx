import { useId } from 'react'
import { getProfile } from './petState'

// DeepPet — the companion itself.
// A floating cream robot: stepped silhouette, dark visor, green optics, a knotted
// scarf with a glowing core, and a stair-stepped energy tail. Geometry is built
// from chunky axis-aligned primitives so it reads as pixel art at 90–460px.
// Every state is the same primitives re-posed, never separate illustrations.
//
// Expression is carried by several cues at once, because at the small floating
// size a one-unit nudge is invisible: the optic SHAPE CATEGORY (round / tall /
// arc / wide / squint / shut), whether the pair is symmetric or lopsided, a
// carve that reshapes the visor aperture, a mouth, and head + body tilt.
//
// The silhouette is drawn as crisp stepped paths; depth is then layered on with
// a handful of restrained SVG gradients (skin volume, visor glass, core glow).
// Because it is all vector, the same definition is sharp at every presentation
// size — the 72px portal preview and the large world centrepiece share exact
// proportions and never need a separate "big" illustration.

const C = {
  creamHi: '#fdf3d0',
  cream: '#f2dfae',
  creamMid: '#e3c78a',
  creamLo: '#c2a165',
  creamEdge: '#8f7340',
  visor: '#1a2330',
  visorHi: '#2c3a49',
  visorLo: '#0d131b',
  green: '#5fe08a',
  greenHi: '#a9f7c4',
  greenMid: '#2fae63',
  greenLo: '#15583a',
  orange: '#e8913c',
  orangeHi: '#ffc27a',
  white: '#fffbe8',
}

// Stepped silhouettes — corners stair-step instead of curving.
const HEAD_OUTER =
  'M30 12H70V15H74V21H76V43H74V49H70V52H30V49H26V43H24V21H26V15H30Z'
const HEAD_FACE = 'M33 15H67V18H71V23H73V41H71V47H67V50H33V47H29V41H27V23H29V18H33Z'
const VISOR_OUT = 'M36 20H64V23H68V28H70V34H68V39H64V42H36V39H32V34H30V28H32V23H36Z'
const VISOR_IN = 'M38 23H62V26H66V30H67V34H65V38H61V40H39V38H35V34H34V30H36V26H38Z'
const SCARF = 'M32 42H64V45H68V50H64V53H32V50H28V45H32Z'
const TORSO = 'M43 51H55V54H58V60H60V66H57V71H53V74H43V71H39V66H37V60H39V54H43Z'
const ORB_OUT = 'M43.5 1H50.5V3.5H52V8H50.5V10.5H43.5V8H42V3.5H43.5Z'
const ORB_IN = 'M44.5 2.5H49.5V4.5H50.5V7H49.5V9H44.5V7H43.5V4.5H44.5Z'

// Tail: a tapering staircase off the shoulder, bright streak inset one step.
const TAIL = [
  { x: 38.5, y: 51, w: 7.5, h: 6 },
  { x: 35, y: 56, w: 7, h: 6 },
  { x: 31.5, y: 61, w: 7, h: 6 },
  { x: 28, y: 66, w: 7, h: 6 },
  { x: 24.5, y: 71, w: 6.5, h: 6 },
  { x: 21, y: 76, w: 6, h: 6 },
  { x: 17.5, y: 80, w: 6.5, h: 5.5 },
]
const TAIL_CORE = TAIL.map((s) => ({ x: s.x + 1.4, y: s.y + 1.4, w: s.w - 3, h: s.h - 3 }))

// Hover pods under the torso.
const PODS = [
  { x: 41, y: 72 },
  { x: 48.5, y: 72 },
]

// Orbiting motes: green / orange / cream, reverse on alternating entries.
const MOTES = [
  { angle: 24, radius: 41, dur: 1, size: 3.2, color: C.greenHi },
  { angle: 138, radius: 38, dur: -1.5, size: 2.6, color: C.orange },
  { angle: 250, radius: 43, dur: 2.2, size: 2.2, color: C.green },
  { angle: 330, radius: 39, dur: -0.9, size: 3, color: C.cream },
]

// Extra "sparking" motes, indexed by how energetic the state is.
const SPARKS = [
  [],
  [
    { x: 79, y: 30, s: 2.4, c: C.greenHi },
    { x: 17, y: 62, s: 2, c: C.green },
  ],
  [
    { x: 81, y: 25, s: 2.8, c: C.greenHi },
    { x: 14, y: 57, s: 2.2, c: C.green },
    { x: 75, y: 63, s: 2, c: C.orangeHi },
  ],
  [
    { x: 84, y: 21, s: 3.2, c: C.greenHi },
    { x: 11, y: 53, s: 2.6, c: C.green },
    { x: 79, y: 58, s: 2.4, c: C.orangeHi },
    { x: 24, y: 76, s: 2.2, c: C.white },
  ],
]

// ---------- expression geometry ----------
// Rect lists in viewBox units, laid out inside the visor aperture (inner opening
// x 34..67, y 23..40). Six deliberately different silhouettes.

const OPTICS = {
  // idle — two calm, symmetric rounded blocks
  round: {
    body: [[39, 27, 8, 8], [53, 27, 8, 8]],
    hi: [[40, 28, 2.6, 2.6], [54, 28, 2.6, 2.6]],
  },
  // curious — tall wide-open left eye against a small right one
  ask: {
    body: [[41, 24, 4, 3], [39, 27, 8, 5], [40, 32, 6, 3], [41.5, 35, 3, 2], [55, 29, 5, 5]],
    hi: [[42, 25.4, 2.2, 2.2], [56, 30, 2, 2]],
  },
  // happy — closed upward arcs, stepped
  arc: {
    body: [
      [37, 32, 3, 3], [39.5, 29.5, 3, 3], [42, 28, 3, 3], [44.5, 29.5, 3, 3], [47, 32, 3, 3],
      [51, 32, 3, 3], [53.5, 29.5, 3, 3], [56, 28, 3, 3], [58.5, 29.5, 3, 3], [61, 32, 3, 3],
    ],
    hi: [],
  },
  // excited — big wide-open eyes with bright cores and sparkle ticks
  wide: {
    body: [[39, 24, 9, 11], [53, 24, 9, 11]],
    hi: [[41, 27, 5, 5], [55, 27, 5, 5]],
    extra: [[35.5, 22, 2, 2], [65.5, 22, 2, 2], [35.5, 35, 2, 2], [65.5, 35, 2, 2]],
  },
  // confused — shut left eye against a tall open right one (mirrors `ask`)
  squint: {
    body: [[38.5, 30.5, 9, 4], [55, 24.5, 5, 3], [53.5, 27.5, 7, 6], [54, 33.5, 6, 3]],
    hi: [[39.5, 31, 2.4, 2.4], [56, 26, 2.2, 2.2]],
  },
  // sleepy — closed lids drooping away from the centre
  shut: {
    body: [[38, 32.6, 9, 3.4], [36.3, 34.4, 2.8, 1.8], [53, 32.6, 9, 3.4], [61.5, 34.4, 2.8, 1.8]],
    hi: [[38, 32.6, 9, 1], [53, 32.6, 9, 1]],
  },
}

// Aperture carves, painted in the frame colour so they read as reshaping the
// visor rather than adding paint to it. Drawn before the optics.
const CARVES = {
  none: [],
  // curious — bites the upper-left corner: a raised brow over the tall eye
  browL: [[33.5, 22.5, 7, 4], [35, 26.5, 4.5, 3]],
  // happy — drops the lower band so the smile has somewhere to sit
  smileLid: [[36, 37, 28, 1.8]],
  // excited — thins the frame top and bottom, opening the aperture up
  thinFrame: [[33, 21.5, 34, 2.6], [33, 37.4, 34, 2.6]],
  // confused — slanted brow falling inward over the open eye
  slantR: [[52, 22.5, 10, 2.2], [54, 24.7, 8, 1.8], [56, 26.5, 6, 1.6]],
  // sleepy — heavy upper lids, so the opening reads short and drowsy
  heavyLid: [[33, 21.5, 34, 4], [33, 25.5, 3.5, 3], [63.5, 25.5, 3.5, 3]],
}

// Mouths sit in the lower aperture, below every optic shape above.
const MOUTHS = {
  none: [],
  flat: [[47, 36.4, 6, 1.8]],
  o: [[46.5, 35.4, 5, 4]],
  smile: [[44.5, 36, 3, 2.5], [47.5, 38, 5, 2.5], [52.5, 36, 3, 2.5]],
  grin: [[43, 36, 14, 2.5], [45, 38.5, 10, 1.5]],
  wavy: [[45.5, 36, 2.5, 2.5], [48, 37.5, 2.5, 2.5], [50.5, 36, 2.5, 2.5], [53, 37.5, 2.5, 2.5]],
}

// Orange question mark beside the head.
const QUESTION = [
  [68.5, 23, 2.2, 2.2], [70.7, 23, 2.2, 2.2], [70.7, 25.2, 2.2, 2.2],
  [69.4, 27.4, 2.2, 2.2], [68.5, 30, 2.2, 2.2],
]

// Three z's climbing to the upper right, largest first.
const ZZZ = [
  [[63, 29, 7, 2.2], [67.8, 29, 2.2, 4.4], [63, 31.2, 7, 2.2]],
  [[69, 24, 5, 1.8], [72.2, 24, 1.8, 3.6], [69, 25.8, 5, 1.8]],
  [[73.5, 20, 3.4, 1.4], [75.4, 20, 1.4, 2.8], [73.5, 21.4, 3.4, 1.4]],
]

// Antenna orb treatment per state.
const ORBS = {
  calm: { shell: C.greenLo, core: C.green, hot: C.greenHi, hotSize: 2.8, ring: false },
  bright: { shell: C.greenLo, core: C.green, hot: C.white, hotSize: 3.4, ring: true },
  dim: { shell: C.greenLo, core: C.greenMid, hot: C.greenMid, hotSize: 2.2, ring: false },
}

// Six looks over the same primitives. `head`/`body` are degrees of tilt,
// `scarf` is [drop, skew] for the accent bands, `tail` is the sway amplitude
// written to CSS.
const LOOKS = {
  idle: { eyes: 'round', carve: 'none', mouth: 'flat', glyph: null, orb: 'calm',
    head: 0, body: 0, rise: 0, lean: 0, tail: 3, spark: 0, eyeGlow: 1, scarf: [0, 0] },
  curious: { eyes: 'ask', carve: 'browL', mouth: 'o', glyph: null, orb: 'calm',
    head: -8, body: -2, rise: -0.5, lean: -2, tail: 5, spark: 1, eyeGlow: 1.1, scarf: [-0.5, -1.5] },
  happy: { eyes: 'arc', carve: 'smileLid', mouth: 'smile', glyph: null, orb: 'calm',
    head: 0, body: 0, rise: -2, lean: 0.5, tail: 6, spark: 2, eyeGlow: 1.15, scarf: [-0.8, 0] },
  excited: { eyes: 'wide', carve: 'thinFrame', mouth: 'grin', glyph: null, orb: 'bright',
    head: 0, body: 0, rise: -3.5, lean: 0, tail: 9, spark: 3, eyeGlow: 1.45, scarf: [-1.2, 0] },
  confused: { eyes: 'squint', carve: 'slantR', mouth: 'wavy', glyph: 'q', orb: 'calm',
    head: 9, body: 3, rise: 1, lean: 2.5, tail: -7, spark: 1, eyeGlow: 1.05, scarf: [0.4, 1.5] },
  sleepy: { eyes: 'shut', carve: 'heavyLid', mouth: 'none', glyph: 'z', orb: 'dim',
    head: 3.5, body: 3, rise: 3.5, lean: 1, tail: -2, spark: 0, eyeGlow: 0.85, scarf: [1.6, 0.5] },
}

function Rects({ list, fill, opacity }) {
  return list.map(([x, y, w, h], i) => (
    <rect key={i} x={x} y={y} width={w} height={h} fill={fill} opacity={opacity} />
  ))
}

// Optic expression: eye shape + carve + mouth + glyph, all inside the visor.
// Deliberately NOT clipped to the visor: the carves paint the frame colour to
// reshape the aperture (they must reach the frame edge) and the '?' / 'z'
// glyphs sit beside and above the head, outside the visor entirely.
function Optic({ look }) {
  const shape = OPTICS[look.eyes]
  const carve = CARVES[look.carve]
  const mouth = MOUTHS[look.mouth]

  return (
    <g>
      <g fill={C.visorLo}>
        <Rects list={carve} fill={C.visorLo} />
      </g>
      <g fill={C.green}>
        <Rects list={shape.body} fill={C.green} />
      </g>
      {shape.hi.length > 0 && (
        <g fill={look.eyes === 'wide' ? C.white : C.greenHi}>
          <Rects list={shape.hi} fill={look.eyes === 'wide' ? C.white : C.greenHi} />
        </g>
      )}
      {shape.extra && (
        <g fill={C.greenHi}>
          <Rects list={shape.extra} fill={C.greenHi} />
        </g>
      )}
      {mouth.length > 0 && (
        <g fill={C.green}>
          <Rects list={mouth} fill={C.green} />
        </g>
      )}
      {look.glyph === 'q' && (
        <g fill={C.orangeHi}>
          <Rects list={QUESTION} fill={C.orangeHi} />
        </g>
      )}
      {look.glyph === 'z' && (
        <g fill={C.green}>
          {ZZZ.map((z, i) => (
            <Rects key={i} list={z} fill={i === 0 ? C.green : C.greenMid} opacity={0.88 - i * 0.16} />
          ))}
        </g>
      )}
    </g>
  )
}

export default function PetBody({ state }) {
  const p = getProfile(state)
  const look = LOOKS[state] || LOOKS.idle
  const sparks = SPARKS[Math.min(look.spark, SPARKS.length - 1)]
  const orb = ORBS[look.orb]
  const [drop, skew] = look.scarf

  // Unique gradient/clip ids so several pets can coexist on one page (portal
  // preview + floating companion) without their <defs> colliding.
  const uid = useId().replace(/:/g, '')
  const id = (name) => `${uid}-${name}`

  const style = {
    '--pet-float-dur': `${p.floatDur}s`,
    '--pet-float-amp': `${p.floatAmp}px`,
    '--pet-glow': p.glow,
    '--pet-orbit-dur': `${p.orbitDur}s`,
    '--pet-tilt': `${p.tilt}deg`,
    '--pet-core-dur': `${p.corePulse}s`,
    '--pet-core': Math.min(1, 0.72 + p.glow * 0.28),
    '--pet-tail-dur': `${Math.max(1.6, p.corePulse * 0.92)}s`,
    '--pet-tail-amp': `${look.tail}deg`,
    // chosen as a variable, not an inline animation-name, so the reduced-motion
    // `animation: none` rule can still win
    '--pet-tail-anim': look.tail < 0 ? 'petTailSwayRev' : 'petTailSway',
    '--pet-eye': look.eyeGlow,
    '--pet-spark': look.spark > 0 ? 1 : 0,
  }

  return (
    <>
      <div className="deeppet-glow" style={style} />

      <div className="deeppet-float" style={style}>
        <svg
          viewBox="0 0 100 100"
          width="100%"
          height="100%"
          aria-hidden="true"
          focusable="false"
        >
          <defs>
            <linearGradient id={id('skin')} x1="0.15" y1="0" x2="0.85" y2="1">
              <stop offset="0%" stopColor={C.creamHi} />
              <stop offset="42%" stopColor={C.cream} />
              <stop offset="100%" stopColor={C.creamMid} />
            </linearGradient>
            <linearGradient id={id('torso')} x1="0.2" y1="0" x2="0.8" y2="1">
              <stop offset="0%" stopColor={C.cream} />
              <stop offset="100%" stopColor={C.creamMid} />
            </linearGradient>
            <linearGradient id={id('visor')} x1="0" y1="0" x2="0.25" y2="1">
              <stop offset="0%" stopColor={C.visorHi} />
              <stop offset="55%" stopColor={C.visor} />
              <stop offset="100%" stopColor={C.visorLo} />
            </linearGradient>
            <linearGradient id={id('scarf')} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={C.greenMid} />
              <stop offset="100%" stopColor={C.greenLo} />
            </linearGradient>
            <radialGradient id={id('eyeglow')} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="rgba(95,224,138,0.32)" />
              <stop offset="100%" stopColor="rgba(95,224,138,0)" />
            </radialGradient>
            <radialGradient id={id('orb')} cx="38%" cy="32%" r="70%">
              <stop offset="0%" stopColor={C.greenHi} />
              <stop offset="58%" stopColor={C.green} />
              <stop offset="100%" stopColor={C.greenLo} />
            </radialGradient>
            <clipPath id={id('visorclip')}>
              <path d={VISOR_IN} />
            </clipPath>
          </defs>

          <g
            className="deeppet-figure"
            style={{ transform: `translateY(${look.rise}px) rotate(${look.body}deg)` }}
          >
            {/* contact shadow + soft green under-glow, so the pet sits in space
                rather than floating on top of it */}
            <ellipse cx="47" cy="86" rx="25" ry="4.6" fill="#000" opacity="0.28" />
            <ellipse cx="47" cy="84" rx="24" ry="7" fill={`url(#${id('eyeglow')})`} opacity="0.7" />

            {/* energy tail, behind everything */}
            <g className="deeppet-tail">
              <g fill={C.greenLo}>
                {TAIL.map((s, i) => (
                  <rect key={i} x={s.x} y={s.y} width={s.w} height={s.h} />
                ))}
              </g>
              <g fill={C.greenMid}>
                {TAIL.map((s, i) => (
                  <rect key={i} x={s.x + 0.8} y={s.y + 0.8} width={s.w - 1.6} height={s.h - 1.6} />
                ))}
              </g>
              <g fill={C.green}>
                {TAIL_CORE.map((s, i) => (
                  <rect key={i} x={s.x} y={s.y} width={s.w} height={s.h} />
                ))}
              </g>
              <rect x="12" y="85" width="3" height="3" fill={C.green} opacity="0.75" />
              <rect x="7" y="90" width="2.4" height="2.4" fill={C.greenMid} opacity="0.5" />
            </g>

            {/* antenna mast + stepped orb */}
            <rect x="45.6" y="8.5" width="3" height="4.5" fill={C.creamEdge} />
            <rect x="45.6" y="8.5" width="1.4" height="4.5" fill={C.creamMid} />
            <g className="deeppet-antenna">
              <path d={ORB_OUT} fill={orb.shell} />
              <path d={ORB_IN} fill={`url(#${id('orb')})`} />
              {orb.ring && (
                <rect x="41.6" y="0.6" width="10.8" height="1.6" fill={C.greenHi} opacity="0.9" />
              )}
              <rect
                x={47 - orb.hotSize / 2}
                y={5.8 - orb.hotSize / 2}
                width={orb.hotSize}
                height={orb.hotSize}
                fill={orb.hot}
              />
            </g>

            {/* torso + hover pods */}
            <path d={TORSO} fill={`url(#${id('torso')})`} />
            <path d={TORSO} fill="none" stroke={C.creamEdge} strokeWidth="0.8" />
            <g fill={C.creamLo}>
              <rect x="39" y="60" width="21" height="6" />
              <rect x="40" y="66" width="19" height="4" />
            </g>
            <rect x="44" y="56.5" width="7" height="3.5" fill={C.orange} />
            <rect x="44" y="56.5" width="7" height="1.4" fill={C.orangeHi} />
            {PODS.map((pod, i) => (
              <g key={i}>
                <rect x={pod.x} y={pod.y} width="5.5" height="5.5" fill={C.creamMid} />
                <rect x={pod.x} y={pod.y} width="5.5" height="1.4" fill={C.creamHi} opacity="0.85" />
                <rect x={pod.x + 0.8} y={pod.y + 3} width="3.9" height="1.7" fill={C.greenHi} />
              </g>
            ))}

            {/* head shell, chunky highlight + shade bands */}
            <g
              className="deeppet-head"
              style={{ transform: `translateX(${look.lean}px) rotate(${look.head}deg)` }}
            >
              <path d={HEAD_OUTER} fill={`url(#${id('skin')})`} />
              <path d={HEAD_OUTER} fill="none" stroke={C.creamEdge} strokeWidth="0.9" />
              <path d={HEAD_FACE} fill={C.cream} />
              <g fill={C.creamHi}>
                <rect x="29" y="20" width="14" height="2.5" />
                <rect x="27.5" y="22.5" width="9" height="2.5" />
                <rect x="30" y="18" width="9" height="2" />
              </g>
              <g fill={C.creamLo}>
                <rect x="62" y="40" width="11" height="2.5" />
                <rect x="58" y="42.5" width="15" height="2.5" />
                <rect x="63" y="45" width="10" height="2.5" />
              </g>

              {/* visor */}
              <path d={VISOR_OUT} fill={C.visorLo} />
              <path d={VISOR_IN} fill={`url(#${id('visor')})`} />
              <g fill={C.visorHi}>
                <rect x="34" y="23" width="10" height="1.8" />
                <rect x="32.5" y="25" width="7" height="1.8" />
                <rect x="60" y="38" width="6" height="1.8" />
              </g>
              {/* inner green ambience + glass sheen, clipped to the aperture so
                  they never wash out the stepped frame */}
              <g clipPath={`url(#${id('visorclip')})`}>
                <ellipse cx="50" cy="31" rx="18" ry="10" fill={`url(#${id('eyeglow')})`} opacity="0.55" />
                <path d="M36 20 L49 20 L37 42 L31 42 Z" fill={C.white} opacity="0.06" />
                <g fill={C.white} opacity="0.1">
                  <rect x="34" y="24.5" width="10" height="2" />
                  <rect x="32" y="26.5" width="7" height="2" />
                  <rect x="31" y="28.5" width="4" height="2" />
                </g>
              </g>

              {/* optics: eye shape + aperture carve + mouth + glyph */}
              <g className="deeppet-eyeglow">
                <Optic look={look} />
              </g>
            </g>

            {/* scarf + glowing core gem at the knot (gem stays centred on 47,47) */}
            <path d={SCARF} fill={`url(#${id('scarf')})`} />
            <g fill={C.greenLo}>
              <rect x={28 + skew} y={49.5 + drop} width="40" height="3.5" />
            </g>
            <g fill={C.greenHi}>
              <rect x={33 + skew} y={43 - drop * 0.5} width="28" height="1.8" />
            </g>
            <g className="deeppet-core">
              <rect x="43" y="43" width="8" height="8" fill={C.greenLo} />
              <rect x="44" y="44" width="6" height="6" fill={C.green} />
              <rect x="45.4" y="45.4" width="3.2" height="3.2" fill={C.greenHi} />
            </g>
          </g>

          {/* orbiting motes + state sparks */}
          {MOTES.map((m, i) => (
            <g
              key={i}
              className={`deeppet-orbit${m.dur < 0 ? ' deeppet-orbit--reverse' : ''}`}
              style={{ animationDuration: `${Math.max(2.4, p.orbitDur * Math.abs(m.dur) * 0.62)}s` }}
            >
              <g transform={`rotate(${m.angle}) translate(0,${-m.radius})`}>
                <g className="deeppet-fragment">
                  <rect
                    x={-m.size / 2}
                    y={-m.size / 2}
                    width={m.size}
                    height={m.size}
                    fill={m.color}
                  />
                </g>
              </g>
            </g>
          ))}

          <g className="deeppet-sparks">
            {sparks.map((s, i) => (
              <rect key={i} x={s.x} y={s.y} width={s.s} height={s.s} fill={s.c} />
            ))}
          </g>
        </svg>
      </div>
    </>
  )
}
