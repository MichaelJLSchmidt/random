// Quick behaviour check in Chromium at 1440x900 and 390x844 (light, not exhaustive).
// Usage: node scripts/smoke.mjs <base-url> [--motion=full|calm|reduced]
// Needs `npm run preview` (or any server for dist/ under its BASE_PATH).
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const { chromium } = require('playwright')
const [base = 'http://localhost:4100/random/', ...flags] = process.argv.slice(2)
const motion = flags.find((f) => f.startsWith('--motion='))?.slice(9) ?? 'full'
const root = base.endsWith('/') ? base : `${base}/`
const url = (path) => new URL(path.replace(/^\//, ''), root).href
const basePath = new URL(root).pathname.replace(/\/$/, '')

let failures = 0
const check = (name, ok, detail = '') => {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${name}${detail ? ` — ${detail}` : ''}`)
  if (!ok) failures++
}
const wait = (page, ms) => page.waitForTimeout(ms)
const path = (page) => new URL(page.url()).pathname.slice(basePath.length).replace(/(.)\/$/, '$1') || '/'

const viewports = {
  desktop: { viewport: { width: 1440, height: 900 } },
  phone: { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true },
}

async function newContext(browser, device, { firstVisit = false } = {}) {
  const context = await browser.newContext({
    ...viewports[device],
    deviceScaleFactor: 1,
    reducedMotion: motion === 'reduced' ? 'reduce' : 'no-preference',
  })
  await context.addInitScript(
    ({ motion, firstVisit }) => {
      try {
        if (motion === 'calm') localStorage.setItem('motion', 'calm')
        if (!firstVisit) sessionStorage.setItem('table-drawn', '1')
      } catch {}
      // Record every view transition and its types.
      window.__vts = []
      const start = document.startViewTransition?.bind(document)
      if (start)
        document.startViewTransition = (arg) => {
          const t = start(arg)
          const rec = { types: arg?.types ? [...arg.types] : [], ok: null }
          window.__vts.push(rec)
          t.ready.then(
            () => (rec.ok = true),
            (e) => (rec.ok = String(e)),
          )
          return t
        }
    },
    { motion, firstVisit },
  )
  const page = await context.newPage()
  const errors = []
  page.on('pageerror', (e) => errors.push(e.message))
  page.on('console', (m) => {
    // The deliberate 404 page logs its own status.
    if (m.type() !== 'error' || /GPU stall|GL Driver/.test(m.text())) return
    if (m.text().includes('404') && m.location().url.includes('no-such-page')) return
    errors.push(`${m.text()} (${m.location().url})`)
  })
  return { context, page, errors }
}

/** Average colour of a screen region (decoded in the page; works for the WebGL field). */
async function regionColour(page, clip) {
  const png = (await page.screenshot({ clip })).toString('base64')
  return page.evaluate(async (data) => {
    const img = new Image()
    img.src = `data:image/png;base64,${data}`
    await img.decode()
    const c = new OffscreenCanvas(img.width, img.height)
    const g = c.getContext('2d')
    g.drawImage(img, 0, 0)
    const px = g.getImageData(0, 0, img.width, img.height).data
    const sum = [0, 0, 0]
    for (let i = 0; i < px.length; i += 4) for (let k = 0; k < 3; k++) sum[k] += px[i + k]
    const n = px.length / 4
    return sum.map((v) => Math.round(v / n))
  }, png)
}

const live = (page) => page.evaluate(() => document.querySelector('[role="status"]')?.textContent ?? '')
const focused = (page) =>
  page.evaluate(() => {
    const el = document.activeElement
    return el
      ? `${el.tagName.toLowerCase()}${el.id ? `#${el.id}` : ''}${el.dataset?.play ? `[${el.dataset.play}]` : ''}`
      : ''
  })

// ---------------------------------------------------------------------------

async function introSuite(browser, device) {
  const { context, page, errors } = await newContext(browser, device, { firstVisit: true })
  await page.goto(url('/'), { waitUntil: 'commit' })
  // When does each part of the home sequence first become visible?
  const times = await page.evaluate(
    () =>
      new Promise((resolve) => {
        // performance.now() counts from the navigation.
        const t0 = 0
        const seen = {}
        const parts = {
          cards: () => document.querySelector('.hand-fan .hand-card[data-drawn]'),
          title: () => document.querySelector('h1 .wt-word > span'),
          lines: () => document.querySelector('.home-role .rl-in') ?? document.querySelector('.home-role'),
          chrome: () => document.querySelector('[data-chrome]'),
        }
        const tick = () => {
          const t = performance.now() - t0
          // Measure once the stylesheet applies (computed styles before it are meaningless).
          const field = document.querySelector('.field')
          if (!field || getComputedStyle(field).position !== 'fixed') return requestAnimationFrame(tick)
          for (const [k, get] of Object.entries(parts)) {
            const el = get()
            if (seen[k] === undefined && el && el.getClientRects().length) {
              const r = el.getBoundingClientRect()
              const onScreen = r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth
              if (onScreen && Number(getComputedStyle(el).opacity) > 0.3) seen[k] = Math.round(t)
            }
          }
          if (Object.keys(seen).length === 4 || t > 5000) resolve(seen)
          else requestAnimationFrame(tick)
        }
        tick()
      }),
  )
  const order = ['cards', 'title', 'lines', 'chrome'].map((k) => `${k} ${times[k] ?? '-'}ms`).join(', ')
  if (motion === 'full')
    check(
      'home first visit: cards drawn, then title, lines, chrome',
      times.cards < times.title && times.title < times.lines && times.lines <= times.chrome,
      order,
    )
  else check('home first visit: everything shows without the draw', Object.keys(times).length === 4, order)
  await wait(page, 1200)
  check(
    'intro done: data-intro cleared',
    (await page.evaluate(() => document.documentElement.dataset.intro)) === undefined,
  )
  check('field renderer is WebGL', (await page.evaluate(() => document.querySelector('.field')?.dataset.mode)) === 'gl')
  check('no page errors (intro)', errors.length === 0, errors.slice(0, 3).join(' | '))
  await context.close()
}

async function tableSuite(browser, device) {
  const { context, page, errors } = await newContext(browser, device)
  const sky =
    device === 'desktop' ? { x: 1000, y: 120, width: 400, height: 260 } : { x: 220, y: 560, width: 150, height: 120 }
  await page.goto(url('/'), { waitUntil: 'networkidle' })
  await wait(page, 1200)
  check('hand: four card links in nav "Work"', (await page.locator('nav[aria-label="Work"] a.hand-card').count()) === 4)
  check('hand: one tab stop', (await page.locator('nav[aria-label="Work"] [data-roving][tabindex="0"]').count()) === 1)

  // Hover colour blend (fine pointers).
  if (device === 'desktop' && motion !== 'reduced') {
    const before = await regionColour(page, sky)
    await page.hover('.hand-card[data-play="front-door"]', { position: { x: 60, y: 30 } })
    await wait(page, 1000)
    const after = await regionColour(page, sky)
    check(
      'hover: field blends toward the card colour (grove)',
      after[1] - before[1] > 2 && after[1] > after[0],
      `${before} -> ${after}`,
    )
    await page.mouse.move(700, 300)
    await wait(page, 1300)
  }

  // Play.
  const playCard = device === 'phone' ? page.tap.bind(page) : page.click.bind(page)
  await playCard('.hand-fan .hand-card[data-play="team-of-teams"]')
  await page.waitForURL(/team-of-teams/, { timeout: 4000 })
  await wait(page, 1400)
  let vts = await page.evaluate(() => window.__vts)
  check(
    'play: navigates with a "play" view transition',
    vts.at(-1)?.types.includes('play') && vts.at(-1)?.ok === true,
    JSON.stringify(vts.at(-1)),
  )
  check('play: H1 focused', (await focused(page)) === 'h1#page-heading')
  check('play: title announced', (await live(page)).includes('Team of Teams'))
  check(
    'play: ghost in the open slot',
    (await page.locator('.hand-card[data-play="team-of-teams"] .hand-ghost').count()) === 1,
  )
  const ember = await regionColour(page, sky)
  check('play: field is the card colour (ember)', ember[0] > ember[1] + 10 && ember[0] > ember[2] + 10, `${ember}`)

  // Switch (desktop: from the hand; phone: from the sheet).
  if (device === 'phone') {
    await page.tap('.hand-rail')
    await wait(page, 600)
    check(
      'phone: rail opens the sheet',
      await page.evaluate(() => document.getElementById('hand-sheet').matches(':popover-open')),
    )
    await page.tap('#hand-sheet .hand-card[data-play="front-door"]')
  } else await page.click('.hand-card[data-play="front-door"]')
  await page.waitForURL(/front-door/, { timeout: 4000 })
  await wait(page, 1400)
  vts = await page.evaluate(() => window.__vts)
  check(
    'switch: "switch" view transition',
    vts.at(-1)?.types.includes('switch') && vts.at(-1)?.ok === true,
    JSON.stringify(vts.at(-1)),
  )
  if (device === 'phone')
    check(
      'phone: sheet closed after playing',
      !(await page.evaluate(() => document.getElementById('hand-sheet').matches(':popover-open'))),
    )
  const grove = await regionColour(page, sky)
  check('switch: field crossfaded to grove', grove[1] > grove[0] && grove[1] > grove[2], `${grove}`)

  // Return with Escape.
  await page.keyboard.press('Escape')
  await page.waitForURL((u) => path({ url: () => u.href }) === '/', { timeout: 4000 })
  await wait(page, 2400)
  vts = await page.evaluate(() => window.__vts)
  check('return: "return" view transition', vts.at(-1)?.types.includes('return'), JSON.stringify(vts.at(-1)))
  check('return: focus back on the card', (await focused(page)) === 'a[front-door]', await focused(page))
  // Focus on the returned card blends the field like a hover; move it away first.
  await page.evaluate(() => document.activeElement?.blur())
  if (device === 'desktop') await page.mouse.move(700, 200)
  await wait(page, 1400)
  const ink = await regionColour(page, sky)
  check('return: field back to ink', Math.max(...ink) - Math.min(...ink) < 14 && Math.max(...ink) < 60, `${ink}`)

  // Browser back (no transition type): to the card page and home again.
  await page.goBack()
  await page.waitForURL(/front-door/, { timeout: 4000 })
  await wait(page, 1500)
  check('browser back: page and H1 shown', await page.locator('h1').isVisible())
  const back = await regionColour(page, sky)
  check('browser back: field follows the route (grove)', back[1] > back[0], `${back}`)
  await page.goBack()
  await page.waitForURL(/team-of-teams/, { timeout: 4000 })
  await wait(page, 1500)
  const back2 = await regionColour(page, sky)
  check(
    'browser back again: previous card page in its colour (ember)',
    back2[0] > back2[1] && back2[0] > back2[2],
    `${back2}`,
  )

  // Mobile rail hides on scroll down and returns on scroll up.
  if (device === 'phone') {
    await page.goto(url('/work/shared-foundations/'), { waitUntil: 'networkidle' })
    await wait(page, 800)
    check('phone: peek rail visible off home', await page.locator('.hand-rail').isVisible())
    await page.evaluate(() => scrollBy(0, 700))
    await wait(page, 500)
    const hidden = await page.evaluate(() => document.querySelector('.hand').dataset.rail === 'hidden')
    await page.evaluate(() => scrollBy(0, -120))
    await wait(page, 500)
    const shown = await page.evaluate(() => document.querySelector('.hand').dataset.rail === undefined)
    check('phone: rail hides on scroll down, returns on scroll up', hidden && shown)
  }

  // About topography.
  await page.goto(url('/about/'), { waitUntil: 'networkidle' })
  await wait(page, 2000)
  const topo = await page.evaluate(() => ({
    renderer: document.documentElement.dataset.renderer,
    static: getComputedStyle(document.querySelector('.topo-static')).display,
    texture: performance.getEntriesByType('resource').some((e) => e.name.includes('/topo/elevation.png')),
    attribution: document.querySelector('.topo-credit')?.textContent ?? '',
  }))
  if (motion === 'reduced') check('about: static contour SVG (reduced)', topo.static === 'block', JSON.stringify(topo))
  else
    check(
      'about: elevation texture loaded for the WebGL contours',
      topo.renderer === 'gl' && topo.texture && topo.static === 'none',
      JSON.stringify(topo),
    )
  check(
    'about: swisstopo attribution',
    topo.attribution.includes('swissALTI3D') && topo.attribution.includes('swisstopo'),
  )

  // Pages and reveals: nothing in the first viewport stays hidden.
  for (const p of ['/', '/work/front-door/', '/management/', '/projects/', '/contact/', '/no-such-page/']) {
    await page.goto(url(p), { waitUntil: 'networkidle' })
    await wait(page, 2400)
    const hidden = await page.evaluate(() =>
      [...document.querySelectorAll('main [data-reveal]')]
        .filter((el) => {
          const r = el.getBoundingClientRect()
          return r.top < innerHeight * 0.6 && r.bottom > 0 && r.width > 0 && Number(getComputedStyle(el).opacity) < 0.99
        })
        .map((el) => el.dataset.reveal),
    )
    check(`reveal ${p}: first viewport revealed`, hidden.length === 0, hidden.join(','))
  }
  check('404: "This page isn\'t in the deck"', (await page.locator('h1').textContent()).includes('in the deck'))

  check('no page errors', errors.length === 0, errors.slice(0, 3).join(' | '))
  await context.close()
}

async function main() {
  const browser = await chromium.launch()
  for (const device of Object.keys(viewports)) {
    console.log(`\n# ${device} (${motion})`)
    await introSuite(browser, device)
    await tableSuite(browser, device)
  }
  await browser.close()
  console.log(failures ? `\n${failures} failed` : '\nall passed')
  process.exit(failures ? 1 : 0)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
