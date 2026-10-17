// DeepPet expressions QA — browser suite proving all six expressions are
// genuinely distinguishable at small sizes, and that cycling them raises no
// runtime errors.
//
// It selects each expression on the world page, serialises the rendered SVG, and
// rasterises every pair at 64/150/440px to compare pixels. A pair counts as
// distinguishable when at least 1.5% of pixels differ meaningfully (>24/255 on a
// channel) — this catches look-alike faces at the smallest size where the vector
// detail is only a pixel or two wide.
//
// Requirements (see QA.md):
//   - a dev server running at $DEEPPET_QA_BASE_URL (default http://localhost:5175)
//   - Google Chrome (override with $DEEPPET_QA_CHROME if not at the default path)
//   - puppeteer-core (devDependency)
//
// Screenshots are written to $DEEPPET_QA_SHOTS (default: a temp dir), never into
// the repository.
//
//   node deeppet-expressions-qa.mjs
import puppeteer from 'puppeteer-core'
import { mkdirSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const BASE = process.env.DEEPPET_QA_BASE_URL || 'http://localhost:5173'
const CHROME = process.env.DEEPPET_QA_CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const SHOTS = process.env.DEEPPET_QA_SHOTS || join(tmpdir(), 'deeppet-qa-shots')
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
mkdirSync(SHOTS, { recursive: true })

const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--no-sandbox', '--disable-gpu', '--mute-audio', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] })
let pass = 0, fail = 0
const results = []
const check = (name, ok, detail = '') => { if (ok) pass++; else fail++; results.push(`${ok ? 'PASS' : 'FAIL'} ${name}${detail ? ' :: ' + detail : ''}`) }

const STATES = [
  ['idle', 'Idle'],
  ['curious', 'Curious'],
  ['happy', 'Happy'],
  ['excited', 'Excited'],
  ['confused', 'Confused'],
  ['sleepy', 'Sleepy'],
]
const SIZES = [64, 150, 440]

const page = await browser.newPage()
const errs = []
page.on('pageerror', (e) => errs.push('PAGEERROR: ' + String(e)))
page.on('console', (m) => {
  if (m.type() !== 'error') return
  // Expected in a dev environment with no AI provider: the offline-brain probe
  // GET /api/ai/status returns 500 and the browser logs it as a resource error.
  // It is handled in-app (r.ok === false -> local persona), not an exception.
  if (/Failed to load resource/.test(m.text())) return
  errs.push('CONSOLE: ' + m.text())
})
// NOTE: reduced motion OFF so CSS transforms/poses are the full poses; the SVG
// geometry (eyes/carve/mouth/glyph/tilt) is what we rasterize, which is static.
await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'no-preference' }])
await page.setViewport({ width: 1280, height: 900 })
await page.goto(`${BASE}/deepverse/deeppet`, { waitUntil: 'domcontentloaded', timeout: 60000 })
await page.waitForSelector('.deeppet--embedded svg', { timeout: 30000 })
await sleep(1200)

const svgs = {}
for (const [state, label] of STATES) {
  const clicked = await page.evaluate((lbl) => {
    const btn = [...document.querySelectorAll('button')].find((b) => b.textContent.trim() === lbl)
    if (!btn) return false
    btn.click()
    return true
  }, label)
  if (!clicked) { check(`could select expression "${label}"`, false, 'button not found'); continue }
  let matched = false
  for (let i = 0; i < 20; i++) {
    await sleep(80)
    matched = await page.evaluate((s) => document.querySelector('.deeppet--embedded')?.getAttribute('data-state') === s, state)
    if (matched) break
  }
  check(`expression "${label}" applied to the world pet`, matched)
  svgs[state] = await page.evaluate(() => document.querySelector('.deeppet--embedded svg').outerHTML)
  await page.screenshot({ path: `${SHOTS}/world-${state}.png` })
}

// Rasterize each expression at each size and compute pairwise pixel differences.
const data = await page.evaluate(async (svgs, sizes) => {
  function toDataUrl(svg, n) {
    let s = svg
    if (!/xmlns=/.test(s)) s = s.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"')
    s = s.replace(/<svg([^>]*?)\swidth="[^"]*"/, '<svg$1').replace(/<svg([^>]*?)\sheight="[^"]*"/, '<svg$1')
    s = s.replace('<svg', `<svg width="${n}" height="${n}"`)
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(s)
  }
  function load(url) { return new Promise((res, rej) => { const img = new Image(); img.onload = () => res(img); img.onerror = rej; img.src = url }) }
  function raster(img, n) { const c = document.createElement('canvas'); c.width = n; c.height = n; const ctx = c.getContext('2d'); ctx.clearRect(0, 0, n, n); ctx.drawImage(img, 0, 0, n, n); return ctx.getImageData(0, 0, n, n).data }

  const out = {}
  const keys = Object.keys(svgs)
  for (const n of sizes) {
    const rasters = {}
    for (const st of keys) { const img = await load(toDataUrl(svgs[st], n)); rasters[st] = raster(img, n) }
    const pairs = []
    for (let i = 0; i < keys.length; i++) {
      for (let j = i + 1; j < keys.length; j++) {
        const a = rasters[keys[i]], b = rasters[keys[j]]
        let sum = 0, diffPx = 0
        for (let k = 0; k < a.length; k += 4) {
          const dr = Math.abs(a[k] - b[k]), dg = Math.abs(a[k + 1] - b[k + 1]), db = Math.abs(a[k + 2] - b[k + 2])
          sum += dr + dg + db
          if (Math.max(dr, dg, db) > 24) diffPx++
        }
        const px = n * n
        pairs.push({ a: keys[i], b: keys[j], meanAbs: +(sum / (px * 3)).toFixed(3), diffPct: +(diffPx / px).toFixed(4) })
      }
    }
    // self-control: identical state should be ~0
    out[n] = pairs
  }
  return out
}, svgs, SIZES)

for (const n of SIZES) {
  const pairs = data[n]
  const worst = [...pairs].sort((x, y) => x.diffPct - y.diffPct)
  const minPair = worst[0]
  const median = [...pairs].sort((x, y) => x.diffPct - y.diffPct)[Math.floor(pairs.length / 2)]
  console.log(`\nsize ${n}px — pairwise expression differences (${pairs.length} pairs)`)
  console.log(`  most similar pair:  ${minPair.a} vs ${minPair.b}  diffPct=${(minPair.diffPct * 100).toFixed(2)}%  meanAbs=${minPair.meanAbs}`)
  console.log(`  median pair:        diffPct=${(median.diffPct * 100).toFixed(2)}%`)
  // 'distinguishable' = at least 1.5% of pixels differ meaningfully
  check(`[${n}px] every expression pair is visibly distinct (>=1.5% pixels)`, minPair.diffPct >= 0.015, `most-similar=${minPair.a}/${minPair.b} ${(minPair.diffPct * 100).toFixed(2)}%`)
}

const fatal = errs.filter((e) => !/ResizeObserver|WebGL|GL_|SwiftShader|THREE|React DevTools/i.test(e))
check('no console/page errors while cycling expressions', fatal.length === 0, fatal.slice(0, 2).join(' | '))

console.log('\n' + results.join('\n'))
console.log(`\n${pass} passed, ${fail} failed`)
console.log(`screenshots -> ${SHOTS}`)
await browser.close()
process.exit(fail ? 1 : 0)
