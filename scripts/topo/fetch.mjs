#!/usr/bin/env node
/*
 * Fetches swissALTI3D (2 m, Cloud Optimized GeoTIFF) for the About box from
 * swisstopo's open STAC API and averages it into the 512x512 grid that
 * build.mjs turns into public/topo/. Only each tile's internal 4 m overview is
 * read (HTTP range requests), about 120 MB in all; nothing is written but
 * scripts/topo/work/dem512.bin (raw float32, row 0 = north).
 *
 *   node scripts/topo/fetch.mjs && node scripts/topo/build.mjs --raw scripts/topo/work/dem512.bin
 *   (or: npm run topo)
 *
 * Source: Federal Office of Topography swisstopo, swissALTI3D (open data).
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { fromUrl } from 'geotiff'

const HERE = dirname(fileURLToPath(import.meta.url))
const OUT = join(HERE, 'work/dem512.bin')
const SIZE = 512
const BOX = { e0: 2624000, e1: 2646000, n0: 1152000, n1: 1174000 }
const SPAN = BOX.e1 - BOX.e0
const STAC = 'https://data.geo.admin.ch/api/stac/v0.9/collections/ch.swisstopo.swissalti3d/items'
// WGS84 bounds a little wider than the LV95 box; tiles are filtered by their LV95 id below.
const BBOX = '7.64,46.49,8.05,46.78'
const PARALLEL = 8

async function json(url) {
  for (let attempt = 0; ; attempt++) {
    try {
      const res = await fetch(url)
      if (!res.ok) throw new Error(`${res.status} ${url}`)
      return await res.json()
    } catch (e) {
      if (attempt >= 3) throw e
      await new Promise((r) => setTimeout(r, 1000 * 2 ** attempt))
    }
  }
}

/** One 2 m GeoTIFF per 1 km tile in the box (the most recent year). */
async function listTiles() {
  const latest = new Map()
  let url = `${STAC}?bbox=${BBOX}&limit=100`
  while (url) {
    const page = await json(url)
    for (const item of page.features) {
      const m = /_(\d{4})_(\d{4})-(\d{4})$/.exec(item.id)
      if (!m) continue
      const [, year, e, n] = m.map(Number)
      if (e * 1000 < BOX.e0 || e * 1000 >= BOX.e1 || n * 1000 < BOX.n0 || n * 1000 >= BOX.n1) continue
      const asset = Object.entries(item.assets).find(([k]) => /_2_2056_\d+\.tif$/.test(k))
      if (!asset) continue
      const key = `${e}-${n}`
      if (!latest.has(key) || latest.get(key).year < year) latest.set(key, { year, e, n, href: asset[1].href })
    }
    url = page.links.find((l) => l.rel === 'next')?.href
  }
  return [...latest.values()]
}

const sum = new Float64Array(SIZE * SIZE)
const count = new Uint32Array(SIZE * SIZE)

/** Reads a tile's smallest overview and adds every pixel to the grid cell it falls in. */
async function addTile({ e, n, href }) {
  for (let attempt = 0; ; attempt++) {
    try {
      const tiff = await fromUrl(href)
      const image = await tiff.getImage((await tiff.getImageCount()) - 1)
      const w = image.getWidth()
      const h = image.getHeight()
      const [raster] = await image.readRasters()
      const px = 1000 / w
      for (let y = 0; y < h; y++) {
        const north = n * 1000 + 1000 - (y + 0.5) * px
        const j = Math.floor(((BOX.n1 - north) / SPAN) * SIZE)
        for (let x = 0; x < w; x++) {
          const v = raster[y * w + x]
          if (!(v > -1000)) continue
          const east = e * 1000 + (x + 0.5) * px
          const i = Math.floor(((east - BOX.e0) / SPAN) * SIZE)
          const k = j * SIZE + i
          sum[k] += v
          count[k]++
        }
      }
      return
    } catch (err) {
      if (attempt >= 3) throw err
      await new Promise((r) => setTimeout(r, 1000 * 2 ** attempt))
    }
  }
}

const tiles = await listTiles()
const expected = (SPAN / 1000) ** 2
console.log(`swissALTI3D: ${tiles.length} of ${expected} tiles listed`)
if (tiles.length < expected) {
  const have = new Set(tiles.map((t) => `${t.e}-${t.n}`))
  const missing = []
  for (let e = BOX.e0 / 1000; e < BOX.e1 / 1000; e++)
    for (let n = BOX.n0 / 1000; n < BOX.n1 / 1000; n++) if (!have.has(`${e}-${n}`)) missing.push(`${e}-${n}`)
  console.warn(`Missing tiles (filled from neighbours): ${missing.join(', ')}`)
}

let done = 0
const queue = [...tiles]
await Promise.all(
  Array.from({ length: PARALLEL }, async () => {
    for (let t = queue.shift(); t; t = queue.shift()) {
      await addTile(t)
      if (++done % 40 === 0 || done === tiles.length) console.log(`  ${done}/${tiles.length}`)
    }
  }),
)

// Average; fill any empty cell from its nearest filled neighbours.
const grid = new Float32Array(SIZE * SIZE)
for (let k = 0; k < grid.length; k++) grid[k] = count[k] ? sum[k] / count[k] : Number.NaN
for (let pass = 0; pass < 64; pass++) {
  let missing = 0
  for (let j = 0; j < SIZE; j++) {
    for (let i = 0; i < SIZE; i++) {
      const k = j * SIZE + i
      if (!Number.isNaN(grid[k])) continue
      let s = 0
      let c = 0
      for (const [di, dj] of [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ]) {
        const ni = i + di
        const nj = j + dj
        if (ni < 0 || nj < 0 || ni >= SIZE || nj >= SIZE) continue
        const v = grid[nj * SIZE + ni]
        if (!Number.isNaN(v)) {
          s += v
          c++
        }
      }
      if (c) grid[k] = s / c
      else missing++
    }
  }
  if (!missing) break
}

mkdirSync(dirname(OUT), { recursive: true })
writeFileSync(OUT, Buffer.from(grid.buffer))
let min = Infinity
let max = -Infinity
for (const v of grid) {
  min = Math.min(min, v)
  max = Math.max(max, v)
}
console.log(`wrote ${OUT}: ${SIZE}x${SIZE}, ${min.toFixed(1)}-${max.toFixed(1)} m`)
