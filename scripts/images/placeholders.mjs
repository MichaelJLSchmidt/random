// Writes the placeholder hero images listed in content/images.ts: soft
// gradients in each case study's colour identity, as WebP and JPEG at 640 and
// 1280 px wide (16:9). Run once: node scripts/images/placeholders.mjs
// Uses the pre-installed Chromium (Playwright) canvas encoder, so it needs no
// image library. Replace with real renditions in the content pass.
import { createRequire } from 'node:module'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const require = createRequire(import.meta.url)
const { chromium } = require('playwright')

const out = join(process.cwd(), 'public/images')
const entries = {
  'team-of-teams-hero': { field: '#2A0E0C', mid: '#7A1F17', glow: '#E2553D' },
  'shared-foundations-hero': { field: '#0A1A2B', mid: '#13406E', glow: '#3D8BDA' },
  'front-door-hero': { field: '#0C1F17', mid: '#1E5A3E', glow: '#3FAF7A' },
}
const widths = [640, 1280]
const formats = [
  ['webp', 'image/webp', 0.8],
  ['jpg', 'image/jpeg', 0.82],
]

mkdirSync(out, { recursive: true })
const browser = await chromium.launch()
const page = await browser.newPage()
for (const [id, c] of Object.entries(entries)) {
  for (const w of widths) {
    const h = Math.round((w * 9) / 16)
    for (const [ext, type, quality] of formats) {
      const data = await page.evaluate(
        async ({ w, h, c, type, quality }) => {
          const canvas = new OffscreenCanvas(w, h)
          const g = canvas.getContext('2d')
          g.fillStyle = c.field
          g.fillRect(0, 0, w, h)
          const pool = (x, y, r, colour, alpha) => {
            const grad = g.createRadialGradient(x, y, 0, x, y, r)
            grad.addColorStop(
              0,
              colour +
                Math.round(alpha * 255)
                  .toString(16)
                  .padStart(2, '0'),
            )
            grad.addColorStop(1, colour + '00')
            g.fillStyle = grad
            g.fillRect(0, 0, w, h)
          }
          pool(w * 0.18, h * 0.95, w * 0.75, c.mid, 0.9)
          pool(w * 0.22, h * 1.05, w * 0.42, c.glow, 0.45)
          pool(w * 0.86, h * 0.1, w * 0.5, c.mid, 0.35)
          const blob = await canvas.convertToBlob({ type, quality })
          const bytes = new Uint8Array(await blob.arrayBuffer())
          let s = ''
          for (const b of bytes) s += String.fromCharCode(b)
          return btoa(s)
        },
        { w, h, c, type, quality },
      )
      const file = join(out, `${id}-${w}.${ext}`)
      writeFileSync(file, Buffer.from(data, 'base64'))
      console.log(file)
    }
  }
}
await browser.close()
