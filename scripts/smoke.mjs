// Behaviour checks in Chromium: navigation focus, return focus, settings, cards.
// Usage: node scripts/smoke.mjs <base-url> [--password=<gate password>] [--motion=full|calm|reduced]
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const { chromium } = require('playwright')
const [base = 'http://localhost:3000', ...flags] = process.argv.slice(2)
const flag = (name) => flags.find((f) => f.startsWith(`--${name}=`))?.split('=').slice(1).join('=')
const root = base.endsWith('/') ? base : `${base}/`
const motion = flag('motion') ?? 'full'

const browser = await chromium.launch()
const context = await browser.newContext({ reducedMotion: motion === 'reduced' ? 'reduce' : 'no-preference', viewport: { width: 1280, height: 900 } })
if (motion === 'calm') await context.addInitScript(() => localStorage.setItem('motion', 'calm'))
const page = await context.newPage()
const errors = []
page.on('pageerror', (e) => errors.push(e.message))
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))

let failures = 0
const check = (name, ok, detail = '') => {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${name}${detail ? ` — ${detail}` : ''}`)
  if (!ok) failures++
}
const active = () => page.evaluate(() => {
  const el = document.activeElement
  return el ? `${el.tagName.toLowerCase()}${el.getAttribute('data-return-focus') ? `[${el.getAttribute('data-return-focus')}]` : ''}:${(el.textContent ?? '').trim().slice(0, 40)}` : 'none'
})

if (flag('password')) {
  await page.goto(`${root}gate`)
  await page.fill('input[name=password]', flag('password'))
  await Promise.all([page.waitForURL((u) => !u.pathname.includes('gate')), page.click('button[type=submit]')])
}

await page.goto(root, { waitUntil: 'networkidle' })
check('pre-paint motion tier', (await page.getAttribute('html', 'data-motion')) === motion, await page.getAttribute('html', 'data-motion'))

// Keyboard: activate the first case-study link with Enter.
const firstCard = page.locator('[data-return-focus^="/work/"]').first()
const target = await firstCard.getAttribute('data-return-focus')
await firstCard.focus()
await page.keyboard.press('Enter')
await page.waitForURL((u) => u.pathname.replace(/\/$/, '').endsWith(target))
await page.waitForTimeout(900)
check('focus moves to page heading', (await active()).startsWith('h1:'), await active())

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

check('no page errors', errors.length === 0, errors.slice(0, 3).join(' | '))
await browser.close()
process.exit(failures ? 1 : 0)
