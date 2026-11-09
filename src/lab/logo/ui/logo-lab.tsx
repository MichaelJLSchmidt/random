'use client'

import { createContext, useCallback, useContext, useEffect, useState, useSyncExternalStore } from 'react'
import { useMotionTier } from '@/motion/use-tier'
import { concepts, conceptByN } from '../concepts'
import type { LabTier } from '../engine'
import { Detail } from './detail'
import { Overview } from './overview'
import { Segmented } from './controls'

/*
 * The lab's client root. The route is the query string (?c=3 opens concept
 * 3's detail view), read from location so the page stays a static export;
 * moving between views pushes history entries, so Back works.
 */
const ROUTE_EVENT = 'logo-lab:route'

function readRoute(): number | null {
  const c = Number(new URLSearchParams(location.search).get('c'))
  return conceptByN(c) ? c : null
}
function subscribeRoute(fn: () => void) {
  addEventListener('popstate', fn)
  addEventListener(ROUTE_EVENT, fn)
  return () => {
    removeEventListener('popstate', fn)
    removeEventListener(ROUTE_EVENT, fn)
  }
}

export function go(n: number | null) {
  const url = new URL(location.href)
  if (n === null) url.searchParams.delete('c')
  else url.searchParams.set('c', String(n))
  history.pushState(history.state, '', url)
  dispatchEvent(new Event(ROUTE_EVENT))
  scrollTo({ top: 0 })
}

export const hrefFor = (n: number | null) => (n === null ? '?' : `?c=${n}`)

type Settings = { tier: LabTier; speed: number; siteTier: LabTier }
const LabSettings = createContext<Settings>({ tier: 'full', speed: 1, siteTier: 'full' })
export const useLabSettings = () => useContext(LabSettings)

export const SPEEDS = [1, 0.5, 0.25] as const

export function LogoLab() {
  const route = useSyncExternalStore(subscribeRoute, readRoute, () => null)
  const siteTier = useMotionTier()
  const [override, setOverride] = useState<LabTier | null>(null)
  const [speed, setSpeed] = useState<number>(1)
  const tier = override ?? siteTier
  const concept = route === null ? null : conceptByN(route)

  // The document title names the open concept.
  useEffect(() => {
    if (!concept) return
    const base = document.title
    document.title = `${concept.n} ${concept.name} · ${base}`
    return () => {
      document.title = base
    }
  }, [concept])

  const onTier = useCallback((v: string) => setOverride(v === siteTier ? null : (v as LabTier)), [siteTier])

  return (
    <LabSettings.Provider value={{ tier, speed, siteTier }}>
      <div className="lab-bar" role="group" aria-label="Playback">
        <Segmented
          label="Motion tier"
          value={tier}
          options={(['full', 'calm', 'reduced'] as const).map((t) => ({
            value: t,
            label: t === siteTier ? `${t[0].toUpperCase()}${t.slice(1)} (site)` : `${t[0].toUpperCase()}${t.slice(1)}`,
          }))}
          onChange={onTier}
        />
        <Segmented
          label="Speed"
          value={String(speed)}
          options={SPEEDS.map((s) => ({ value: String(s), label: `${s}×` }))}
          onChange={(v) => setSpeed(Number(v))}
        />
      </div>
      {concept ? <Detail key={concept.n} concept={concept} /> : <Overview concepts={concepts} />}
    </LabSettings.Provider>
  )
}
