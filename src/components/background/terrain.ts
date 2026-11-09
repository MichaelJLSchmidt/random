import { withBase } from '@/lib/site'

/*
 * About's terrain: the Interlaken region heightmap the old portfolio's
 * password page drew (real swisstopo contours), with its encoding, focus crop
 * and posters. Files in public/terrain/, copied unchanged from that
 * repository (region.webp, region.bin, posters/region-{l,p}.avif); the numbers
 * below are its field.json entry. No build pipeline: the files are the source.
 *
 *   region.webp   lossless WebP, heights packed in R (high) and G (low):
 *                 h = offset + (R·65280 + G·255)·scale, R and G in 0..1
 *   region.bin    the same heights as gzip(hi bytes, lo bytes) of zigzag
 *                 residuals against a + b − c: the exact-decode fallback
 *   probe         reference texels [x, y, R, G]: an upload is read back and
 *                 compared once a session, so a browser that alters the WebP
 *                 decode (colour management) falls back to region.bin
 */
export const region = {
  image: '/terrain/region.webp',
  raw: '/terrain/region.bin',
  width: 864,
  height: 594,
  offset: 536.25,
  scale: 4,
  sha: '36c004cbba97a53bc88263052155fe8c422d96079f08d5a058d9084fb2f50785',
  /** Gradient at the 95th percentile, metres per texel: picks the contour interval. */
  steepM: 63.84,
  /** Contour intervals (m), finest first. */
  intervals: [50, 100, 200, 250, 500],
  /** Where the cover crop is anchored (0..1): Interlaken. */
  focus: { u: 0.4455, v: 0.348 },
  probe: [
    [108, 74, 0, 29],
    [324, 74, 0, 216],
    [540, 74, 0, 114],
    [756, 74, 0, 174],
    [108, 222, 0, 23],
    [324, 222, 0, 5],
    [540, 222, 1, 188],
    [756, 222, 1, 42],
    [108, 371, 0, 110],
    [324, 371, 1, 226],
    [540, 371, 1, 44],
    [756, 371, 2, 50],
    [108, 519, 1, 143],
    [324, 519, 1, 230],
    [540, 519, 2, 149],
    [756, 519, 2, 77],
  ],
  /** The field's first frame of the region (reduced motion, no WebGL2), 1600×1000 and 900×1600. */
  posters: { landscape: '/terrain/region-l.avif', portrait: '/terrain/region-p.avif' },
} as const

export type Terrain = typeof region

/** The contour interval as drawn: the finest that keeps steep lines `minSpacingPx` apart (view in CSS px). */
export function contourInterval(src: Terrain, viewW: number, viewH: number, zoom: number, minSpacingPx: number) {
  const va = viewW / viewH
  const ta = src.width / src.height
  const visibleTexels = src.width * (va > ta ? 1 : va / ta)
  const texelsPerPx = visibleTexels / (zoom * Math.max(viewW, 1))
  const needed = minSpacingPx * src.steepM * texelsPerPx
  return src.intervals.find((i) => i >= needed) ?? src.intervals[src.intervals.length - 1]
}

/** Cover-fit the heightmap into the view, anchored at the focus, zoomed in slightly: uv = st · xy + zw. */
export function coverTransform(
  viewW: number,
  viewH: number,
  src: Terrain,
  zoom: number,
): [number, number, number, number] {
  const va = viewW / viewH
  const ta = src.width / src.height
  const sx = (va > ta ? 1 : va / ta) / zoom
  const sy = (va > ta ? ta / va : 1) / zoom
  return [sx, sy, src.focus.u * (1 - sx), src.focus.v * (1 - sy)]
}

function setFilters(gl: WebGL2RenderingContext) {
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
}

function uploadRGBA(gl: WebGL2RenderingContext, unit: number, image: TexImageSource) {
  const tex = gl.createTexture()!
  gl.activeTexture(gl.TEXTURE0 + unit)
  gl.bindTexture(gl.TEXTURE_2D, tex)
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false)
  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false)
  gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, gl.NONE)
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE, image)
  setFilters(gl)
  return tex
}

function uploadRG(gl: WebGL2RenderingContext, unit: number, data: Uint8Array, w: number, h: number) {
  const tex = gl.createTexture()!
  gl.activeTexture(gl.TEXTURE0 + unit)
  gl.bindTexture(gl.TEXTURE_2D, tex)
  gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1)
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RG8, w, h, 0, gl.RG, gl.UNSIGNED_BYTE, data)
  setFilters(gl)
  return tex
}

/**
 * Reads the reference texels back from an uploaded texture: they must equal the packed values.
 * The read goes into a pixel buffer collected once a fence has passed, so it never stalls a frame.
 */
function probeOk(gl: WebGL2RenderingContext, tex: WebGLTexture, probe: Terrain['probe']): Promise<boolean> {
  const fbo = gl.createFramebuffer()
  gl.bindFramebuffer(gl.FRAMEBUFFER, fbo)
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0)
  const buffer = gl.createBuffer()
  gl.bindBuffer(gl.PIXEL_PACK_BUFFER, buffer)
  gl.bufferData(gl.PIXEL_PACK_BUFFER, probe.length * 4, gl.STREAM_READ)
  probe.forEach(([x, y], i) => gl.readPixels(x, y, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, i * 4))
  gl.bindBuffer(gl.PIXEL_PACK_BUFFER, null)
  gl.bindFramebuffer(gl.FRAMEBUFFER, null)
  gl.deleteFramebuffer(fbo)
  const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0)
  if (!sync) {
    gl.deleteBuffer(buffer)
    return Promise.resolve(false)
  }
  gl.flush()
  return new Promise((done) => {
    const poll = () => {
      const state = gl.isContextLost() ? gl.WAIT_FAILED : gl.clientWaitSync(sync, 0, 0)
      if (state === gl.TIMEOUT_EXPIRED) return void setTimeout(poll, 8)
      gl.deleteSync(sync)
      let ok = state !== gl.WAIT_FAILED
      if (ok) {
        const px = new Uint8Array(probe.length * 4)
        gl.bindBuffer(gl.PIXEL_PACK_BUFFER, buffer)
        gl.getBufferSubData(gl.PIXEL_PACK_BUFFER, 0, px)
        gl.bindBuffer(gl.PIXEL_PACK_BUFFER, null)
        ok = probe.every(([, , r, g], i) => px[i * 4] === r && px[i * 4 + 1] === g)
      }
      gl.deleteBuffer(buffer)
      done(ok)
    }
    poll()
  })
}

/** The raw fallback: gzip(hi bytes, lo bytes) of zigzag residuals against a + b − c, as RG bytes. */
async function decodeRaw(url: string, width: number, height: number): Promise<Uint8Array> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`${url}: ${res.status}`)
  let bytes = new Uint8Array(await res.arrayBuffer())
  if (bytes[0] === 0x1f && bytes[1] === 0x8b) {
    const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'))
    bytes = new Uint8Array(await new Response(stream).arrayBuffer())
  }
  const n = width * height
  if (bytes.length !== n * 2) throw new Error(`${url}: unexpected size`)
  const v = new Uint16Array(n)
  const rg = new Uint8Array(n * 2)
  for (let y = 0, i = 0; y < height; y++) {
    for (let x = 0; x < width; x++, i++) {
      const a = x > 0 ? v[i - 1] : y > 0 ? v[i - width] : 0
      const b = y > 0 ? v[i - width] : a
      const c = x > 0 && y > 0 ? v[i - width - 1] : b
      const z = (bytes[i] << 8) | bytes[n + i]
      const h = (a + b - c + ((z >>> 1) ^ -(z & 1))) & 0xffff
      v[i] = h
      rg[i * 2] = h >> 8
      rg[i * 2 + 1] = h & 255
    }
  }
  return rg
}

/** A decode that passed its check this session (checked once per terrain, not on every page). */
function checked(path: string, ok?: boolean) {
  const key = `table:terrain-ok:${region.sha.slice(0, 16)}:${path}`
  try {
    if (ok) sessionStorage.setItem(key, '1')
    return sessionStorage.getItem(key) === '1'
  } catch {
    return false
  }
}

/**
 * Loads the region heightmap into texture `unit` of `gl`: the WebP, checked against the probe
 * texels, else the raw heights. Rejects when neither decodes exactly (the caller shows the poster).
 */
export async function loadTerrain(gl: WebGL2RenderingContext, unit: number): Promise<WebGLTexture> {
  const res = await fetch(withBase(region.image), { priority: 'low' } as RequestInit)
  if (!res.ok) throw new Error(`${region.image}: ${res.status}`)
  const bitmap = await createImageBitmap(await res.blob(), { premultiplyAlpha: 'none', colorSpaceConversion: 'none' })
  const tex = uploadRGBA(gl, unit, bitmap)
  bitmap.close?.()
  if (checked('image') || ((await probeOk(gl, tex, region.probe)) && checked('image', true))) return tex
  gl.deleteTexture(tex)
  if (typeof DecompressionStream !== 'function') throw new Error(`${region.image}: no exact decode in this browser`)
  const raw = uploadRG(
    gl,
    unit,
    await decodeRaw(withBase(region.raw), region.width, region.height),
    region.width,
    region.height,
  )
  if (await probeOk(gl, raw, region.probe)) return raw
  gl.deleteTexture(raw)
  throw new Error(`${region.image}: no exact decode in this browser`)
}
