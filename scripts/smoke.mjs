// Quick behaviour check in Chromium at 1440x900 and 390x844 (light, not exhaustive).
// Usage: node scripts/smoke.mjs <locale-url> [--motion=full|calm|reduced]
//   e.g. node scripts/smoke.mjs http://localhost:4100/random/de/ --motion=full
// Run it once per locale (de, en) and per tier: the motion suite checks what each tier must (and
// must not) do; the locale suite checks the root's language choice, the 404 page and the switcher.
// Needs `npm run preview` (or any server for dist/ under its BASE_PATH).
// Card and page titles and the chrome's labels come from the locale's content modules (loaded
// with Node's type stripping, scripts/load-ts.mjs), so copy changes never break the checks.
import { createRequire } from 'node:module'
import { load } from './load-ts.mjs'

const require = createRequire(import.meta.url)
const { chromium } = require('playwright')
const [base = 'http://localhost:4100/random/de/', ...flags] = process.argv.slice(2)
const motion = flags.find((f) => f.startsWith('--motion='))?.slice(9) ?? 'full'
const root = base.endsWith('/') ? base : `${base}/`
const locale = new URL(root).pathname.split('/').filter(Boolean).at(-1)
const { locales } = await load('src/lib/i18n.ts')
if (!locales.includes(locale)) throw new Error(`The URL must end in a locale (${locales.join(', ')}): ${root}`)
const other = locales.find((l) => l !== locale)
const { hand } = await load(`content/${locale}/hand.ts`)
const { site } = await load(`content/${locale}/site.ts`)
const { notFound } = await load(`content/${locale}/pages/not-found.ts`)
const cardTitle = (id) => hand.cards[id].title
const url = (path) => new URL(path.replace(/^\//, ''), root).href
/** The site root (the language choice), one level above the locale. */
const siteRoot = new URL('..', root).href
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
    ({ motion, firstVisit, locale }) => {
      try {
        if (motion === 'calm') localStorage.setItem('motion', 'calm')
        if (!firstVisit) sessionStorage.setItem('table-drawn', '1')
        // The 404 page picks the stored language: keep it on the locale under test.
        localStorage.setItem('locale', locale)
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
    { motion, firstVisit, locale },
  )
  const page = await context.newPage()
  const errors = []
  page.on('pageerror', (e) => errors.push(e.message))
  page.on('console', (m) => {
    // The deliberate 404 pages (an unknown address, the removed routes) log their own status.
    if (m.type() !== 'error' || /GPU stall|GL Driver/.test(m.text())) return
    if (m.text().includes('404') && /no-such-page|more-projects|contact/.test(m.location().url)) return
    errors.push(`${m.text()} (${m.location().url})`)
  })
  return { context, page, errors }
}

/**
 * Average colour of the background field in a screen region (decoded in the
 * page; works for the WebGL field). The page content and header are hidden
 * for the shot, so a hero image never lands in the sample (the sampled
 * regions stay clear of the hand).
 */
async function regionColour(page, clip) {
  await page
    .addStyleTag({ content: 'main, header, footer { visibility: hidden !important; }' })
    .then((tag) => tag.evaluate((el) => (el.id = 'smoke-field-only')))
  const png = (await page.screenshot({ clip })).toString('base64')
  await page.evaluate(() => document.getElementById('smoke-field-only')?.remove())
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
          title: () => document.querySelector('h1 .wt-word > span'),
          label: () => document.querySelector('.home-label'),
          lines: () => document.querySelector('.home-role .rv-line') ?? document.querySelector('.home-role'),
          divider: () => document.querySelector('.home-bring-rule'),
          items: () => document.querySelector('.home-bring-list li:last-child'),
          cards: () => document.querySelector('.hand-fan .hand-card[data-drawn]'),
          chrome: () => document.querySelector('[data-chrome]'),
        }
        // Effective opacity: the reveal may hide an ancestor (the h1) while its words wait.
        const opacity = (el) => {
          let o = 1
          for (let e = el; e && e.nodeType === 1; e = e.parentElement) o *= Number(getComputedStyle(e).opacity)
          return o
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
              if (onScreen && opacity(el) > 0.3) seen[k] = Math.round(t)
            }
          }
          if (Object.keys(seen).length === Object.keys(parts).length || t > 6000) resolve(seen)
          else requestAnimationFrame(tick)
        }
        tick()
      }),
  )
  const keys = ['title', 'label', 'lines', 'divider', 'items', 'cards', 'chrome']
  const order = keys.map((k) => `${k} ${times[k] ?? '-'}ms`).join(', ')
  if (motion === 'reduced')
    check(
      'home first visit: everything shows (reduced)',
      keys.every((k) => k in times),
      order,
    )
  else {
    // Name, label, role and intro, divider, items, then the hand, then the chrome (a frame of slack).
    const inOrder = keys.every((k, i) => k in times && (i === 0 || times[keys[i - 1]] <= times[k] + 20))
    check(`home first visit (${motion}): name, label, lines, divider, items, hand, chrome`, inOrder, order)
    const span = times.chrome - times.title
    const full = motion === 'full' ? [1500, 2700] : [800, 1800]
    check(`home first visit: about 2 s (${motion}: x0.6)`, span > full[0] && span < full[1], `${span}ms`)
  }
  await wait(page, 1600)
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
  const handNav = `nav[aria-label="${hand.labels.nav}"]`
  check(
    `hand: four card links in nav "${hand.labels.nav}"`,
    (await page.locator(`${handNav} a.hand-card`).count()) === 4,
  )
  check('hand: no face-down deck', (await page.locator('.hand-deck').count()) === 0)
  check('home: no card counter', (await page.locator('.hand-counter').count()) === 0)
  check('hand: one tab stop', (await page.locator(`${handNav} [data-roving][tabindex="0"]`).count()) === 1)
  const screen = await page.evaluate(() => ({
    height: document.documentElement.scrollHeight,
    vh: innerHeight,
    footer: document.querySelectorAll('footer').length,
    hint: document.querySelector('.home-hint')?.getBoundingClientRect().bottom ?? 0,
    hand: Math.min(...[...document.querySelectorAll('.hand-fan .hand-card')].map((c) => c.getBoundingClientRect().top)),
  }))
  check(
    'home: one screen, no scroll, no footer',
    screen.height <= screen.vh && screen.footer === 0,
    JSON.stringify(screen),
  )
  check('home: content clears the hand', screen.hint <= screen.hand, JSON.stringify(screen))
  const links = await page.evaluate(() =>
    [...document.querySelectorAll('header a:not([data-locale-switcher] a)')].map((a) => a.textContent.trim()),
  )
  check(
    `header: home slot and ${site.header.about} only (plus the language switcher)`,
    links.length === 2 && links.includes(site.header.about),
    links.join(' | '),
  )
  const calm = await page.evaluate(() => {
    const sw = document.querySelector('[data-calm-switch]')
    return {
      checked: sw?.getAttribute('aria-checked'),
      disabled: sw?.disabled,
      motion: document.documentElement.dataset.motion,
    }
  })
  check(
    `calm switch: ${motion === 'full' ? 'off' : motion === 'calm' ? 'on' : 'on and disabled'}`,
    calm.checked === String(motion !== 'full') && calm.disabled === (motion === 'reduced'),
    JSON.stringify(calm),
  )

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
  check(
    'play: the home slot shows Back',
    (await page.locator('header [data-slot-mode="back"]').count()) === 1 &&
      (await page.locator('header [data-slot-mode="back"]').textContent()).includes(site.header.back),
  )
  check('play: title announced', (await live(page)).includes(cardTitle('team-of-teams')))
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
  check(
    'return: the home slot shows the wordmark',
    (await page.locator('header [data-slot-mode="mark"]').count()) === 1,
  )
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
  vts = await page.evaluate(() => window.__vts)
  check(
    'browser back: the card zooms in from its slot (view transition)',
    vts.at(-1)?.types.includes('play') && vts.at(-1)?.ok === true,
    JSON.stringify(vts.at(-1)),
  )
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
  vts = await page.evaluate(() => window.__vts)
  check(
    'browser back again: "switch" view transition',
    vts.at(-1)?.types.includes('switch'),
    JSON.stringify(vts.at(-1)),
  )
  await page.goForward()
  await page.waitForURL(/front-door/, { timeout: 4000 })
  await wait(page, 1200)
  check('browser forward still works after the replay', await page.locator('h1').isVisible())

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

  // About: the old portfolio's contour field (live), or its poster (reduced); one still frame at rest.
  await page.goto(url('/about/'), { waitUntil: 'networkidle' })
  await wait(page, 2500)
  const topo = await page.evaluate(
    () =>
      new Promise((resolve) => {
        const field = document.querySelector('.field')
        const gl = document.querySelector('.field-canvas').getContext('webgl2')
        let frames = 0
        const draw = gl.drawArrays.bind(gl)
        gl.drawArrays = (...a) => (frames++, draw(...a))
        setTimeout(
          () =>
            resolve({
              renderer: document.documentElement.dataset.renderer,
              topo: field.hasAttribute('data-topo'),
              poster:
                field.hasAttribute('data-poster') &&
                getComputedStyle(field.querySelector('.field-poster')).opacity === '1',
              heightmap: performance.getEntriesByType('resource').some((e) => e.name.includes('/terrain/region.webp')),
              frames,
              attribution: document.querySelector('footer')?.textContent ?? '',
            }),
          1500,
        )
      }),
  )
  if (motion === 'reduced')
    check(
      'about: the region poster (reduced), no heightmap',
      topo.poster && !topo.heightmap,
      JSON.stringify({ ...topo, attribution: 0 }),
    )
  else
    check(
      'about: live contours from the region heightmap, no poster',
      topo.renderer === 'gl' && topo.topo && topo.heightmap && !topo.poster,
      JSON.stringify({ ...topo, attribution: 0 }),
    )
  check('about: no frames at rest', topo.frames === 0, String(topo.frames))
  // The contours (live or poster) are on screen: the old ground #1B1C18 with stone-grey lines.
  const ground = await regionColour(
    page,
    device === 'desktop' ? { x: 900, y: 300, width: 300, height: 200 } : { x: 40, y: 300, width: 300, height: 200 },
  )
  check(
    'about: the contour field is drawn (ground and lines)',
    ground.every((v, i) => Math.abs(v - [31, 32, 28][i]) < 10),
    `${ground}`,
  )
  check(
    'about: swisstopo attribution in the footer',
    topo.attribution.includes('swissALTI3D') && topo.attribution.includes('swisstopo'),
  )
  const about = await page.evaluate(() => ({
    projects: document.querySelectorAll('#projects .project').length,
    interactive: document.querySelectorAll('#projects a, #projects button, #projects [tabindex]').length,
    contact: Boolean(document.querySelector('#contact a[href^="mailto:"]')),
  }))
  check(
    'about: 13 projects, nothing interactive, contact chapter',
    about.projects === 13 && about.interactive === 0 && about.contact,
    JSON.stringify(about),
  )

  // Removed routes are gone (the 404 page answers).
  for (const gone of ['/more-projects/', '/contact/']) {
    await page.goto(url(gone), { waitUntil: 'networkidle' })
    check(`${gone} removed`, (await page.locator('h1').textContent()).includes(notFound.title))
  }

  // Pages and reveals: nothing in the first viewport stays hidden.
  for (const p of ['/', '/work/front-door/', '/management/', '/about/', '/no-such-page/']) {
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
  check(`404: "${notFound.title}"`, (await page.locator('h1').textContent()).includes(notFound.title))

  check('no page errors', errors.length === 0, errors.slice(0, 3).join(' | '))
  await context.close()
}

/**
 * Locales: the root picks the language (a stored choice, then navigator.languages; other languages
 * English, none German) and replaces the URL; without JavaScript it links both. The 404 page picks
 * the same way at the unknown address. Every page carries <html lang> and hreflang alternates. The
 * switcher ("DE · EN") opens the same page in the other language: a "locale" cross-fade (never a
 * card transition, never the home intro), the field and the motion tier untouched, the reading
 * position and the switcher's focus kept, the choice stored; 44 px targets on phones.
 */
async function localeSuite(browser, device) {
  const target = (path) => new URL(path).pathname.slice(new URL(siteRoot).pathname.length)
  async function choose({ lang, languages, stored }) {
    const context = await browser.newContext({ ...viewports[device], ...(lang ? { locale: lang } : {}) })
    await context.addInitScript(
      ({ languages, stored }) => {
        if (languages) Object.defineProperty(navigator, 'languages', { get: () => languages })
        if (stored) localStorage.setItem('locale', stored)
      },
      { languages, stored },
    )
    const page = await context.newPage()
    await page.goto(siteRoot, { waitUntil: 'networkidle' })
    const landed = target(page.url())
    await context.close()
    return landed
  }
  const cases = [
    ['browser de-CH', { lang: 'de-CH' }, 'de/'],
    ['browser en-US', { lang: 'en-US' }, 'en/'],
    ['browser fr-FR', { lang: 'fr-FR' }, 'en/'],
    ['no browser language', { lang: 'en-US', languages: [] }, 'de/'],
    ['stored en over de-CH', { lang: 'de-CH', stored: 'en' }, 'en/'],
    ['stored de over en-US', { lang: 'en-US', stored: 'de' }, 'de/'],
  ]
  for (const [name, opts, want] of cases) {
    const got = await choose(opts)
    check(`root: ${name} opens /${want}`, got === want, got)
  }
  {
    const context = await browser.newContext({ ...viewports[device], javaScriptEnabled: false })
    const page = await context.newPage()
    await page.goto(siteRoot)
    const hrefs = await page.evaluate(() =>
      [...document.querySelectorAll('a[hreflang]')].map((a) => a.getAttribute('href')),
    )
    check(
      'root without JavaScript: plain links to both languages',
      locales.every((l) => hrefs.some((h) => h.endsWith(`/${l}/`))),
      hrefs.join(' '),
    )
    await context.close()
  }
  for (const [lang, want] of [
    ['de-CH', 'de'],
    ['en-US', 'en'],
  ]) {
    const context = await browser.newContext({ ...viewports[device], locale: lang })
    const page = await context.newPage()
    await page.goto(new URL('no-such-page/', siteRoot).href, { waitUntil: 'networkidle' })
    const { notFound: lost } = await load(`content/${want}/pages/not-found.ts`)
    const seen = await page.evaluate(() => ({
      lang: document.documentElement.lang,
      h1: document.querySelector('h1')?.textContent ?? '',
    }))
    check(
      `404 (${lang}): ${want}, the address kept`,
      seen.lang === want && seen.h1.includes(lost.title) && page.url().endsWith('/no-such-page/'),
      JSON.stringify(seen),
    )
    await context.close()
  }

  // Every page in this locale: <html lang> and hreflang alternates to the same page.
  const { context, page, errors } = await newContext(browser, device)
  const pages = ['/', '/work/team-of-teams/', '/management/', '/about/']
  for (const p of pages) {
    await page.goto(url(p), { waitUntil: 'networkidle' })
    const head = await page.evaluate(() => ({
      lang: document.documentElement.lang,
      alternates: Object.fromEntries(
        [...document.querySelectorAll('link[rel="alternate"][hreflang]')].map((l) => [
          l.hreflang,
          new URL(l.href).pathname,
        ]),
      ),
    }))
    const page2 = (l) => `${new URL(siteRoot).pathname}${l}${p}`
    check(
      `${p}: <html lang="${locale}"> and hreflang de, en, x-default`,
      head.lang === locale &&
        locales.every((l) => head.alternates[l] === page2(l)) &&
        head.alternates['x-default'] === new URL(siteRoot).pathname,
      JSON.stringify(head),
    )
  }

  // The switcher, on home, a case study, Management and About: there and back.
  const titles = {}
  for (const l of locales) {
    const [{ hand: h }, { management: m }, { about: a }, { home: hm }] = await Promise.all([
      load(`content/${l}/hand.ts`),
      load(`content/${l}/pages/management.ts`),
      load(`content/${l}/pages/about.ts`),
      load(`content/${l}/pages/home.ts`),
    ])
    titles[l] = {
      '/': hm.title,
      '/work/team-of-teams/': h.cards['team-of-teams'].title,
      '/management/': m.title,
      '/about/': a.title,
    }
  }
  const tap = device === 'phone' ? page.tap.bind(page) : page.click.bind(page)
  if (device === 'phone') {
    const sizes = await page.evaluate(() =>
      [...document.querySelectorAll('[data-locale-switcher] a')].map((a) => {
        const r = a.getBoundingClientRect()
        return [Math.round(r.width), Math.round(r.height)]
      }),
    )
    check(
      'switcher: 44 px targets on phones',
      sizes.length === 2 && sizes.every(([w, h]) => w >= 44 && h >= 44),
      JSON.stringify(sizes),
    )
  }
  for (const p of pages) {
    await page.goto(url(p), { waitUntil: 'networkidle' })
    await wait(page, 600)
    if (p !== '/') {
      await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight * 0.4))
      await wait(page, 600)
    }
    const at = () =>
      page.evaluate(() => {
        const s = [...document.querySelectorAll('main [data-section]')]
          .filter((e) => e.getBoundingClientRect().top <= 64)
          .at(-1)
        return s?.dataset.section ?? null
      })
    const before = await page.evaluate(() => {
      document.querySelector('.field-canvas').__kept = true
      return { motion: document.documentElement.dataset.motion, field: document.documentElement.dataset.field ?? null }
    })
    const section = await at()
    const vtsBefore = (await page.evaluate(() => window.__vts)).length
    const current = await page.getAttribute(`[data-locale-switcher] a[data-locale="${locale}"]`, 'aria-current')
    await tap(`[data-locale-switcher] a[data-locale="${other}"]`)
    await page.waitForURL((u) => u.pathname.endsWith(`/${other}${p}`), { timeout: 4000 })
    await wait(page, 900)
    const after = await page.evaluate(() => ({
      lang: document.documentElement.lang,
      motion: document.documentElement.dataset.motion,
      field: document.documentElement.dataset.field ?? null,
      intro: document.documentElement.dataset.intro ?? null,
      kept: document.querySelector('.field-canvas').__kept === true,
      stored: localStorage.getItem('locale'),
      h1: document.querySelector('main h1')?.textContent ?? '',
      current: document.querySelector('[data-locale-switcher] [aria-current]')?.dataset.locale,
      focus: document.activeElement?.dataset?.locale ?? document.activeElement?.tagName,
      hidden: [...document.querySelectorAll('main [data-reveal]')].filter((el) => {
        const r = el.getBoundingClientRect()
        return r.top < innerHeight * 0.6 && r.bottom > 0 && r.width > 0 && Number(getComputedStyle(el).opacity) < 0.99
      }).length,
    }))
    const vts = (await page.evaluate(() => window.__vts)).slice(vtsBefore)
    check(
      `switch ${locale} → ${other} on ${p}: same page, "${titles[other][p]}", lang, choice stored`,
      after.lang === other &&
        after.h1.includes(titles[other][p]) &&
        after.stored === other &&
        current === 'page' &&
        after.current === other,
      JSON.stringify({ ...after, current }),
    )
    check(
      `switch on ${p}: one "locale" cross-fade, no card transition`,
      vts.length === 1 && vts[0].types.join() === 'locale' && vts[0].ok === true,
      JSON.stringify(vts),
    )
    check(
      `switch on ${p}: field and tier kept, no intro, on screen at once`,
      after.kept &&
        after.motion === before.motion &&
        after.field === before.field &&
        after.intro !== 'first' &&
        after.hidden === 0,
      JSON.stringify({ before, after }),
    )
    if (p !== '/')
      check(`switch on ${p}: reading position kept (${section})`, (await at()) === section, String(await at()))
    if (device === 'desktop')
      check(`switch on ${p}: focus stays on the switcher`, after.focus === other, String(after.focus))
    // And back, so the next page starts in this locale.
    await tap(`[data-locale-switcher] a[data-locale="${locale}"]`)
    await page.waitForURL((u) => u.pathname.endsWith(`/${locale}${p}`), { timeout: 4000 })
    await wait(page, 600)
  }
  // Browser back across a switch: the same page in the language before, a "locale" cross-fade again.
  await page.goto(url('/work/front-door/'), { waitUntil: 'networkidle' })
  await wait(page, 600)
  await tap(`[data-locale-switcher] a[data-locale="${other}"]`)
  await page.waitForURL((u) => u.pathname.endsWith(`/${other}/work/front-door/`), { timeout: 4000 })
  await wait(page, 900)
  const vtsSwitch = (await page.evaluate(() => window.__vts)).length
  await page.goBack()
  await page.waitForURL((u) => u.pathname.endsWith(`/${locale}/work/front-door/`), { timeout: 4000 })
  await wait(page, 1200)
  const backVts = (await page.evaluate(() => window.__vts)).slice(vtsSwitch)
  const backLang = await page.evaluate(() => document.documentElement.lang)
  check(
    'browser back across a switch: "locale" cross-fade, the language before',
    backLang === locale && backVts.length === 1 && backVts[0].types.join() === 'locale',
    JSON.stringify({ backLang, backVts }),
  )
  check('no page errors (locale)', errors.length === 0, errors.slice(0, 3).join(' | '))
  await context.close()
}

/**
 * Motion per tier on a case study: every reveal ends visible and still, no
 * will-change left, the deal scene pins only in full on desktop, the reading
 * hairline follows the scroll, and reduced motion never animates a transform.
 */
async function motionSuite(browser, device) {
  const { context, page, errors } = await newContext(browser, device)
  // Record every animated property under <main>, the hand and the header while the page runs.
  await context.addInitScript(() => {
    window.__props = new Set()
    const tick = () => {
      for (const a of document.getAnimations()) {
        const t = a.effect?.target
        if (!t?.closest?.('main, .hand, header')) continue
        for (const k of a.effect.getKeyframes())
          for (const [p, v] of Object.entries(k)) {
            if (['offset', 'easing', 'composite', 'computedOffset'].includes(p)) continue
            // A transform that goes nowhere (0px travel in calm / reduced tokens) is not movement.
            if (
              /^(transform|translate|scale|rotate)$/.test(p) &&
              /^(none|0(px)?( 0(px)?)*|1( 1)*|0deg)$/.test(String(v).trim())
            )
              continue
            window.__props.add(p)
          }
      }
      requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  })
  await page.goto(url('/work/team-of-teams/'), { waitUntil: 'networkidle' })
  await wait(page, 600)
  const deal = await page.evaluate(() => {
    const el = document.querySelector('[data-scene="deal"]')
    return el && { active: el.hasAttribute('data-scene-active'), ratio: el.offsetHeight / innerHeight }
  })
  if (deal) {
    if (motion === 'full' && device === 'desktop')
      check('deal scene: pinned 180svh stage (full, desktop)', deal.active && deal.ratio > 1.7, JSON.stringify(deal))
    else
      check(
        `deal scene: static row, cards stack (${motion}, ${device})`,
        !deal.active && deal.ratio < 1.5,
        JSON.stringify(deal),
      )
  }
  // Scroll the whole page like a reader.
  const height = await page.evaluate(() => document.documentElement.scrollHeight)
  for (let y = 0; y < height; y += 160) {
    await page.mouse.wheel(0, 160)
    await wait(page, 40)
  }
  await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight / 2))
  await wait(page, 2600)
  const rest = await page.evaluate(() => ({
    hidden: [...document.querySelectorAll('main [data-reveal]')]
      .filter((el) => !el.hasAttribute('data-revealed') || Number(getComputedStyle(el).opacity) < 0.99)
      .map((el) => el.dataset.reveal),
    willChange: [...document.querySelectorAll('main *')].filter((el) => el.style.willChange).length,
    moving: document
      .getAnimations()
      .filter(
        (a) =>
          a.playState === 'running' && a.timeline instanceof DocumentTimeline && !a.effect?.target?.closest?.('.field'),
      )
      .map((a) => a.effect?.target?.className || a.effect?.target?.tagName),
    progress: Number(
      getComputedStyle(document.querySelector('[data-reading-hairline]')).getPropertyValue('--reading-progress'),
    ),
    bar: (() => {
      const cs = getComputedStyle(document.querySelector('[data-reading-hairline] > *'))
      return { transform: cs.transform, clip: cs.clipPath }
    })(),
    props: [...window.__props],
  }))
  check('motion: every reveal ends visible after scrolling', rest.hidden.length === 0, rest.hidden.join(','))
  check('motion: no will-change left at rest', rest.willChange === 0, String(rest.willChange))
  check('motion: only the background moves at rest', rest.moving.length === 0, rest.moving.join(','))
  check('hairline: follows the scroll (mid page)', rest.progress > 0.2 && rest.progress < 0.8, String(rest.progress))
  const moves = rest.props.filter((p) => /transform|translate|scale|rotate|clipPath/.test(p))
  if (motion === 'reduced') {
    check('reduced: no transform or clip animated (opacity only)', moves.length === 0, rest.props.join(','))
    check(
      'reduced: hairline drawn with a clip, no transform',
      rest.bar.transform === 'none' && rest.bar.clip !== 'none',
      JSON.stringify(rest.bar),
    )
  } else check(`${motion}: reveals move (${moves.join(', ') || 'none'})`, moves.length > 0, rest.props.join(','))
  check('no page errors (motion)', errors.length === 0, errors.slice(0, 3).join(' | '))
  await context.close()
}

/**
 * This round's behaviour: the detail hero's order (title, summary, label, meta pairs left to
 * right), a return with the hero scrolled away (no morph, the card is dealt into its slot), and
 * the idle hint (home only, once per session, fades on the next key press).
 */
async function feedbackSuite(browser, device) {
  const { context, page, errors } = await newContext(browser, device)
  await page.goto(url('/work/front-door/'), { waitUntil: 'commit' })
  const seen = await page.evaluate(
    () =>
      new Promise((resolve) => {
        const parts = {
          title: () => document.querySelector('h1 .wt-word > span'),
          summary: () => document.querySelector('.case-hero-summary'),
          label: () => document.querySelector('.case-hero-meta'),
          pair1: () => document.querySelectorAll('.meta-pair')[0],
          pair2: () => document.querySelectorAll('.meta-pair')[1],
        }
        const opacity = (el) => {
          let o = 1
          for (let e = el; e && e.nodeType === 1; e = e.parentElement) o *= Number(getComputedStyle(e).opacity)
          return o
        }
        const t = {}
        const tick = () => {
          const field = document.querySelector('.field')
          if (field && getComputedStyle(field).position === 'fixed')
            for (const [k, get] of Object.entries(parts)) {
              const el = get()
              const r = el?.getBoundingClientRect()
              if (t[k] === undefined && r && r.top < innerHeight && opacity(el) > 0.3)
                t[k] = Math.round(performance.now())
            }
          if (Object.keys(t).length === Object.keys(parts).length || performance.now() > 5000) resolve(t)
          else requestAnimationFrame(tick)
        }
        tick()
      }),
  )
  const keys = ['title', 'summary', 'label', 'pair1', 'pair2'].filter((k) => k in seen)
  const order = keys.map((k) => `${k} ${seen[k]}ms`).join(', ')
  if (motion !== 'reduced')
    check(
      'detail hero: title, summary, label, then the meta pairs left to right',
      keys.length >= 3 && keys.every((k, i) => i === 0 || seen[keys[i - 1]] <= seen[k] + 20),
      order,
    )
  // Return with the hero scrolled away: no card morph, the card is back in its slot.
  await wait(page, 1500)
  await page.evaluate(() => scrollTo(0, 2400))
  await wait(page, 600)
  await page.keyboard.press('Escape')
  await page.waitForURL((u) => path({ url: () => u.href }) === '/', { timeout: 4000 })
  await wait(page, 1600)
  const back = await page.evaluate(() => {
    const card = document.querySelector('.hand-fan .hand-card[data-play="front-door"]')
    return {
      opacity: getComputedStyle(card).opacity,
      running: card.getAnimations().length,
      focused: document.activeElement === card,
    }
  })
  check(
    'return (hero scrolled away): the card is dealt into its slot',
    back.opacity === '1' && back.running === 0 && back.focused,
    JSON.stringify(back),
  )
  // The idle hint: ?idle shortens the wait to a second.
  await page.goto(url('/?idle'), { waitUntil: 'networkidle' })
  await wait(page, 3500)
  const hint = await page.evaluate(() => {
    const el = document.querySelector('.idle-hint')
    return (
      el && {
        ready: el.hasAttribute('data-ready'),
        hidden: el.getAttribute('aria-hidden'),
        opacity: getComputedStyle(el).opacity,
      }
    )
  })
  check(
    'idle hint: appears on home, decorative',
    hint?.ready && hint.hidden === 'true' && hint.opacity === '1',
    JSON.stringify(hint),
  )
  await page.keyboard.press('Shift')
  await wait(page, 700)
  check('idle hint: the next key press fades it out', (await page.locator('.idle-hint').count()) === 0)
  await page.goto(url('/?idle'), { waitUntil: 'networkidle' })
  await wait(page, 2500)
  check('idle hint: once per session', (await page.locator('.idle-hint').count()) === 0)
  check('no page errors (feedback)', errors.length === 0, errors.slice(0, 3).join(' | '))
  await context.close()
}

async function main() {
  const browser = await chromium.launch()
  for (const device of Object.keys(viewports)) {
    console.log(`\n# ${device} (${motion}, ${locale})`)
    await introSuite(browser, device)
    await tableSuite(browser, device)
    await feedbackSuite(browser, device)
    await motionSuite(browser, device)
    await localeSuite(browser, device)
  }
  await browser.close()
  console.log(failures ? `\n${failures} failed` : '\nall passed')
  process.exit(failures ? 1 : 0)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
