'use client'

import { usePathname } from 'next/navigation'
import { type CSSProperties, useEffect, useRef } from 'react'
import { table } from '@/motion/table-store'
import { onTierChange, readTier } from '@/motion/use-tier'
import { withBase } from '@/lib/site'
import { FieldEngine } from './field-engine'

let engine: FieldEngine | null = null

/** The running field. */
export const fieldEngine = () => engine

/**
 * About's contour background: the old password page's two SVGs (public/contour-bg/, used
 * unchanged), the 200 m version by default and the full one on large viewports. CSS cannot read
 * the base path, so every url() comes in through these custom properties; the media query is the
 * old page's, repeated in src/styles/field.css.
 */
const contourSvg = { poster: '/contour-bg/contours-200.svg', full: '/contour-bg/contours.svg' } as const
const fullQuery =
  '(min-aspect-ratio: 1536/1056) and (min-width: 1783px), (max-aspect-ratio: 1536/1056) and (min-height: 1142px)'
const contourVars = {
  '--contour-poster': `url("${withBase(contourSvg.poster)}")`,
  '--contour-full': `url("${withBase(contourSvg.full)}")`,
} as CSSProperties

const preloaded = new Set<string>()
/** Fetches the SVG this viewport shows (once), so the morph into About never waits for it. */
function preloadContours() {
  const src = withBase(matchMedia(fullQuery).matches ? contourSvg.full : contourSvg.poster)
  if (preloaded.has(src)) return
  preloaded.add(src)
  new Image().src = src
}

/**
 * Persistent background field, mounted once in the root layout. It renders no
 * React state: the engine listens to the table store and drives the canvas
 * (or the CSS fallback) directly. Above the canvas, About's contour layer
 * (.contour-bg: the old password page, its poster drifting slowly) shows on
 * About and during the morph in and out (data-contours, set by the engine);
 * it never reacts to the pointer.
 */
export function BackgroundField() {
  const root = useRef<HTMLDivElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)
  const layers = useRef<HTMLDivElement>(null)
  const contours = useRef<HTMLDivElement>(null)

  useEffect(() => {
    table.setTier(readTier())
    const offTier = onTierChange((tier) => table.setTier(tier))
    engine = new FieldEngine(root.current!, canvas.current!, layers.current!, {
      layer: contours.current!,
      preload: preloadContours,
    })
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
      <div ref={contours} className="contour-bg" style={contourVars}>
        <div className="contour-bg__poster" />
      </div>
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
