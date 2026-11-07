'use client'

import { useSyncExternalStore } from 'react'
import type { MotionTier } from './tokens'

function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange)
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-motion', 'data-foil'] })
  return () => observer.disconnect()
}

export function readTier(): MotionTier {
  const value = document.documentElement.dataset.motion
  return value === 'calm' || value === 'reduced' ? value : 'full'
}

/** Current motion tier. Use it in effects and animation props, never to change markup. */
export function useMotionTier(): MotionTier {
  return useSyncExternalStore(subscribe, readTier, () => 'full')
}

export function useFoilEnabled(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => document.documentElement.dataset.foil !== 'off',
    () => true,
  )
}
