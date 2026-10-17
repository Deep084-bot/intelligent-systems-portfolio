// DeepPet interactions QA — browser suite for the companion's runtime wiring:
// the particle canvas mounts in both the world centrepiece and the floating
// companion, a reaction button drives the world expression, the secondary poke
// control exists, and clicking the floating pet navigates to its own world.
//
// Requirements (see QA.md):
//   - a dev server running at $DEEPPET_QA_BASE_URL (default http://localhost:5175)
//   - Google Chrome (override with $DEEPPET_QA_CHROME if not at the default path)
//   - puppeteer-core (devDependency)
//
//   node deeppet-interactions-qa.mjs
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

// world: particle canvas + reaction buttons
await page.goto(`${BASE}/deepverse/deeppet`, { waitUntil: 'domcontentloaded', timeout: 60000 })
await page.waitForSelector('.deeppet--embedded svg', { timeout: 30000 })
await sleep(2000)
const cv = await page.evaluate(() => { const c = document.querySelector('.deeppet--embedded .deeppet-trail'); return c ? { w: c.width, h: c.height, tag: c.tagName } : null })
check('world: particle canvas mounts with size', cv && cv.tag === 'CANVAS' && cv.w > 0 && cv.h > 0, JSON.stringify(cv))
const before = await page.evaluate(() => document.querySelector('.deeppet--embedded').getAttribute('data-state'))
await page.evaluate(() => { const b = [...document.querySelectorAll('button')].find((x) => x.textContent.trim() === 'Poke'); b && b.click() })
await sleep(500)
const after = await page.evaluate(() => document.querySelector('.deeppet--embedded').getAttribute('data-state'))
check('world: a reaction button drives the pet expression', before !== after, `${before} -> ${after}`)

// floating: particle canvas + poke button + click navigates
await page.goto(`${BASE}/deepverse/inside-my-mind`, { waitUntil: 'domcontentloaded', timeout: 60000 })
await page.waitForSelector('.deeppet svg', { timeout: 30000 })
await sleep(2000)
const fcv = await page.evaluate(() => { const c = document.querySelector('.deeppet .deeppet-trail'); return c ? c.tagName : null })
check('floating: particle canvas mounts', fcv === 'CANVAS', String(fcv))
const hasPoke = await page.evaluate(() => !!document.querySelector('.deeppet .deeppet-poke'))
check('floating: secondary poke control present', hasPoke)
const navBefore = page.url()
await page.evaluate(() => { const h = document.querySelector('.deeppet .deeppet-hit'); h && h.click() })
await sleep(800)
check('floating: clicking the pet navigates to its world', page.url().includes('/deepverse/deeppet'), `${navBefore} -> ${page.url()}`)

console.log(log.join('\n'))
console.log(`\n${pass} passed, ${fail} failed`)
await browser.close()
process.exit(fail ? 1 : 0)
