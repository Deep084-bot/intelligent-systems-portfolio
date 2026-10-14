import * as THREE from 'three'

// Shared maths + tiny utilities for the Cosmos scene. Kept dependency-free so
// each stage module can import exactly what it needs.

export function smoothstep(edge0, edge1, x) {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)))
  return t * t * (3 - 2 * t)
}

// Stage visibility for a window expressed as [fadeInStart, fadeInEnd,
// fadeOutStart, fadeOutEnd]. Returns 1 while fully inside and eases to 0 at the
// edges, so neighbouring stages cross-fade rather than popping.
export function stageVisibility(progress, w) {
  const [a, b, c, d] = w
  const rising = smoothstep(a, b, progress)
  const falling = 1 - smoothstep(c, d, progress)
  return Math.min(rising, falling)
}

export const STAGE_WINDOWS = {
  human: [-0.2, -0.1, 0.08, 0.13],
  room: [0.07, 0.12, 0.17, 0.22],
  building: [0.17, 0.22, 0.27, 0.33],
  city: [0.28, 0.33, 0.39, 0.46],
  earth: [0.41, 0.46, 0.53, 0.6],
  moon: [0.52, 0.58, 0.64, 0.7],
  sun: [0.63, 0.69, 0.77, 0.83],
  solar: [0.78, 0.83, 0.87, 0.91],
  galaxy: [0.86, 0.9, 0.94, 0.965],
  universe: [0.935, 0.965, 1.0, 1.01],
}

// Deterministic PRNG so layouts are stable between renders/reloads (random
// geometry that reshuffles every mount reads as noise rather than design).
export function mulberry32(seed) {
  let a = seed >>> 0
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function createCanvas(width, height) {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  return { canvas, ctx: canvas.getContext('2d') }
}

// Build a THREE.CanvasTexture with sane defaults (colour space + filtering).
// Pass `srgb: false` for data maps (roughness/alpha).
export function canvasTexture(canvas, { repeatX = 1, repeatY = 1, srgb = true, wrapS, wrapT } = {}) {
  const tex = new THREE.CanvasTexture(canvas)
  if (wrapS) tex.wrapS = wrapS
  if (wrapT) tex.wrapT = wrapT
  tex.repeat.set(repeatX, repeatY)
  tex.anisotropy = 4
  if (srgb) tex.colorSpace = THREE.SRGBColorSpace
  tex.needsUpdate = true
  return tex
}

// Soft radial falloff used for glows, contact shadows and point sprites.
export function paintRadial(ctx, x, y, r, stops) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r)
  for (const [offset, color] of stops) g.addColorStop(offset, color)
  ctx.fillStyle = g
  ctx.beginPath()
  ctx.arc(x, y, r, 0, Math.PI * 2)
  ctx.fill()
}

export function hexToRgb(hex) {
  const n = parseInt(hex.replace('#', ''), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}
