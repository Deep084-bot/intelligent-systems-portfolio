import * as THREE from 'three'
import { createCanvas, canvasTexture, paintRadial, mulberry32 } from './helpers'

// All textures are generated procedurally on a <canvas> at runtime — the scene
// ships no external image assets (keeps the bundle clean and the licence story
// trivial). Everything is memoised so we only rasterise each map once.

const cache = new Map()
function once(key, factory) {
  if (!cache.has(key)) cache.set(key, factory())
  return cache.get(key)
}

/* ------------------------------------------------------------------ Earth */

// Coarse continent outlines as [lon, lat] rings. Deliberately simplified — at
// globe scale these read correctly without shipping a real coastline dataset.
const CONTINENTS = [
  // North America
  [[-168, 66], [-160, 71], [-140, 70], [-120, 72], [-100, 73], [-80, 74], [-62, 66], [-55, 52],
   [-65, 47], [-70, 44], [-70, 41], [-75, 36], [-81, 26], [-84, 30], [-90, 29], [-97, 26],
   [-107, 23], [-114, 30], [-122, 37], [-125, 45], [-133, 55], [-147, 60], [-165, 60]],
  // Greenland
  [[-45, 60], [-52, 66], [-58, 70], [-45, 72], [-30, 70], [-22, 66], [-30, 60]],
  // South America
  [[-81, 8], [-72, 11], [-62, 11], [-52, 5], [-50, 0], [-35, -5], [-37, -13], [-40, -22],
   [-48, -27], [-55, -35], [-63, -42], [-69, -52], [-75, -52], [-74, -45], [-73, -37],
   [-71, -28], [-76, -15], [-81, -5]],
  // Africa
  [[-17, 15], [-17, 21], [-8, 31], [0, 35], [10, 35], [25, 32], [34, 31], [36, 22], [43, 12],
   [51, 12], [49, 2], [42, -8], [38, -17], [33, -26], [26, -34], [18, -34], [13, -23],
   [11, -6], [9, 4], [-8, 4]],
  // Eurasia
  [[-10, 36], [-9, 44], [-2, 48], [2, 51], [6, 54], [10, 58], [16, 55], [22, 55], [28, 60],
   [30, 70], [55, 71], [85, 76], [115, 74], [145, 70], [170, 68], [180, 64], [180, 58],
   [160, 52], [140, 45], [130, 42], [124, 37], [121, 30], [108, 21], [103, 12], [98, 8],
   [95, 16], [88, 22], [80, 10], [73, 20], [62, 25], [57, 25], [50, 30], [45, 12], [43, 12],
   [36, 22], [34, 31], [25, 32], [36, 36], [28, 41], [20, 40], [12, 45], [4, 44], [-2, 48]],
  // Australia
  [[113, -22], [122, -18], [130, -12], [137, -12], [142, -11], [146, -19], [150, -25],
   [153, -29], [150, -37], [145, -39], [140, -38], [132, -32], [123, -34], [114, -34]],
]

function lonLatToXY(lon, lat, w, h) {
  return [((lon + 180) / 360) * w, ((90 - lat) / 180) * h]
}

// One deterministic set of coastlines (in lon/lat) shared by every Earth map,
// so the land mask lines up exactly between the albedo and the roughness map.
function jitteredRings(seed = 20241, amp = 3.6) {
  const rng = mulberry32(seed)
  return CONTINENTS.map((ring) => ring.map(([lon, lat]) => [lon + (rng() - 0.5) * amp, lat + (rng() - 0.5) * amp]))
}

function traceRing(ctx, ring, w, h) {
  ctx.beginPath()
  ring.forEach(([lon, lat], i) => {
    const [x, y] = lonLatToXY(lon, lat, w, h)
    if (i === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  })
  ctx.closePath()
}

// Fill land, optionally first stroking a soft shallow-water shelf just beyond
// the coast so land doesn't meet deep ocean with a hard edge.
function paintLand(ctx, w, h, rings, fill, shelf) {
  if (shelf) {
    ctx.lineJoin = 'round'
    ctx.lineWidth = 9
    ctx.strokeStyle = shelf
    for (const ring of rings) { traceRing(ctx, ring, w, h); ctx.stroke() }
  }
  ctx.fillStyle = fill
  for (const ring of rings) { traceRing(ctx, ring, w, h); ctx.fill() }
}

export function getEarthTexture() {
  return once('earth', () => {
    const W = 1024, H = 512
    const { canvas, ctx } = createCanvas(W, H)
    const rng = mulberry32(1337)

    // Ocean: deep navy with subtle abyssal variation.
    const ocean = ctx.createLinearGradient(0, 0, 0, H)
    ocean.addColorStop(0, '#0b2b52')
    ocean.addColorStop(0.5, '#0e3f74')
    ocean.addColorStop(1, '#0b2b52')
    ctx.fillStyle = ocean
    ctx.fillRect(0, 0, W, H)
    for (let i = 0; i < 900; i++) {
      const x = rng() * W, y = rng() * H, r = 6 + rng() * 40
      paintRadial(ctx, x, y, r, [[0, 'rgba(20,70,120,0.25)'], [1, 'rgba(20,70,120,0)']])
    }

    // Land: shallow shelf → green base → lighter, drier interior highlight.
    const rings = jitteredRings()
    paintLand(ctx, W, H, rings, '#2f6b33', 'rgba(64,128,182,0.55)')
    ctx.globalAlpha = 0.5
    paintLand(ctx, W, H, rings, '#6f8f46')
    ctx.globalAlpha = 1

    // Desert / arid speckle across land (rough pass over continents).
    for (let i = 0; i < 1400; i++) {
      const x = rng() * W, y = H * 0.18 + rng() * H * 0.6
      const r = 2 + rng() * 6
      paintRadial(ctx, x, y, r, [[0, 'rgba(180,150,90,0.18)'], [1, 'rgba(180,150,90,0)']])
    }

    // Polar ice caps.
    const capTop = ctx.createLinearGradient(0, 0, 0, H * 0.12)
    capTop.addColorStop(0, 'rgba(238,244,255,0.95)')
    capTop.addColorStop(1, 'rgba(238,244,255,0)')
    ctx.fillStyle = capTop
    ctx.fillRect(0, 0, W, H * 0.12)
    const capBot = ctx.createLinearGradient(0, H, 0, H * 0.86)
    capBot.addColorStop(0, 'rgba(238,244,255,0.95)')
    capBot.addColorStop(1, 'rgba(238,244,255,0)')
    ctx.fillStyle = capBot
    ctx.fillRect(0, H * 0.86, W, H * 0.14)

    // Faint cloud wisps baked into the albedo for gentle variation.
    ctx.globalAlpha = 1
    return canvasTexture(canvas, { wrapS: THREE.RepeatWrapping, wrapT: THREE.ClampToEdgeWrapping })
  })
}

export function getEarthRoughness() {
  return once('earthRough', () => {
    const W = 512, H = 256
    const { canvas, ctx } = createCanvas(W, H)
    // Ocean smooth (dark = low roughness) → specular sun glint on water.
    ctx.fillStyle = '#2a2a2a'
    ctx.fillRect(0, 0, W, H)
    paintLand(ctx, W, H, jitteredRings(), '#e8e8e8')
    return canvasTexture(canvas, { srgb: false, wrapS: THREE.RepeatWrapping, wrapT: THREE.ClampToEdgeWrapping })
  })
}

export function getCloudTexture() {
  return once('cloud', () => {
    const W = 1024, H = 512
    const { canvas, ctx } = createCanvas(W, H)
    ctx.clearRect(0, 0, W, H)
    const rng = mulberry32(4242)
    for (let i = 0; i < 700; i++) {
      const x = rng() * W
      const band = Math.sin((x / W) * Math.PI * 6) * 0.5 + 0.5
      const y = H * 0.2 + rng() * H * 0.6
      const r = 12 + rng() * 55 * (0.4 + band)
      const a = 0.05 + rng() * 0.18
      paintRadial(ctx, x, y, r, [[0, `rgba(255,255,255,${a})`], [1, 'rgba(255,255,255,0)']])
    }
    return canvasTexture(canvas, { wrapS: THREE.RepeatWrapping, wrapT: THREE.ClampToEdgeWrapping })
  })
}

export function getEarthNight() {
  return once('earthNight', () => {
    const W = 1024, H = 512
    const { canvas, ctx } = createCanvas(W, H)
    ctx.fillStyle = '#000000'
    ctx.fillRect(0, 0, W, H)
    const rng = mulberry32(909)
    // Sparse warm city lights scattered over land.
    for (let i = 0; i < 2600; i++) {
      const lon = -180 + rng() * 360
      const lat = -60 + rng() * 120
      const [x, y] = lonLatToXY(lon, lat, W, H)
      const r = 0.4 + rng() * 1.4
      ctx.fillStyle = `rgba(255,${170 + (rng() * 60) | 0},120,${0.35 + rng() * 0.5})`
      ctx.beginPath()
      ctx.arc(x, y, r, 0, Math.PI * 2)
      ctx.fill()
    }
    return canvasTexture(canvas, { wrapS: THREE.RepeatWrapping, wrapT: THREE.ClampToEdgeWrapping })
  })
}

/* ------------------------------------------------------------------- Moon */

export function getMoonTexture() {
  return once('moon', () => {
    const W = 1024, H = 512
    const { canvas, ctx } = createCanvas(W, H)
    const rng = mulberry32(2024)
    ctx.fillStyle = '#9a9aa6'
    ctx.fillRect(0, 0, W, H)
    // Regolith mottling.
    for (let i = 0; i < 1400; i++) {
      const x = rng() * W, y = rng() * H, r = 4 + rng() * 34
      const shade = rng() > 0.5 ? 255 : 0
      paintRadial(ctx, x, y, r, [[0, `rgba(${shade},${shade},${shade},0.045)`], [1, 'rgba(0,0,0,0)']])
    }
    // Maria — overlapping dark basalt blobs, biased to the near side.
    for (let i = 0; i < 90; i++) {
      const cx = W * 0.14 + rng() * W * 0.62
      const cy = H * 0.16 + rng() * H * 0.5
      const r = 22 + rng() * 66
      paintRadial(ctx, cx, cy, r, [[0, `rgba(72,72,84,${0.16 + rng() * 0.22})`], [1, 'rgba(72,72,84,0)']])
    }
    // Craters in three size tiers; rim light and inner shadow fall on opposite
    // sides (from a consistent light direction) so craters read as bowls.
    const crater = (x, y, r) => {
      const lx = 0.28, ly = 0.28 // light comes from upper-left
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2)
      ctx.fillStyle = `rgba(58,58,68,${0.2 + rng() * 0.22})`; ctx.fill()
      // Bright rim on the lit edge.
      ctx.beginPath(); ctx.arc(x - lx * r * 0.4, y - ly * r * 0.4, r * 0.94, 0, Math.PI * 2)
      ctx.lineWidth = Math.max(0.6, r * 0.16); ctx.strokeStyle = `rgba(214,214,224,${0.4 + rng() * 0.3})`; ctx.stroke()
      // Shadowed inner floor opposite the light.
      ctx.beginPath(); ctx.arc(x + lx * r * 0.3, y + ly * r * 0.3, r * 0.66, 0, Math.PI * 2)
      ctx.fillStyle = `rgba(38,38,46,${0.18 + rng() * 0.22})`; ctx.fill()
    }
    for (let i = 0; i < 46; i++) crater(rng() * W, rng() * H, 8 + rng() * 16)
    for (let i = 0; i < 220; i++) crater(rng() * W, rng() * H, 3 + rng() * 7)
    for (let i = 0; i < 620; i++) crater(rng() * W, rng() * H, 1 + rng() * 2.4)
    // A few ray craters with bright ejecta streaks.
    for (let i = 0; i < 4; i++) {
      const x = rng() * W, y = H * 0.2 + rng() * H * 0.6, r = 6 + rng() * 8
      crater(x, y, r)
      const rays = 8 + (rng() * 8 | 0)
      for (let k = 0; k < rays; k++) {
        const a = (k / rays) * Math.PI * 2 + rng() * 0.3
        const len = 30 + rng() * 90
        const grad = ctx.createLinearGradient(x, y, x + Math.cos(a) * len, y + Math.sin(a) * len)
        grad.addColorStop(0, 'rgba(230,230,240,0.35)')
        grad.addColorStop(1, 'rgba(230,230,240,0)')
        ctx.strokeStyle = grad; ctx.lineWidth = 1 + rng() * 1.5
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(a) * len, y + Math.sin(a) * len); ctx.stroke()
      }
    }
    return canvasTexture(canvas)
  })
}

/* -------------------------------------------------------------------- Sun */

export function getSunTexture() {
  return once('sun', () => {
    const W = 1024, H = 512
    const { canvas, ctx } = createCanvas(W, H)
    const rng = mulberry32(555)
    ctx.fillStyle = '#ffb938'
    ctx.fillRect(0, 0, W, H)
    // Granulation + flares.
    for (let i = 0; i < 2600; i++) {
      const x = rng() * W, y = rng() * H, r = 3 + rng() * 22
      const t = rng()
      const col = t < 0.5 ? '255,225,150' : t < 0.8 ? '255,150,40' : '240,80,20'
      paintRadial(ctx, x, y, r, [[0, `rgba(${col},0.35)`], [1, `rgba(${col},0)`]])
    }
    // Bright active regions.
    for (let i = 0; i < 40; i++) {
      const x = rng() * W, y = rng() * H, r = 8 + rng() * 40
      paintRadial(ctx, x, y, r, [[0, 'rgba(255,250,220,0.5)'], [1, 'rgba(255,250,220,0)']])
    }
    return canvasTexture(canvas, { wrapS: THREE.RepeatWrapping })
  })
}

/* --------------------------------------------------------------- Planets */

function mix(a, b, t) {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]
}

function sampleStops(stops, t) {
  if (t <= stops[0][0]) return stops[0][1]
  const last = stops[stops.length - 1]
  if (t >= last[0]) return last[1]
  for (let i = 0; i < stops.length - 1; i++) {
    const [p0, c0] = stops[i]
    const [p1, c1] = stops[i + 1]
    if (t <= p1) return mix(c0, c1, (t - p0) / (p1 - p0 || 1))
  }
  return last[1]
}

// Horizontal banding with a few octaves of sine "noise" so bands are irregular
// rather than ruler-straight.
function paintBands(ctx, w, h, stops, { contrast = 1, freq = 6 } = {}) {
  for (let y = 0; y < h; y++) {
    const ny = y / h
    let n = Math.sin(ny * Math.PI * 2 * freq + 0.5) * 0.5
    n += Math.sin(ny * Math.PI * 2 * (freq * 2.1) + 1.7) * 0.3
    n += Math.sin(ny * Math.PI * 2 * (freq * 4.7) + 3.1) * 0.2
    n = 0.5 + n * 0.5 * contrast
    const [r, g, b] = sampleStops(stops, n).map((v) => Math.round(v))
    ctx.fillStyle = `rgb(${r},${g},${b})`
    ctx.fillRect(0, y, w, 1)
  }
}

function studTexture(kind, seed) {
  const W = 512, H = 256
  const { canvas, ctx } = createCanvas(W, H)
  const rng = mulberry32(seed)
  const speckle = (n, col, rMax, aMax, yb = 0, yt = 1) => {
    for (let i = 0; i < n; i++) {
      const x = rng() * W, y = H * (yb + rng() * (yt - yb)), r = 2 + rng() * rMax
      paintRadial(ctx, x, y, r, [[0, `rgba(${col},${(rng() * aMax).toFixed(3)})`], [1, `rgba(${col},0)`]])
    }
  }

  if (kind === 'Mercury') {
    ctx.fillStyle = '#8b8a8e'; ctx.fillRect(0, 0, W, H)
    speckle(700, '70,68,74', 14, 0.4)
    speckle(500, '180,178,184', 10, 0.35)
    for (let i = 0; i < 140; i++) {
      const x = rng() * W, y = rng() * H, r = 2 + rng() * 9
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2)
      ctx.fillStyle = `rgba(60,58,64,${0.3 + rng() * 0.3})`; ctx.fill()
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2)
      ctx.lineWidth = Math.max(0.6, r * 0.2); ctx.strokeStyle = 'rgba(200,198,205,0.45)'; ctx.stroke()
    }
  } else if (kind === 'Venus') {
    paintBands(ctx, W, H, [[0, [203, 170, 108]], [0.5, [232, 210, 158]], [1, [188, 154, 96]]], { contrast: 0.8, freq: 4 })
    speckle(300, '255,244,205', 40, 0.22, 0.1, 0.9)
    speckle(200, '160,120,60', 50, 0.15, 0.1, 0.9)
  } else if (kind === 'Earth') {
    return getEarthTexture()
  } else if (kind === 'Mars') {
    ctx.fillStyle = '#b5522f'; ctx.fillRect(0, 0, W, H)
    speckle(260, '120,52,30', 46, 0.4)
    speckle(200, '214,132,84', 40, 0.28)
    speckle(300, '150,72,42', 22, 0.3)
    const cap = ctx.createLinearGradient(0, 0, 0, H * 0.1)
    cap.addColorStop(0, 'rgba(240,240,248,0.95)'); cap.addColorStop(1, 'rgba(240,240,248,0)')
    ctx.fillStyle = cap; ctx.fillRect(0, 0, W, H * 0.1)
    const cap2 = ctx.createLinearGradient(0, H, 0, H * 0.9)
    cap2.addColorStop(0, 'rgba(240,240,248,0.9)'); cap2.addColorStop(1, 'rgba(240,240,248,0)')
    ctx.fillStyle = cap2; ctx.fillRect(0, H * 0.9, W, H * 0.1)
  } else if (kind === 'Jupiter') {
    paintBands(ctx, W, H, [
      [0, [176, 138, 96]], [0.22, [222, 199, 160]], [0.4, [156, 108, 74]],
      [0.55, [232, 214, 178]], [0.7, [188, 146, 104]], [1, [150, 108, 78]],
    ], { contrast: 1.25, freq: 7 })
    speckle(420, '255,240,210', 30, 0.18, 0.05, 0.95)
    speckle(300, '120,80,50', 26, 0.2, 0.05, 0.95)
    // Great Red Spot
    ctx.save()
    ctx.translate(W * 0.62, H * 0.63); ctx.scale(1, 0.55)
    paintRadial(ctx, 0, 0, 34, [[0, 'rgba(178,78,56,0.9)'], [0.6, 'rgba(160,80,60,0.5)'], [1, 'rgba(160,80,60,0)']])
    ctx.restore()
  } else if (kind === 'Saturn') {
    paintBands(ctx, W, H, [[0, [206, 184, 132]], [0.5, [232, 214, 168]], [1, [198, 176, 128]]], { contrast: 0.7, freq: 5 })
    speckle(200, '255,244,205', 40, 0.14, 0.1, 0.9)
  } else if (kind === 'Uranus') {
    paintBands(ctx, W, H, [[0, [150, 200, 214]], [0.5, [186, 226, 234]], [1, [148, 198, 212]]], { contrast: 0.45, freq: 3 })
  } else if (kind === 'Neptune') {
    paintBands(ctx, W, H, [[0, [46, 78, 176]], [0.5, [78, 118, 214]], [1, [42, 72, 170]]], { contrast: 0.8, freq: 4 })
    ctx.save(); ctx.translate(W * 0.35, H * 0.6); ctx.scale(1, 0.6)
    paintRadial(ctx, 0, 0, 30, [[0, 'rgba(24,40,110,0.85)'], [1, 'rgba(24,40,110,0)']])
    ctx.restore()
  }
  return canvasTexture(canvas, { wrapS: THREE.RepeatWrapping })
}

export function getPlanetTexture(name) {
  const seeds = { Mercury: 11, Venus: 22, Earth: 33, Mars: 44, Jupiter: 55, Saturn: 66, Uranus: 77, Neptune: 88 }
  return once('planet:' + name, () => studTexture(name, seeds[name] ?? 100))
}

// Saturn's rings as a radial strip: bright inner band, a dark Cassini division,
// then a fainter outer band that fades out.
export function getSaturnRingTexture() {
  return once('saturnRing', () => {
    const W = 512, H = 16
    const { canvas, ctx } = createCanvas(W, H)
    const rng = mulberry32(4321)
    for (let x = 0; x < W; x++) {
      const t = x / W
      let a = 0
      if (t > 0.02 && t < 0.98) a = 0.85
      if (t > 0.58 && t < 0.66) a = 0.12 // Cassini division
      if (t > 0.9) a = 0.4
      if (t < 0.06 || t > 0.96) a *= 0.15
      const n = 0.6 + 0.4 * Math.sin(t * 90) * Math.sin(t * 23 + 1.1)
      const r = 214 + ((rng() * 26) | 0)
      ctx.fillStyle = `rgba(${r},${(r * 0.9) | 0},${(r * 0.72) | 0},${(a * n).toFixed(3)})`
      ctx.fillRect(x, 0, 1, H)
    }
    return canvasTexture(canvas, { wrapS: THREE.ClampToEdgeWrapping, wrapT: THREE.ClampToEdgeWrapping })
  })
}

/* --------------------------------------------------------------- Facades */

// Window grid for buildings/cities. Returns an emissive-style map: bright warm
// windows on a near-black facade. `cols`/`rows` control grid density.
export function getFacadeTexture({ cols = 6, rows = 16, seed = 1, litRatio = 0.55 } = {}) {
  return once(`facade:${cols}:${rows}:${seed}:${litRatio}`, () => {
    const W = 256, H = 512
    const { canvas, ctx } = createCanvas(W, H)
    const rng = mulberry32(seed * 7919 + 13)
    ctx.fillStyle = '#05070f'
    ctx.fillRect(0, 0, W, H)
    const padX = W * 0.12, padY = H * 0.06
    const gw = (W - padX * 2) / cols
    const gh = (H - padY * 2) / rows
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = padX + c * gw + gw * 0.18
        const y = padY + r * gh + gh * 0.22
        const w = gw * 0.64, h = gh * 0.5
        const lit = rng() < litRatio
        if (lit) {
          const warm = rng()
          const col = warm < 0.7 ? `255,${200 + (rng() * 40) | 0},${120 + (rng() * 60) | 0}`
            : warm < 0.9 ? '210,230,255' : '255,255,235'
          ctx.fillStyle = `rgba(${col},${0.6 + rng() * 0.4})`
        } else {
          ctx.fillStyle = 'rgba(20,28,45,0.6)'
        }
        ctx.fillRect(x, y, w, h)
      }
    }
    return canvasTexture(canvas)
  })
}

export function getRoadTexture() {
  return once('road', () => {
    const S = 256
    const { canvas, ctx } = createCanvas(S, S)
    ctx.fillStyle = '#0a0d16'
    ctx.fillRect(0, 0, S, S)
    const rng = mulberry32(3131)
    for (let i = 0; i < 400; i++) {
      ctx.fillStyle = `rgba(30,36,52,${rng() * 0.4})`
      ctx.fillRect(rng() * S, rng() * S, 1 + rng() * 3, 1 + rng() * 3)
    }
    // Lane markings.
    ctx.fillStyle = 'rgba(200,180,90,0.35)'
    for (let y = 0; y < S; y += 32) ctx.fillRect(S / 2 - 2, y + 6, 4, 18)
    const tex = canvasTexture(canvas, { repeatX: 6, repeatY: 6, wrapS: THREE.RepeatWrapping, wrapT: THREE.RepeatWrapping })
    return tex
  })
}

/* -------------------------------------------------------------- Materials */

export function getRingTexture() {
  return once('ring', () => {
    const W = 256, H = 16
    const { canvas, ctx } = createCanvas(W, H)
    const rng = mulberry32(88)
    for (let x = 0; x < W; x++) {
      const t = x / W
      const n = 0.5 + 0.5 * Math.sin(t * 40) * Math.sin(t * 11 + 1.3)
      const a = (0.15 + n * 0.55) * (t < 0.08 || t > 0.94 ? 0.2 : 1)
      const r = 210 + (rng() * 30) | 0
      ctx.fillStyle = `rgba(${r},${(r * 0.86) | 0},${(r * 0.62) | 0},${a})`
      ctx.fillRect(x, 0, 1, H)
    }
    return canvasTexture(canvas, { wrapS: THREE.ClampToEdgeWrapping, wrapT: THREE.ClampToEdgeWrapping })
  })
}

export function getStarSprite() {
  return once('starSprite', () => {
    const S = 64
    const { canvas, ctx } = createCanvas(S, S)
    paintRadial(ctx, S / 2, S / 2, S / 2, [
      [0, 'rgba(255,255,255,1)'],
      [0.25, 'rgba(255,255,255,0.85)'],
      [0.6, 'rgba(255,255,255,0.18)'],
      [1, 'rgba(255,255,255,0)'],
    ])
    return canvasTexture(canvas)
  })
}

export function getGlowSprite() {
  return once('glowSprite', () => {
    const S = 128
    const { canvas, ctx } = createCanvas(S, S)
    paintRadial(ctx, S / 2, S / 2, S / 2, [
      [0, 'rgba(255,255,255,0.9)'],
      [0.4, 'rgba(255,255,255,0.25)'],
      [1, 'rgba(255,255,255,0)'],
    ])
    return canvasTexture(canvas)
  })
}

export function getContactShadow() {
  return once('contactShadow', () => {
    const S = 256
    const { canvas, ctx } = createCanvas(S, S)
    paintRadial(ctx, S / 2, S / 2, S / 2, [
      [0, 'rgba(0,0,0,0.55)'],
      [0.55, 'rgba(0,0,0,0.22)'],
      [1, 'rgba(0,0,0,0)'],
    ])
    return canvasTexture(canvas, { srgb: false })
  })
}

export function getWoodTexture() {
  return once('wood', () => {
    const W = 256, H = 256
    const { canvas, ctx } = createCanvas(W, H)
    const rng = mulberry32(1212)
    ctx.fillStyle = '#5a3d24'
    ctx.fillRect(0, 0, W, H)
    for (let i = 0; i < 60; i++) {
      const y = rng() * H
      ctx.strokeStyle = `rgba(${90 + rng() * 40 | 0},${60 + rng() * 30 | 0},${34 + rng() * 20 | 0},${0.3 + rng() * 0.4})`
      ctx.lineWidth = 1 + rng() * 3
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.bezierCurveTo(W * 0.3, y + (rng() - 0.5) * 20, W * 0.6, y + (rng() - 0.5) * 20, W, y)
      ctx.stroke()
    }
    return canvasTexture(canvas, { repeatX: 2, repeatY: 2, wrapS: THREE.RepeatWrapping, wrapT: THREE.RepeatWrapping })
  })
}

export function getPlasterTexture() {
  return once('plaster', () => {
    const S = 256
    const { canvas, ctx } = createCanvas(S, S)
    const rng = mulberry32(7)
    ctx.fillStyle = '#26292f'
    ctx.fillRect(0, 0, S, S)
    for (let i = 0; i < 2000; i++) {
      const v = 20 + rng() * 40
      ctx.fillStyle = `rgba(${v},${v},${v + 6},${rng() * 0.3})`
      ctx.fillRect(rng() * S, rng() * S, 1 + rng() * 2, 1 + rng() * 2)
    }
    return canvasTexture(canvas, { repeatX: 2, repeatY: 2, wrapS: THREE.RepeatWrapping, wrapT: THREE.RepeatWrapping })
  })
}

export function disposeTextureCache() {
  for (const tex of cache.values()) {
    if (tex && tex.dispose) tex.dispose()
  }
  cache.clear()
}
