'use client'

import { useEffect } from 'react'
import { fieldEngine } from '@/components/background/background-field'
import type { Elevation } from '@/components/background/field-gl'
import { withBase } from '@/lib/site'

type Meta = { min: number; max: number; size: number; step: number }

let cached: Promise<Elevation | null> | null = null

/** Fetches and decodes public/topo/elevation.png once, at low priority. */
function loadElevation(meta: Meta) {
  cached ??= (async () => {
    try {
      const res = await fetch(withBase('/topo/elevation.png'), { priority: 'low' } as RequestInit)
      const bitmap = await createImageBitmap(await res.blob(), {
        colorSpaceConversion: 'none',
        premultiplyAlpha: 'none',
      })
      const canvas = new OffscreenCanvas(bitmap.width, bitmap.height)
      const ctx = canvas.getContext('2d', { willReadFrequently: true })!
      ctx.drawImage(bitmap, 0, 0)
      const px = ctx.getImageData(0, 0, bitmap.width, bitmap.height).data
      const data = new Float32Array(bitmap.width * bitmap.height * 2)
      const range = meta.max - meta.min
      for (let k = 0; k < bitmap.width * bitmap.height; k++) {
        data[k * 2] = ((px[k * 4] * 256 + px[k * 4 + 1]) * meta.step) / range
        data[k * 2 + 1] = px[k * 4 + 2] > 127 ? 1 : 0
      }
      return { width: bitmap.width, height: bitmap.height, data, min: meta.min, max: meta.max }
    } catch {
      cached = null
      return null
    }
  })()
  return cached
}

/*
 * About's contour lines. With WebGL the background field draws them (the
 * elevation texture is fetched here, only on About, at low priority); for
 * reduced motion or without WebGL a static SVG sits behind the content.
 */
export function AboutTopo({ meta }: { meta: Meta }) {
  useEffect(() => {
    const engine = fieldEngine()
    if (!engine || engine.renderer !== 'gl' || engine.hasElevation) return
    let live = true
    const idle = window.requestIdleCallback ?? ((fn: () => void) => window.setTimeout(fn, 200))
    idle(() => {
      loadElevation(meta).then((e) => live && e && fieldEngine()?.setElevation(e))
    })
    return () => {
      live = false
    }
  }, [meta])

  return (
    <div className="topo-static" aria-hidden="true">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={withBase('/topo/contours.svg')} alt="" loading="lazy" decoding="async" />
    </div>
  )
}
