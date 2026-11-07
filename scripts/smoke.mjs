// Behaviour checks in Chromium: navigation focus, return focus, settings, cards.
// Usage: node scripts/smoke.mjs <base-url> [--motion=full|calm|reduced]
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const { chromium } = require('playwright')
const [base = 'http://localhost:3000', ...flags] = process.argv.slice(2)
const flag = (name) =>
  flags
    .find((f) => f.startsWith(`--${name}=`))
    ?.split('=')
    .slice(1)
    .join('=')
const root = base.endsWith('/') ? base : `${base}/`
const motion = flag('motion') ?? 'full'

const browser = await chromium.launch()
const context = await browser.newContext({
  reducedMotion: motion === 'reduced' ? 'reduce' : 'no-preference',
  viewport: { width: 1280, height: 900 },
})
if (motion === 'calm')
  await context.addInitScript(() => localStorage.getItem('motion') || localStorage.setItem('motion', 'calm'))
const page = await context.newPage()
const errors = []
page.on('pageerror', (e) => errors.push(e.message))
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))

let failures = 0
const check = (name, ok, detail = '') => {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${name}${detail ? ` — ${detail}` : ''}`)
  if (!ok) failures++
}
const active = () =>
  page.evaluate(() => {
    const el = document.activeElement
    return el
      ? `${el.tagName.toLowerCase()}${el.getAttribute('data-return-focus') ? `[${el.getAttribute('data-return-focus')}]` : ''}:${(el.textContent ?? '').trim().slice(0, 40)}`
      : 'none'
  })

await page.goto(root, { waitUntil: 'networkidle' })
check(
  'pre-paint motion tier',
  (await page.getAttribute('html', 'data-motion')) === motion,
  await page.getAttribute('html', 'data-motion'),
)

// Weight-only hover: the link gets heavier but its box keeps its width.
const navLink = page.locator('header nav a').last()
const before = await navLink.boundingBox()
const w0 = await navLink.evaluate((el) => getComputedStyle(el).fontWeight)
await navLink.hover()
await page.waitForTimeout(400)
const after = await navLink.boundingBox()
const w1 = await navLink.evaluate((el) => getComputedStyle(el).fontWeight)
check(
  'nav hover animates weight without reflow',
  Number(w1) > Number(w0) && Math.abs(after.width - before.width) < 0.5,
  `weight ${w0}→${w1}, width ${before.width.toFixed(1)}→${after.width.toFixed(1)}`,
)
await page.mouse.move(0, 0)

// Keyboard: activate the first case-study link with Enter.
const firstCard = page.locator('[data-return-focus^="/work/"]').first()
const target = await firstCard.getAttribute('data-return-focus')
await firstCard.focus()
await page.keyboard.press('Enter')
await page.waitForURL((u) => u.pathname.replace(/\/$/, '').endsWith(target))
await page.waitForTimeout(900)
check('focus moves to page heading', (await active()).startsWith('h1:'), await active())
const reveal = await page.evaluate(() => {
  const el = document.querySelector('main h1 .reveal')
  return { words: el?.querySelectorAll('.split-word').length ?? 0, opacity: el ? getComputedStyle(el).opacity : null }
})
check(
  'heading reveal matches tier',
  reveal.opacity === '1' && (motion === 'full' ? reveal.words > 0 : reveal.words === 0),
  `${reveal.words} split words, opacity ${reveal.opacity}`,
)
const name = await page.evaluate(() => document.querySelector('main h1')?.textContent)
check('heading text read once', (await page.locator('main h1').getAttribute('aria-label')) === null && name.length > 0)

// Return via the back link: focus goes to the originating card.
await page.getByRole('link', { name: 'All case studies' }).click()
await page.waitForURL((u) => u.pathname === new URL(root).pathname)
await page.waitForTimeout(900)
check('focus returns to originating card', (await active()).includes(`[${target}]`), await active())

// Browser back/forward keeps working.
await page.goBack()
await page.waitForTimeout(900)
await page.goBack()
await page.waitForTimeout(900)
check('history back works', new URL(page.url()).pathname === new URL(root).pathname, page.url())

// Flip: button swaps faces; hidden face is inert; status announced politely.
await page.goto(`${root}work/timetable/`, { waitUntil: 'networkidle' })
const faceState = () =>
  page.evaluate(
    () =>
      [...document.querySelectorAll('[aria-controls] ~ *, .case-card [inert]')].length && {
        frontInert: document.querySelector('.case-card [id] > :first-child')?.hasAttribute('inert'),
        backInert: document.querySelector('.case-card [id] > :last-child')?.hasAttribute('inert'),
        live: document.querySelector('[role=status]')?.textContent,
      },
  )
await page.getByRole('button', { name: 'Show details' }).click()
await page.waitForTimeout(1200)
let st = await faceState()
check(
  'flip shows back face',
  st.frontInert === true && st.backInert === false && st.live === 'Showing details',
  JSON.stringify(st),
)
check('facts reachable after flip', await page.getByText('Formats').isVisible())
await page.getByRole('button', { name: 'Show cover' }).click()
await page.waitForTimeout(1200)
st = await faceState()
check('flip back to front', st.frontInert === false && st.backInert === true, JSON.stringify(st))

// Entrance: with the hand below the fold, cards are dealt in when scrolled into view.
const short = await context.newPage()
await short.setViewportSize({ width: 1280, height: 420 })
await short.goto(root, { waitUntil: 'networkidle' })
await short.waitForTimeout(600)
const slotTransforms = () =>
  short.$$eval('main ol > li > div', (els) => els.map((el) => getComputedStyle(el).transform))
const beforeScroll = await slotTransforms()
await short.locator('main ol').scrollIntoViewIfNeeded()
await short.waitForTimeout(1800)
const afterScroll = await slotTransforms()
const identity = (t) => t === 'none' || t === 'matrix(1, 0, 0, 1, 0, 0)'
check(
  'hand entrance matches tier',
  afterScroll.every(identity) && (motion === 'full' ? !beforeScroll.every(identity) : beforeScroll.every(identity)),
  `before ${beforeScroll.filter((t) => !identity(t)).length} moved, after ${afterScroll.filter((t) => !identity(t)).length} moved`,
)
await short.close()

// Foil: pointer writes CSS variables (full only); ambient drift runs only in full.
await page.goto(root, { waitUntil: 'networkidle' })
const middle = page.locator('main ol > li').nth(1).locator('[data-foil-surface]')
await middle.scrollIntoViewIfNeeded()
const box = await middle.boundingBox()
await page.mouse.move(box.x + box.width * 0.2, box.y + box.height * 0.6)
await page.mouse.move(box.x + box.width * 0.25, box.y + box.height * 0.65)
await page.waitForTimeout(200)
const foil = await middle.evaluate((el) => ({
  x: el.style.getPropertyValue('--foil-x'),
  play: getComputedStyle(el.querySelector('[data-foil-layer]'), '::before').animationPlayState,
}))
check(
  'foil follows pointer and drifts per tier',
  motion === 'full' ? foil.x !== '' && foil.play === 'running' : foil.x === '' && foil.play === 'paused',
  JSON.stringify(foil),
)
const tilt = await middle.evaluate((el) => getComputedStyle(el).transform)
const flat = (t) =>
  t === 'none' ||
  /^matrix\(1, 0, 0, 1, 0, 0\)$/.test(t) ||
  /^matrix3d\(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1\)$/.test(t)
check('pointer tilt only in full tier', motion === 'full' ? !flat(tilt) : flat(tilt), tilt.slice(0, 40))
await page.mouse.move(0, 0)

// Device orientation: opt-in switch on touch devices; nothing listens before the tap.
const phone = await browser.newContext({
  viewport: { width: 390, height: 844 },
  hasTouch: true,
  isMobile: true,
  permissions: ['accelerometer', 'gyroscope', 'magnetometer'],
  reducedMotion: motion === 'reduced' ? 'reduce' : 'no-preference',
})
if (motion === 'calm') await phone.addInitScript(() => localStorage.setItem('motion', 'calm'))
const mobile = await phone.newPage()
await mobile.goto(root, { waitUntil: 'networkidle' })
const tiltSwitch = mobile.getByRole('switch', { name: 'Tilt cards with device motion' })
const sendOrientation = () =>
  mobile.evaluate(() => {
    window.dispatchEvent(new DeviceOrientationEvent('deviceorientation', { alpha: 0, beta: 80, gamma: 35 }))
    return new Promise((r) =>
      requestAnimationFrame(() =>
        requestAnimationFrame(() => r(document.documentElement.style.getPropertyValue('--foil-x'))),
      ),
    )
  })
check('tilt switch shown on touch devices', (await tiltSwitch.count()) === 1)
check('no orientation listener before opt-in', (await sendOrientation()) === '')
if (motion === 'full') {
  await tiltSwitch.tap()
  await mobile.waitForTimeout(200)
  const x = await sendOrientation()
  check('orientation drives cards after opt-in', Number(x) > 0.5, `--foil-x ${x}`)
  await tiltSwitch.tap()
  check('switching off clears it', (await sendOrientation()) === '')
} else {
  check('tilt switch disabled outside full tier', await tiltSwitch.isDisabled())
}
await phone.close()

// Settings: native switches, applied to <html> at once and kept after reload.
const calmSwitch = page.getByRole('switch', { name: 'Calm motion' })
const foilSwitch = page.getByRole('switch', { name: 'Foil effect' })
check('settings switches exposed', (await calmSwitch.count()) === 1 && (await foilSwitch.count()) === 1)
if (motion === 'reduced') {
  check('calm switch locked under reduced motion', (await calmSwitch.isDisabled()) && (await calmSwitch.isChecked()))
} else {
  await calmSwitch.click()
  const flipped = motion === 'full' ? 'calm' : 'full'
  check('calm switch changes tier', (await page.getAttribute('html', 'data-motion')) === flipped)
  await page.reload({ waitUntil: 'networkidle' })
  check('calm choice survives reload (pre-paint)', (await page.getAttribute('html', 'data-motion')) === flipped)
  await page.getByRole('switch', { name: 'Calm motion' }).click()
}
await page.getByRole('switch', { name: 'Foil effect' }).click()
await page.waitForTimeout(150)
const off = await page.evaluate(() => ({
  attr: document.documentElement.dataset.foil,
  bg: getComputedStyle(document.querySelector('[data-foil-layer]'), '::before').backgroundImage,
  live: document.querySelector('[role=status]')?.textContent,
}))
check(
  'foil off falls back to flat accent',
  off.attr === 'off' && /^linear-gradient\(rgb\(185, 195, 255\)/.test(off.bg) && off.live === 'Foil effect off',
  JSON.stringify(off).slice(0, 140),
)
await page.getByRole('switch', { name: 'Foil effect' }).click()

// View transitions: record types and which pseudo-element groups animate.
await context.addInitScript(() => {
  window.__vt = []
  const original = document.startViewTransition?.bind(document)
  if (!original) return
  document.startViewTransition = (arg) => {
    const t = original(arg)
    const entry = { types: [...(arg?.types ?? [])], groups: [], durations: [] }
    window.__vt.push(entry)
    t.ready
      .then(() => {
        for (const a of document.getAnimations()) {
          const pe = a.effect?.pseudoElement ?? ''
          const m = pe.match(/::view-transition-group\((.+)\)/)
          if (m && !entry.groups.includes(m[1])) entry.groups.push(m[1])
          if (pe.startsWith('::view-transition')) entry.durations.push(a.effect.getComputedTiming().duration)
        }
      })
      .catch(() => {})
    return t
  }
})
const vtPage = await context.newPage()
const lastVT = async () => {
  await vtPage.waitForTimeout(900)
  return vtPage.evaluate(() => window.__vt.at(-1) ?? null)
}
const cardGroups = (vt) => (vt?.groups ?? []).filter((g) => g.startsWith('card-'))
await vtPage.goto(root, { waitUntil: 'networkidle' })
await vtPage.locator('a[data-return-focus$="/work/timetable"]').click()
let vt = await lastVT()
const maxDuration = (v) => Math.max(0, ...(v?.durations ?? []))
check(
  'card → case study: only that card morphs',
  vt?.types.join() === 'nav-forward,card-timetable' && cardGroups(vt).join() === 'card-timetable',
  JSON.stringify({ types: vt?.types, cards: cardGroups(vt), max: maxDuration(vt) }),
)
check(
  'transition durations follow tier',
  motion === 'reduced' ? maxDuration(vt) === 0 : maxDuration(vt) > 0,
  `max ${maxDuration(vt)}ms`,
)
await vtPage.locator('.pager a[href$="/work/ledger"], .pager a[href$="/work/ledger/"]').click()
vt = await lastVT()
check(
  'pager card → next case study morphs',
  vt?.types.join() === 'nav-forward,card-ledger' && cardGroups(vt).join() === 'card-ledger',
  JSON.stringify({ types: vt?.types, cards: cardGroups(vt) }),
)
await vtPage.getByRole('link', { name: 'All case studies' }).click()
vt = await lastVT()
check(
  'back link → home morphs back',
  vt?.types.join() === 'nav-back,card-ledger' && cardGroups(vt).join() === 'card-ledger',
  JSON.stringify({ types: vt?.types, cards: cardGroups(vt) }),
)
await vtPage.locator('header nav a').first().click()
vt = await lastVT()
check(
  'header link cross-fades, no morph',
  vt?.types.join() === 'nav-fade' && cardGroups(vt).length === 0,
  JSON.stringify({ types: vt?.types, groups: vt?.groups }),
)
await vtPage.close()

check('no page errors', errors.length === 0, errors.slice(0, 3).join(' | '))
await browser.close()
process.exit(failures ? 1 : 0)
