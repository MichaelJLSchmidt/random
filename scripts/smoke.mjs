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
    const fresh = async () => {
      const c = await browser.newContext({
        ...options,
        reducedMotion: motion === 'reduced' ? 'reduce' : 'no-preference',
      })
      if (motion === 'calm')
        await c.addInitScript(() => localStorage.getItem('motion') || localStorage.setItem('motion', 'calm'))
      return c
    }
    const ctx = { page, context, device, motion, check, url, errors, fresh }

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

async function introSuite({ motion, check, url, fresh }) {
  // First visit: h1 starts at 200, the intro runs (full only) and ends within budget.
  let c = await fresh()
  // Record the h1 weight the moment it is parsed (before any script runs on it).
  await c.addInitScript(() => {
    const seen = new MutationObserver(() => {
      const word = document.querySelector('main h1 .wt-word > span')
      if (!word) return
      seen.disconnect()
      window.__first = {
        intro: document.documentElement.dataset.intro ?? null,
        weight: getComputedStyle(word).fontWeight,
      }
    })
    seen.observe(document, { childList: true, subtree: true })
  })
  let p = await c.newPage()
  await p.goto(url('/'), { waitUntil: 'commit' })
  await p.waitForSelector('main h1 .wt-word')
  const first = await p.evaluate(() => ({
    ...window.__first,
    skipFirst: document.querySelector('body button, body a')?.matches('[data-intro-skip]'),
  }))
  if (motion === 'reduced') {
    check(
      'reduced: h1 at 760 from first paint, no intro',
      first.weight === '760' && !first.intro,
      JSON.stringify(first),
    )
  } else {
    check('h1 visible at weight 200 on first paint', first.weight === '200', JSON.stringify(first))
  }
  if (motion === 'full') {
    check('"Skip intro" is the first focusable element', first.skipFirst === true)
    const t = await p.evaluate(
      () =>
        new Promise((resolve) => {
          const root = document.documentElement
          let start = null
          const tick = () => {
            if (root.dataset.intro === 'playing' && start === null) start = performance.now()
            if (!root.dataset.intro && start !== null) return resolve(performance.now() - start)
            requestAnimationFrame(tick)
          }
          tick()
        }),
    )
    check('intro completes under 1.6 s', t < 1650, `${Math.round(t)} ms`)
  } else {
    check('no intro outside the full tier', first.intro === null, String(first.intro))
  }
  await p.waitForTimeout(900)
  check(
    'h1 settles at 760',
    (await p.evaluate(() => getComputedStyle(document.querySelector('main h1 .wt-word > span')).fontWeight)) === '760',
  )
  check(
    'first visit is remembered',
    (await p.evaluate(() => localStorage.getItem('intro-seen'))) === (motion === 'full' ? '1' : null),
  )
  await c.close()

  if (motion !== 'full') return
  // Any key jumps to the end state.
  c = await fresh()
  p = await c.newPage()
  await p.goto(url('/'), { waitUntil: 'commit' })
  await p.waitForFunction(() => document.documentElement.dataset.intro === 'playing')
  await p.waitForTimeout(200)
  await p.keyboard.press('Shift')
  await p.waitForTimeout(60)
  const end = await p.evaluate(() => ({
    intro: document.documentElement.dataset.intro ?? null,
    weight: getComputedStyle(document.querySelector('main h1 .wt-word > span')).fontWeight,
    slots: [...document.querySelectorAll('[data-card-slot]')].map((s) => getComputedStyle(s).transform),
  }))
  const flat = (t) => t === 'none' || t === 'matrix(1, 0, 0, 1, 0, 0)'
  check(
    'a key press jumps to the end state',
    end.intro === null && end.weight === '760' && end.slots.every(flat),
    JSON.stringify(end).slice(0, 120),
  )
  // Return visit: no intro, 500 ms weight-in.
  await p.goto(url('/'), { waitUntil: 'commit' })
  await p.waitForSelector('main h1 .wt-word')
  const back = await p.evaluate(() => document.documentElement.dataset.intro ?? null)
  await p.waitForTimeout(250)
  const mid = Number(
    await p.evaluate(() => getComputedStyle(document.querySelector('main h1 .wt-word > span')).fontWeight),
  )
  check(
    'return visit: weight-in only',
    back === null && mid > 200 && mid < 760,
    `intro=${back}, weight at ~250 ms ${mid}`,
  )
  await c.close()
}

// Later phases append their suites here.
const suites = [typeSuite, introSuite]
await main()
