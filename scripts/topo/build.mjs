#!/usr/bin/env node
/*
 * About topography assets (no dependencies). Writes public/topo/:
 *   elevation.png  512x512 RGBA: elevation = min + (R * 256 + G) * 0.5 m,
 *                  B = lake mask (255), A = 255. Row 0 = north.
 *   contours.svg   static fallback: 100 m contours, 500 m index contours,
 *                  lakes as flat shapes (target <= 120 KB gzipped)
 *   meta.json      range, box, intervals, and whether this is the placeholder
 *
 * Real data (see README.md and build.sh, which run GDAL first):
 *   node scripts/topo/build.mjs --raw scripts/topo/work/dem512.bin --contours scripts/topo/work/contours.geojson
 * Placeholder (clearly labelled, noise-generated):
 *   node scripts/topo/build.mjs --placeholder
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { deflateSync, gzipSync } from 'node:zlib'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..')
const OUT = join(ROOT, 'public/topo')
const SIZE = 512
// LV95 (EPSG:2056) box: E 2624000-2646000, N 1152000-1174000 (22 x 22 km).
const BOX = { e0: 2624000, e1: 2646000, n0: 1152000, n1: 1174000 }
const SPAN = BOX.e1 - BOX.e0
const INTERVAL = 100
const INDEX = 500
// Lakes are flat: Lake Thun at <= 558 m (west of Interlaken), Lake Brienz at <= 564.5 m (east).
const LAKES = [
  { maxElevation: 558, west: BOX.e0, east: 2632600 },
  { maxElevation: 564.5, west: 2632600, east: BOX.e1 },
]
const MIN_LAKE_CELLS = 400
/** Elevation step of the PNG encoding (m). */
const STEP = 0.5

const args = process.argv.slice(2)
const arg = (name) => {
  const i = args.indexOf(`--${name}`)
  return i >= 0 ? args[i + 1] : undefined
}
const placeholder = args.includes('--placeholder')
if (!placeholder && !arg('raw')) {
  console.error('Usage: build.mjs --placeholder | --raw <dem512.bin> [--contours <contours.geojson>]')
  process.exit(1)
}

/* ---------------------------------------------------------------- grid */

/** Placeholder terrain: seeded value-noise fbm and ridges around two lake basins. */
function placeholderGrid() {
  let seed = 20262
  const rand = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296
  const P = 64
  const lattice = Float64Array.from({ length: P * P }, rand)
  const at = (x, y) => lattice[(((y % P) + P) % P) * P + (((x % P) + P) % P)]
  const smooth = (t) => t * t * (3 - 2 * t)
  const noise = (x, y) => {
    const xi = Math.floor(x)
    const yi = Math.floor(y)
    const u = smooth(x - xi)
    const v = smooth(y - yi)
    const a = at(xi, yi) + (at(xi + 1, yi) - at(xi, yi)) * u
    const b = at(xi, yi + 1) + (at(xi + 1, yi + 1) - at(xi, yi + 1)) * u
    return a + (b - a) * v
  }
  const fbm = (x, y, o = 4) => {
    let s = 0
    let amp = 0.5
    let norm = 0
    for (let i = 0; i < o; i++) {
      s += amp * noise(x, y)
      norm += amp
      x = x * 2.03 + 11.7
      y = y * 2.03 + 3.1
      amp *= 0.5
    }
    return s / norm
  }
  const grid = new Float32Array(SIZE * SIZE)
  for (let j = 0; j < SIZE; j++) {
    for (let i = 0; i < SIZE; i++) {
      const x = i / SIZE
      const y = j / SIZE
      // A valley running west to east a little north of centre holds two basins.
      const valley = Math.exp(-(((y - 0.38 - 0.06 * Math.sin(x * 5)) / 0.11) ** 2))
      const ridges = 1 - Math.abs(fbm(x * 3.2, y * 3.2) * 2 - 1)
      let h = 0.55 * fbm(x * 2.4 + 5, y * 2.4) + 0.45 * ridges ** 1.6
      h = h * (1 - 0.97 * valley) + 0.01
      grid[j * SIZE + i] = 500 + h * 1900
    }
  }
  return grid
}

function rawGrid(path) {
  const buf = readFileSync(path)
  if (buf.length !== SIZE * SIZE * 4)
    throw new Error(`${path}: expected ${SIZE}x${SIZE} float32 (${SIZE * SIZE * 4} bytes)`)
  const grid = new Float32Array(SIZE * SIZE)
  for (let k = 0; k < SIZE * SIZE; k++) grid[k] = buf.readFloatLE(k * 4)
  return grid
}

const grid = placeholder ? placeholderGrid() : rawGrid(arg('raw'))

/* ---------------------------------------------------------------- lakes */

const eastingOf = (i) => BOX.e0 + ((i + 0.5) / SIZE) * SPAN
const lake = new Uint8Array(SIZE * SIZE)
for (let j = 0; j < SIZE; j++) {
  for (let i = 0; i < SIZE; i++) {
    const e = eastingOf(i)
    const h = grid[j * SIZE + i]
    if (LAKES.some((l) => e >= l.west && e < l.east && h <= l.maxElevation)) lake[j * SIZE + i] = 1
  }
}
// Keep only large connected basins; flatten them to their lake level.
{
  const seen = new Uint8Array(SIZE * SIZE)
  for (let k = 0; k < SIZE * SIZE; k++) {
    if (!lake[k] || seen[k]) continue
    const stack = [k]
    const cells = []
    seen[k] = 1
    while (stack.length) {
      const c = stack.pop()
      cells.push(c)
      const i = c % SIZE
      const j = (c / SIZE) | 0
      for (const [di, dj] of [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ]) {
        const ni = i + di
        const nj = j + dj
        if (ni < 0 || nj < 0 || ni >= SIZE || nj >= SIZE) continue
        const n = nj * SIZE + ni
        if (lake[n] && !seen[n]) {
          seen[n] = 1
          stack.push(n)
        }
      }
    }
    const keep = cells.length >= MIN_LAKE_CELLS
    const level = Math.max(...cells.map((c) => grid[c]))
    for (const c of cells) {
      if (keep) grid[c] = level
      else lake[c] = 0
    }
  }
}

// A light blur (two separable 1-2-1 passes) keeps the contours calm; lakes stay flat.
{
  const tmp = new Float32Array(SIZE * SIZE)
  const at = (f, i, j) => f[Math.min(SIZE - 1, Math.max(0, j)) * SIZE + Math.min(SIZE - 1, Math.max(0, i))]
  for (let pass = 0; pass < 2; pass++) {
    for (let j = 0; j < SIZE; j++)
      for (let i = 0; i < SIZE; i++)
        tmp[j * SIZE + i] = (at(grid, i - 1, j) + 2 * at(grid, i, j) + at(grid, i + 1, j)) / 4
    for (let j = 0; j < SIZE; j++)
      for (let i = 0; i < SIZE; i++) {
        const k = j * SIZE + i
        if (!lake[k]) grid[k] = (at(tmp, i, j - 1) + 2 * at(tmp, i, j) + at(tmp, i, j + 1)) / 4
      }
  }
}

let min = Infinity
let max = -Infinity
for (const h of grid) {
  if (h < min) min = h
  if (h > max) max = h
}
min = Math.floor(min)
max = Math.ceil(max)

/* ---------------------------------------------------------------- PNG */

const crcTable = Array.from({ length: 256 }, (_, n) => {
  let c = n
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
  return c >>> 0
})
const crc32 = (buf) => {
  let c = 0xffffffff
  for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}
const chunk = (type, data) => {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(body))
  return Buffer.concat([len, body, crc])
}
function png(width, height, rgba) {
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0)
  ihdr.writeUInt32BE(height, 4)
  ihdr.writeUInt8(8, 8) // bit depth
  ihdr.writeUInt8(6, 9) // RGBA
  // Per row, the PNG filter (none / sub / up / average / paeth) with the smallest residuals.
  const stride = width * 4
  const raw = Buffer.alloc((stride + 1) * height)
  const paeth = (a, b, c) => {
    const p = a + b - c
    const pa = Math.abs(p - a)
    const pb = Math.abs(p - b)
    const pc = Math.abs(p - c)
    return pa <= pb && pa <= pc ? a : pb <= pc ? b : c
  }
  const row = Buffer.alloc(stride)
  for (let y = 0; y < height; y++) {
    let best = null
    let bestScore = Infinity
    for (let f = 0; f < 5; f++) {
      let score = 0
      for (let x = 0; x < stride; x++) {
        const cur = rgba[y * stride + x]
        const left = x >= 4 ? rgba[y * stride + x - 4] : 0
        const up = y > 0 ? rgba[(y - 1) * stride + x] : 0
        const ul = x >= 4 && y > 0 ? rgba[(y - 1) * stride + x - 4] : 0
        const pred = [0, left, up, (left + up) >> 1, paeth(left, up, ul)][f]
        const v = (cur - pred) & 255
        row[x] = v
        score += v < 128 ? v : 256 - v
      }
      if (score < bestScore) {
        bestScore = score
        best = [f, Buffer.from(row)]
      }
    }
    raw[y * (stride + 1)] = best[0]
    best[1].copy(raw, y * (stride + 1) + 1)
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

const rgba = Buffer.alloc(SIZE * SIZE * 4)
for (let k = 0; k < SIZE * SIZE; k++) {
  // Half-metre steps above min: plenty for 100 m contours, and it compresses.
  const v = Math.min(65535, Math.round((grid[k] - min) / STEP))
  rgba[k * 4] = v >> 8
  rgba[k * 4 + 1] = v & 255
  rgba[k * 4 + 2] = lake[k] ? 255 : 0
  rgba[k * 4 + 3] = 255
}

/* ---------------------------------------------------------------- contours */

/** Marching squares at `level` over a SIZE x SIZE field; returns polylines in grid units. */
function isolines(field, level) {
  const segs = []
  const v = (i, j) => field[j * SIZE + i]
  const lerp = (a, b) => (level - a) / (b - a)
  for (let j = 0; j < SIZE - 1; j++) {
    for (let i = 0; i < SIZE - 1; i++) {
      const a = v(i, j)
      const b = v(i + 1, j)
      const c = v(i + 1, j + 1)
      const d = v(i, j + 1)
      const code = (a >= level ? 8 : 0) | (b >= level ? 4 : 0) | (c >= level ? 2 : 0) | (d >= level ? 1 : 0)
      if (code === 0 || code === 15) continue
      const top = [i + lerp(a, b), j]
      const right = [i + 1, j + lerp(b, c)]
      const bottom = [i + lerp(d, c), j + 1]
      const left = [i, j + lerp(a, d)]
      const add = (p, q) => segs.push([p, q])
      switch (code) {
        case 1:
        case 14:
          add(left, bottom)
          break
        case 2:
        case 13:
          add(bottom, right)
          break
        case 3:
        case 12:
          add(left, right)
          break
        case 4:
        case 11:
          add(top, right)
          break
        case 6:
        case 9:
          add(top, bottom)
          break
        case 7:
        case 8:
          add(left, top)
          break
        case 5:
          add(left, top)
          add(bottom, right)
          break
        case 10:
          add(top, right)
          add(left, bottom)
          break
      }
    }
  }
  // Join segments into polylines by shared endpoints.
  const key = (p) => `${p[0].toFixed(4)},${p[1].toFixed(4)}`
  const ends = new Map()
  segs.forEach((s, n) => {
    for (const p of s) {
      const k = key(p)
      ends.set(k, [...(ends.get(k) ?? []), n])
    }
  })
  const used = new Uint8Array(segs.length)
  const lines = []
  const extend = (line, from) => {
    for (;;) {
      const tail = line[line.length - 1]
      const next = (ends.get(key(tail)) ?? []).find((n) => !used[n])
      if (next === undefined) return line
      used[next] = 1
      const [p, q] = segs[next]
      line.push(key(p) === key(tail) ? q : p)
      if (from && key(line[line.length - 1]) === key(line[0])) return line
    }
  }
  segs.forEach((s, n) => {
    if (used[n]) return
    used[n] = 1
    const forward = extend([s[0], s[1]], true)
    const backward = extend([forward[0]], false).slice(1).reverse()
    lines.push([...backward, ...forward])
  })
  return lines
}

const toMetres = ([gx, gy]) => [((gx + 0.5) / SIZE) * SPAN, ((gy + 0.5) / SIZE) * SPAN]

/** Douglas-Peucker. */
function simplify(points, tolerance) {
  if (points.length < 3) return points
  const keep = new Uint8Array(points.length)
  keep[0] = keep[points.length - 1] = 1
  const stack = [[0, points.length - 1]]
  while (stack.length) {
    const [a, b] = stack.pop()
    const [x1, y1] = points[a]
    const [x2, y2] = points[b]
    const dx = x2 - x1
    const dy = y2 - y1
    const len = Math.hypot(dx, dy) || 1
    let far = -1
    let dist = tolerance
    for (let k = a + 1; k < b; k++) {
      const d = Math.abs(dy * points[k][0] - dx * points[k][1] + x2 * y1 - y2 * x1) / len
      if (d > dist) {
        dist = d
        far = k
      }
    }
    if (far >= 0) {
      keep[far] = 1
      stack.push([a, far], [far, b])
    }
  }
  return points.filter((_, k) => keep[k])
}

const lengthOf = (pts) =>
  pts.reduce((s, p, k) => (k ? s + Math.hypot(p[0] - pts[k - 1][0], p[1] - pts[k - 1][1]) : 0), 0)

/** Path data with relative moves, coordinates in tens of metres. */
function pathData(lines, closed = false) {
  let d = ''
  for (const pts of lines) {
    const q = pts.map(([x, y]) => [Math.round(x / 10), Math.round(y / 10)])
    d += `M${q[0][0]} ${q[0][1]}`
    let [px, py] = q[0]
    const nums = []
    for (let k = 1; k < q.length; k++) {
      const dx = q[k][0] - px
      const dy = q[k][1] - py
      if (!dx && !dy) continue
      nums.push(dx, dy)
      px = q[k][0]
      py = q[k][1]
    }
    // A minus sign separates numbers on its own.
    const out = nums.reduce((acc, n, k) => acc + (k === 0 || n < 0 ? `${n}` : ` ${n}`), 'l')
    d += out + (closed ? 'z' : '')
  }
  return d
}

let contourLines = [] // [{ elevation, points (metres) }]
const contoursPath = arg('contours')
if (contoursPath) {
  // gdal_contour GeoJSON in LV95: x = E - e0, y = n1 - N.
  const geo = JSON.parse(readFileSync(contoursPath, 'utf8'))
  for (const f of geo.features) {
    const elevation = f.properties.elev ?? f.properties.ELEV
    const parts = f.geometry.type === 'MultiLineString' ? f.geometry.coordinates : [f.geometry.coordinates]
    for (const part of parts) contourLines.push({ elevation, points: part.map(([e, n]) => [e - BOX.e0, BOX.n1 - n]) })
  }
} else {
  for (let level = Math.ceil(min / INTERVAL) * INTERVAL; level <= max; level += INTERVAL) {
    for (const line of isolines(grid, level)) contourLines.push({ elevation: level, points: line.map(toMetres) })
  }
}

const lakeField = Float32Array.from(lake)
const lakeLines = isolines(lakeField, 0.5).map((l) => simplify(l.map(toMetres), 25))

const normal = []
const index = []
for (const { elevation, points } of contourLines) {
  // Contours that run along a lake shore at lake level are drawn by the lake shape.
  const pts = simplify(points, 22)
  if (pts.length < 2 || lengthOf(pts) < 250) continue
  ;(elevation % INDEX === 0 ? index : normal).push(pts)
}

const W = SPAN / 10
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${W}" preserveAspectRatio="xMidYMid slice">
<!-- ${placeholder ? 'PLACEHOLDER: noise-generated terrain, not real data. Build the real map with scripts/topo/README.md.' : 'Contours derived from swissALTI3D. Source: Federal Office of Topography swisstopo.'} -->
<rect width="${W}" height="${W}" fill="#0B1A1C"/>
<path d="${pathData(lakeLines, true)}" fill="#081315" fill-rule="evenodd"/>
<g fill="none" stroke="#5FB3B0" stroke-linejoin="round" stroke-linecap="round" vector-effect="non-scaling-stroke">
<path d="${pathData(normal)}" stroke-opacity="0.22" stroke-width="1" vector-effect="non-scaling-stroke"/>
<path d="${pathData(index)}" stroke-opacity="0.38" stroke-width="1.5" vector-effect="non-scaling-stroke"/>
</g>
</svg>
`

const meta = {
  placeholder,
  source: placeholder
    ? 'Noise-generated placeholder (not real terrain)'
    : 'swissALTI3D 2 m, Federal Office of Topography swisstopo',
  crs: 'EPSG:2056',
  box: [BOX.e0, BOX.n0, BOX.e1, BOX.n1],
  size: SIZE,
  min,
  max,
  interval: INTERVAL,
  index: INDEX,
  lakes: LAKES.map((l) => l.maxElevation),
  step: STEP,
  encoding: 'elevation = min + (R * 256 + G) * step; B: lake mask (255); row 0 = north',
}

mkdirSync(OUT, { recursive: true })
writeFileSync(join(OUT, 'elevation.png'), png(SIZE, SIZE, rgba))
writeFileSync(join(OUT, 'contours.svg'), svg)
writeFileSync(join(OUT, 'meta.json'), `${JSON.stringify(meta, null, 2)}\n`)
const gz = gzipSync(svg).length
console.log(
  `public/topo: ${placeholder ? 'PLACEHOLDER' : 'swissALTI3D'} ${min}-${max} m, ${normal.length + index.length} contours, ` +
    `${lakeLines.length} lake outlines, contours.svg ${(svg.length / 1024).toFixed(0)} KB (${(gz / 1024).toFixed(0)} KB gzipped)`,
)
if (gz > 120 * 1024) {
  console.error('contours.svg is over 120 KB gzipped: raise the simplify tolerance.')
  process.exit(1)
}
