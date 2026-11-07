// Quick behaviour check in Chromium at one desktop and one phone viewport.
// Usage: node scripts/smoke.mjs <base-url> [--motion=full|calm|reduced]
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const { chromium } = require('playwright')
const [base = 'http://localhost:4100/random/', ...flags] = process.argv.slice(2)
const motion = flags.find((f) => f.startsWith('--motion='))?.slice(9) ?? 'full'
const root = base.endsWith('/') ? base : `${base}/`
const url = (path) => new URL(path.replace(/^\//, ''), root).href

let failures = 0
const check = (name, ok, detail = '') => {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${name}${detail ? ` — ${detail}` : ''}`)
  if (!ok) failures++
}

async function main() {
  const browser = await chromium.launch()
  const viewports = {
    desktop: { viewport: { width: 1280, height: 900 } },
    phone: { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true },
  }

  for (const [device, options] of Object.entries(viewports)) {
    console.log(`\n# ${device} (${motion})`)
    const context = await browser.newContext({
      ...options,
      reducedMotion: motion === 'reduced' ? 'reduce' : 'no-preference',
    })
    if (motion === 'calm')
      await context.addInitScript(() => localStorage.getItem('motion') || localStorage.setItem('motion', 'calm'))
    const page = await context.newPage()
    const errors = []
    page.on('pageerror', (e) => errors.push(e.message))
    page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
    const ctx = { page, context, device, motion, check, url, errors }

    for (const run of suites) await run(ctx)

    check('no page errors', errors.length === 0, errors.slice(0, 3).join(' | '))
    await context.close()
  }

  await browser.close()
  process.exit(failures ? 1 : 0)
}

// ---------------------------------------------------------------------------

async function typeSuite({ page, check, url }) {
  await page.goto(url('/'), { waitUntil: 'networkidle' })
  await page.evaluate(() => document.fonts.ready)
  const font = await page.evaluate(() => {
    const family = getComputedStyle(document.body).fontFamily.split(',')[0].replace(/"/g, '').trim()
    const face = [...document.fonts].find((f) => f.family.replace(/"/g, '') === family && f.status === 'loaded')
    return {
      family,
      weight: face?.weight,
      src: performance
        .getEntriesByType('resource')
        .find((r) => /MonaSans/.test(r.name))
        ?.name.split('/')
        .pop(),
    }
  })
  check(
    'Mona Sans (wght 200–900) is the body font',
    font.weight === '200 900' && Boolean(font.src),
    JSON.stringify(font),
  )
  const stretch = await page.evaluate(() => getComputedStyle(document.body).fontStretch)
  check('font-stretch locked at 100%', stretch === '100%', stretch)

  // Weight changes inside reserved word boxes must not move anything.
  const probe = () =>
    page.evaluate(() => {
      const h1 = document.querySelector('main h1')
      const r = h1.getBoundingClientRect()
      const words = [...h1.querySelectorAll('.wt-word')].map((w) => {
        const b = w.getBoundingClientRect()
        return `${Math.round(b.x)},${Math.round(b.y)},${Math.round(b.width)}`
      })
      return { box: `${Math.round(r.width)}x${Math.round(r.height)}`, words: words.join(' ') }
    })
  await page.evaluate(() => document.querySelectorAll('main h1 .wt-word').forEach((w) => (w.style.transition = 'none')))
  await page.evaluate(() =>
    document.querySelectorAll('main h1 .wt-word').forEach((w) => w.style.setProperty('--wght', '200')),
  )
  const light = await probe()
  await page.evaluate(() =>
    document.querySelectorAll('main h1 .wt-word').forEach((w) => w.style.setProperty('--wght', '760')),
  )
  const heavy = await probe()
  check(
    'h1 weight 200→760 does not reflow',
    light.box === heavy.box && light.words === heavy.words,
    `${light.box} vs ${heavy.box}`,
  )
  await page.evaluate(() =>
    document.querySelectorAll('main h1 .wt-word').forEach((w) => w.style.removeProperty('--wght')),
  )

  const weights = await page.evaluate(() => ({
    h1: getComputedStyle(document.querySelector('main h1 .wt')).fontWeight,
    h2: getComputedStyle(document.querySelector('main h2')).fontWeight,
    card: getComputedStyle(document.querySelector('main ol h3')).fontWeight,
    body: getComputedStyle(document.querySelector('main p')).fontWeight,
  }))
  check(
    'resting weights 760 / 680 / 640 / 400',
    weights.h1 === '760' && weights.card === '640' && weights.body === '400',
    JSON.stringify(weights),
  )
}

// Later phases append their suites here.
const suites = [typeSuite]
await main()
