// DeepPet orbit QA — browser regression for the decorative orbiting motes.
//
// Guards the bug where the SVG motes were transformed about the SVG origin
// (0,0) instead of the pet's centre (50,50): they rendered outside the
// `0 0 100 100` viewBox, were clipped by the SVG's default overflow:hidden, and
// effectively disappeared. The motes must hug the pet (radius ~38-43) and stay
// inside the frame in every presentation context.
//
// Requirements (see QA.md):
//   - a dev server running at $DEEPPET_QA_BASE_URL (default http://localhost:5175)
//   - Google Chrome (override with $DEEPPET_QA_CHROME if not at the default path)
//   - puppeteer-core (devDependency)
//
//   node deeppet-orbit-qa.mjs
import puppeteer from 'puppeteer-core'

const BASE = process.env.DEEPPET_QA_BASE_URL || 'http://localhost:5173'
const CHROME = process.env.DEEPPET_QA_CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--no-sandbox', '--disable-gpu', '--mute-audio', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] })
let pass = 0, fail = 0
const log = []
const check = (name, ok, detail = '') => { if (ok) pass++; else fail++; log.push(`${ok ? 'PASS' : 'FAIL'} ${name}${detail ? ' :: ' + detail : ''}`) }

const page = await browser.newPage()
await page.setViewport({ width: 1280, height: 900 })

// Reads every orbiting mote's centre in viewBox units, plus the viewBox size,
// relative to the SVG that contains it. Returns null if the root has no svg.
const moteProbe = `(rootSel) => {
  const root = document.querySelector(rootSel)
  if (!root) return null
  const svg = root.querySelector('svg')
  if (!svg) return null
  const svgRect = svg.getBoundingClientRect()
  const scale = svgRect.width / 100
  const motes = [...root.querySelectorAll('.deeppet-orbit')].map((g) => {
    const r = g.getBoundingClientRect()
    return {
      x: +(((r.left + r.width / 2) - svgRect.left) / scale).toFixed(2),
      y: +(((r.top + r.height / 2) - svgRect.top) / scale).toFixed(2),
    }
  })
  return { count: motes.length, motes }
}`

async function sampleContext(label, rootSel, frames) {
  const samples = []
  for (let i = 0; i < frames; i++) {
    const s = await page.evaluate(new Function('rootSel', `return (${moteProbe})(rootSel)`), rootSel)
    if (!s) { check(`${label}: found a DeepPet svg`, false); return }
    samples.push(s)
    await sleep(280)
  }
  const n = samples[0].count
  check(`${label}: has orbiting motes`, n === 4, `count=${n}`)
  // union of all sampled mote positions
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
  for (const s of samples) for (const m of s.motes) { minX = Math.min(minX, m.x); minY = Math.min(minY, m.y); maxX = Math.max(maxX, m.x); maxY = Math.max(maxY, m.y) }
  // each mote's orbit radius from centre (50,50)
  const radii = samples.map((s) => s.motes.map((m) => Math.hypot(m.x - 50, m.y - 50)))
  const flatR = radii.flat()
  const minR = Math.min(...flatR), maxR = Math.max(...flatR)
  console.log(`${label}: x=[${minX},${maxX}] y=[${minY},${maxY}] radius=[${minR.toFixed(1)},${maxR.toFixed(1)}]`)
  check(`${label}: motes stay inside the viewBox (no clipping)`, minX >= -3 && minY >= -3 && maxX <= 103 && maxY <= 103, `x=[${minX},${maxX}] y=[${minY},${maxY}]`)
  check(`${label}: motes orbit the pet closely (radius ~38-43, not ~90)`, minR >= 28 && maxR <= 52, `radius=[${minR.toFixed(1)},${maxR.toFixed(1)}]`)
  return samples
}

// 1) embedded centrepiece (world)
await page.goto(`${BASE}/deepverse/deeppet`, { waitUntil: 'domcontentloaded', timeout: 60000 })
await page.waitForSelector('.deeppet--embedded svg', { timeout: 30000 })
await sleep(1200)
await sampleContext('embedded(440px)', '.deeppet--embedded', 10)

// 2) floating companion in another world
await page.goto(`${BASE}/deepverse/inside-my-mind`, { waitUntil: 'domcontentloaded', timeout: 60000 })
await page.waitForSelector('.deeppet svg', { timeout: 30000 })
await sleep(1200)
await sampleContext('floating(135px)', '.deeppet:not(.deeppet--preview):not(.deeppet--embedded)', 10)

// 3) 64px portal preview on the Hub (behind the Portal "Enter" gate)
await page.goto(`${BASE}/deepverse`, { waitUntil: 'domcontentloaded', timeout: 60000 })
await page.waitForFunction(() => [...document.querySelectorAll('button')].some((b) => /Enter DeepVerse/.test(b.textContent)), { timeout: 30000 })
await page.evaluate(() => { const b = [...document.querySelectorAll('button')].find((x) => /Enter DeepVerse/.test(x.textContent)); b && b.click() })
await page.waitForSelector('.deeppet--preview svg', { timeout: 30000 }).catch(() => {})
await sleep(1400)
const previewBox = await page.evaluate(() => {
  const el = document.querySelector('.deeppet--preview')
  if (!el) return null
  const r = el.getBoundingClientRect()
  return { w: +r.width.toFixed(1), h: +r.height.toFixed(1) }
})
check('Hub renders the 64px preview', previewBox && Math.abs(previewBox.w - 64) < 2, JSON.stringify(previewBox))
await sampleContext('preview(64px)', '.deeppet--preview', 8)

// 4) reduced motion — the orbit animation is disabled, so the motes hold fixed
//    positions. They must still sit inside the frame (the bug placed them off-frame).
await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }])
await page.goto(`${BASE}/deepverse/deeppet`, { waitUntil: 'domcontentloaded', timeout: 60000 })
await page.waitForSelector('.deeppet--embedded svg', { timeout: 30000 })
await sleep(1000)
const rm = await page.evaluate((rootSel) => {
  const root = document.querySelector(rootSel)
  const svg = root.querySelector('svg')
  const svgRect = svg.getBoundingClientRect()
  const scale = svgRect.width / 100
  return [...root.querySelectorAll('.deeppet-orbit')].map((g) => {
    const r = g.getBoundingClientRect()
    return { x: +(((r.left + r.width / 2) - svgRect.left) / scale).toFixed(2), y: +(((r.top + r.height / 2) - svgRect.top) / scale).toFixed(2) }
  })
}, '.deeppet--embedded')
const rmIn = rm.every((m) => m.x >= -3 && m.x <= 103 && m.y >= -3 && m.y <= 103)
check('reduced-motion(embedded): fixed motes stay inside the viewBox', rmIn && rm.length === 4, JSON.stringify(rm))

console.log('\n' + log.join('\n'))
console.log(`\n${pass} passed, ${fail} failed`)
await browser.close()
process.exit(fail ? 1 : 0)
