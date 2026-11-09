// Checks what the Content & Images session ships, against the real modules:
//   node scripts/images/check.mjs
// - the image registry: 12 photos, each with alt, photographer, photographerUrl
//   and pageUrl; every local rendition exists and the 2048 px JPEG matches the
//   recorded width and height
// - content counts: 3 case studies, 13 About projects (and the count line
//   agrees), 12 workshop methods; every image id the content names exists
// - the slim modules (content/hand.ts, content/site.ts) import only types
// - no placeholder copy ("To be written.", TODO) and no deleted legacy file
// Loads content/*.ts with Node's built-in type stripping (Node >= 22.18); a
// small resolve hook adds the ".ts" extensions and the @content/ and @/ aliases.
import { existsSync, readFileSync } from 'node:fs'
import { register } from 'node:module'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'

const root = process.cwd()
const hooks = `
import { existsSync } from 'node:fs'
import { fileURLToPath, pathToFileURL } from 'node:url'
const root = ${JSON.stringify(root)}
export async function resolve(specifier, context, next) {
  let s = specifier
  if (s.startsWith('@content/')) s = pathToFileURL(root + '/content/' + s.slice(9)).href
  else if (s.startsWith('@/')) s = pathToFileURL(root + '/src/' + s.slice(2)).href
  if ((s.startsWith('.') || s.startsWith('file:')) && !/\\.[cm]?[jt]sx?$/.test(s) && context.parentURL) {
    for (const ext of ['.ts', '.tsx', '/index.ts']) {
      const url = new URL(s + ext, context.parentURL)
      if (existsSync(fileURLToPath(url))) return next(url.href, context)
    }
  }
  return next(s, context)
}`
register(`data:text/javascript,${encodeURIComponent(hooks)}`, pathToFileURL(join(root, 'package.json')))

const { content, images } = await import(pathToFileURL(join(root, 'content/index.ts')).href)
const { default: sharp } = await import('sharp')

const failures = []
const check = (ok, message) => {
  if (!ok) failures.push(message)
}
const eq = (what, actual, expected) => check(actual === expected, `${what}: expected ${expected}, found ${actual}`)

// Content counts
eq('caseStudies', content.caseStudies.length, 3)
eq('about.projects.items', content.about.projects.items.length, 13)
eq('workshopMethods.methods', content.workshopMethods.methods.length, 12)
const years = content.about.projects.items.map((p) => Number(p.year))
eq(
  'about.projects.intro',
  content.about.projects.intro,
  `${content.about.projects.items.length} projects · ${Math.min(...years)}–${Math.max(...years)}`,
)

// Image registry
const entries = Object.entries(images)
const photos = entries.filter(([, e]) => e.kind === 'photo')
eq('images', entries.length, 12)
eq('photos (kind "photo")', photos.length, 12)
for (const [id, e] of photos) {
  check(typeof e.alt === 'string' && e.alt.trim().length > 0, `${id}: alt is empty`)
  check(Boolean(e.photographer), `${id}: no photographer`)
  check(
    /^https:\/\/unsplash\.com\/@[\w.-]+$/.test(e.photographerUrl ?? ''),
    `${id}: photographerUrl "${e.photographerUrl}"`,
  )
  check(/^https:\/\/unsplash\.com\/photos\/[\w-]+$/.test(e.pageUrl ?? ''), `${id}: pageUrl "${e.pageUrl}"`)
  check(/^#[0-9A-F]{6}$/i.test(e.placeholder ?? ''), `${id}: placeholder "${e.placeholder}"`)
  check(Boolean(e.local || e.remote), `${id}: neither local nor remote`)
  if (e.local) {
    const ext = { avif: 'avif', webp: 'webp', jpeg: 'jpg' }
    for (const w of e.local.widths)
      for (const f of e.local.formats) {
        const file = join(root, 'public/images', `${id}-${w}.${ext[f]}`)
        check(existsSync(file), `${id}: missing ${file}`)
      }
    const largest = join(root, 'public/images', `${id}-${Math.max(...e.local.widths)}.jpg`)
    if (existsSync(largest)) {
      const m = await sharp(largest).metadata()
      check(
        m.width === e.width && m.height === e.height,
        `${id}: recorded ${e.width}×${e.height}, file ${m.width}×${m.height}`,
      )
    }
  }
}

// Every image id the content names exists
const named = []
const walk = (value, path) => {
  if (Array.isArray(value)) value.forEach((v, i) => walk(v, `${path}[${i}]`))
  else if (value && typeof value === 'object')
    for (const [k, v] of Object.entries(value)) {
      if ((k === 'image' || k === 'heroImage') && typeof v === 'string') named.push([path + '.' + k, v])
      walk(v, `${path}.${k}`)
    }
  else if (typeof value === 'string')
    check(!/To be written|\bTODO\b|\bTBD\b/.test(value), `${path}: placeholder copy "${value.slice(0, 60)}"`)
}
walk(content, 'content')
for (const [path, id] of named) check(id in images, `${path}: unknown image "${id}"`)

// Slim modules import only types (D7)
for (const file of ['content/hand.ts', 'content/site.ts']) {
  const imports = readFileSync(join(root, file), 'utf8').match(/^import .*$/gm) ?? []
  for (const line of imports) check(/^import type /.test(line), `${file} has a value import: ${line}`)
}

// Deleted legacy files stay deleted
for (const file of [
  'content/site.json',
  'content/case-studies.json',
  'content/projects.json',
  'content/workshops.json',
  'content/about.mdx',
  'content/management.mdx',
  'content/work',
  'content/adapters.ts',
  'content/cards.ts',
  'content/pages/more-projects.ts',
  'content/pages/contact.ts',
  'public/topo',
  'scripts/topo',
])
  check(!existsSync(join(root, file)), `${file} still exists`)

if (failures.length) {
  console.error(`check failed (${failures.length}):\n- ${failures.join('\n- ')}`)
  process.exit(1)
}
console.log(
  `ok: ${content.caseStudies.length} case studies, ${content.about.projects.items.length} About projects, ` +
    `${content.workshopMethods.methods.length} workshop methods, ${photos.length} photos with credits, ` +
    `${named.length} image references, slim modules type-only`,
)
