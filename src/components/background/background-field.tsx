'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useRef } from 'react'
import { table } from '@/motion/table-store'
import { onTierChange, readTier } from '@/motion/use-tier'
import { withBase } from '@/lib/site'
import { FieldEngine } from './field-engine'
import { region } from './terrain'

let engine: FieldEngine | null = null

/** The running field. */
export const fieldEngine = () => engine

/** The poster's crop: the region's focus (Interlaken), like the live field's cover crop. */
const posterPosition = `${region.focus.u * 100}% ${region.focus.v * 100}%`

/**
 * Persistent background field, mounted once in the root layout. It renders no
 * React state: the engine listens to the table store and drives the canvas
 * (or the CSS fallback) directly. On About the canvas draws the contour field;
 * the region's poster (its first frame) stands in with reduced motion, without
 * WebGL2 and while the heightmap loads on a direct visit (data-poster, set by
 * the engine; the image loads only once it is shown).
 */
export function BackgroundField() {
  const root = useRef<HTMLDivElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)
  const layers = useRef<HTMLDivElement>(null)

  useEffect(() => {
    table.setTier(readTier())
    const offTier = onTierChange((tier) => table.setTier(tier))
    engine = new FieldEngine(root.current!, canvas.current!, layers.current!)
    return () => {
      offTier()
      engine?.destroy()
      engine = null
    }
  }, [])

  return (
    <div ref={root} className="field" data-mode="css" aria-hidden="true">
      <div ref={layers} className="field-css">
        <div className="field-layer" data-layer="a" />
        <div className="field-layer" data-layer="b" />
      </div>
      <canvas ref={canvas} className="field-canvas" />
      <picture className="field-poster">
        <source media="(orientation: portrait)" srcSet={withBase(region.posters.portrait)} type="image/avif" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={withBase(region.posters.landscape)}
          alt=""
          loading="lazy"
          decoding="async"
          style={{ objectPosition: posterPosition }}
        />
      </picture>
      <RouteSync />
    </div>
  )
}

/** Tells the table about every route change (links, back/forward, direct loads). */
function RouteSync() {
  const pathname = usePathname()
  const first = useRef(true)
  useEffect(() => {
    table.route(pathname, first.current)
    first.current = false
  }, [pathname])
  return null
}
