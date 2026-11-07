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
  // Return visit: no intro, 500 ms weight-in (sampled every frame for 900 ms).
  await p.goto(url('/'), { waitUntil: 'commit' })
  await p.waitForSelector('main h1 .wt-word')
  const samples = await p.evaluate(
    () =>
      new Promise((resolve) => {
        const out = []
        const start = performance.now()
        const tick = () => {
          out.push(
            Math.round(parseFloat(getComputedStyle(document.querySelector('main h1 .wt-word > span')).fontWeight)),
          )
          if (performance.now() - start < 900) requestAnimationFrame(tick)
          else resolve({ intro: document.documentElement.dataset.intro ?? null, out })
        }
        tick()
      }),
  )
  const between = samples.out.some((w) => w > 200 && w < 760)
  check(
    'return visit: weight-in only',
    samples.intro === null && between && samples.out.at(-1) === 760,
    `${samples.out[0]} → ${samples.out.at(-1)}, intermediate ${between}`,
  )
  await c.close()
}

async function scrollSuite({ page, motion, check, url }) {
  await page.goto(url('/work/shared-foundations/'), { waitUntil: 'networkidle' })
  await page.waitForTimeout(800)
  const state = () =>
    page.evaluate(() => ({
      pending: document.querySelectorAll('[data-reveal="pending"], [data-rise="pending"]').length,
      statement: [...document.querySelectorAll('[data-statement] .wt-word > span')].map((s) =>
        Math.round(parseFloat(getComputedStyle(s).fontWeight)),
      ),
      titles: [...document.querySelectorAll('[data-section-title] .wt-word > span')].map((s) =>
        Math.round(parseFloat(getComputedStyle(s).fontWeight)),
      ),
    }))
  const before = await state()
  if (motion === 'full') {
    check('sections below the fold wait for scroll', before.pending > 0, `${before.pending} pending`)
  } else {
    check(
      'calm/reduced: final states, statement filled',
      before.pending === 0 && before.statement.every((w) => w === 760),
      JSON.stringify(before).slice(0, 90),
    )
  }
  for (let y = 0; y < 6000; y += 350) {
    await page.evaluate((y) => window.scrollTo(0, y), y)
    await page.waitForTimeout(90)
  }
  await page.waitForTimeout(700)
  const after = await state()
  check('everything revealed after scrolling', after.pending === 0, `${after.pending} pending`)
  check(
    'section titles settle at 680',
    after.titles.length > 0 && after.titles.every((w) => w === 680),
    [...new Set(after.titles)].join(','),
  )
  check(
    'statement filled to 760 past the viewport',
    after.statement.every((w) => w === 760),
    [...new Set(after.statement)].join(','),
  )
  if (motion === 'full') {
    await page.evaluate(() => window.scrollTo(0, 0))
    await page.waitForTimeout(500)
    const back = await state()
    check(
      'statement weight follows scroll back up',
      back.statement.some((w) => w < 760),
      [...new Set(back.statement)].join(','),
    )
  }
}

async function hoverSuite({ page, context, device, motion, check, url }) {
  await page.goto(url('/'), { waitUntil: 'networkidle' })
  await page.waitForTimeout(700)
  const card = page.locator('[data-hand] li').nth(1)
  const surface = card.locator('[data-foil-surface]')
  await card.scrollIntoViewIfNeeded()
  const foilOpacity = () => surface.evaluate((el) => getComputedStyle(el.querySelector('[data-foil-layer]')).opacity)
  check('foil invisible at rest', (await foilOpacity()) === '0')
  const tints = await page.$$eval('[data-hand] [data-foil-surface]', (els) =>
    els.map((el) => getComputedStyle(el).getPropertyValue('--foil-gradient').slice(30, 60)),
  )
  check('each case study has its own foil tint', new Set(tints).size === 3)

  if (device === 'desktop') {
    const restColor = await card.locator('.tf-base').evaluate((el) => getComputedStyle(el).color)
    const box = await surface.boundingBox()
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
    await page.mouse.move(box.x + box.width * 0.6, box.y + box.height * 0.55)
    await page.waitForTimeout(150)
    const glints = await page.evaluate(
      () =>
        document.getAnimations().filter((a) => a.effect?.target?.matches?.('[data-glint-text], .glint > span')).length,
    )
    await page.waitForTimeout(450)
    const fill = await card.locator('.tf-fill').evaluate((el) => getComputedStyle(el).clipPath)
    const foil = await foilOpacity()
    const x = await surface.evaluate((el) => el.style.getPropertyValue('--foil-x'))
    check('bold title rests in the secondary colour', restColor !== 'rgb(244, 244, 246)', restColor)
    check('title fill sweeps in on hover', /^inset\(-[\d.]+px\)$/.test(fill), fill)
    check('foil fades in on hover', foil === '0.92', foil)
    check('foil tracks the pointer (full only)', motion === 'full' ? x !== '' : x === '', `--foil-x ${x || '(none)'}`)
    check('Glint: at most one, full tier only', motion === 'full' ? glints === 1 : glints === 0, `${glints} running`)
    const nav = page.locator('header nav a').first()
    const u0 = await nav.locator('.link').evaluate((el) => getComputedStyle(el).getPropertyValue('--u'))
    await nav.hover()
    await page.waitForTimeout(250)
    const u1 = await nav.locator('.link').evaluate((el) => getComputedStyle(el).getPropertyValue('--u'))
    check('link underline draws in on hover', u0 === '0%' && u1 === '100%', `${u0} → ${u1}`)
    await page.mouse.move(0, 0)
  } else {
    const fillShown = await card.locator('.tf-fill').evaluate((el) => getComputedStyle(el).display)
    check('no title fill on touch screens', fillShown === 'none')
    // Touch-hold: foil wakes up, and releasing does not open the card.
    const box = await surface.boundingBox()
    const cdp = await context.newCDPSession(page)
    // Upper part of the card: in the narrow stack the next card covers its lower half.
    const point = { x: box.x + box.width / 2, y: box.y + box.height * 0.12 }
    const before = page.url()
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [point] })
    await page.waitForTimeout(520)
    const held = await surface.evaluate((el) => el.hasAttribute('data-foil-active'))
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
    await page.waitForTimeout(600)
    check('touch-hold wakes the foil', held)
    check('releasing a hold does not open the card', page.url() === before, page.url())
  }

  await context.grantPermissions(['clipboard-read', 'clipboard-write']).catch(() => {})
  await page.goto(url('/contact/'), { waitUntil: 'networkidle' })
  await page.getByRole('button', { name: 'Copy email' }).click()
  await page.waitForTimeout(150)
  const copied = await page.evaluate(() => document.querySelector('[role=status]')?.textContent)
  check('copying the email is announced', copied === 'Email address copied', copied)
}

// Later phases append their suites here.
const suites = [typeSuite, introSuite, scrollSuite, hoverSuite]
await main()
