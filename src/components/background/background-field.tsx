'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useRef } from 'react'
import { table } from '@/motion/table-store'
import { onTierChange, readTier } from '@/motion/use-tier'
import { FieldEngine } from './field-engine'

let engine: FieldEngine | null = null

/** The running field (About uses it to hand over its elevation texture). */
export const fieldEngine = () => engine

/**
 * Persistent background field, mounted once in the root layout. It renders no
 * React state: the engine listens to the table store and drives the canvas
 * (or the CSS fallback) directly.
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
