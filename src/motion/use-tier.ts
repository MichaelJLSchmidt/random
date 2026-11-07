'use client'

import { useSyncExternalStore } from 'react'
import type { MotionTier } from './tokens'

function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange)
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-motion'] })
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

/** Calls `fn` whenever the tier changes (outside React). */
export function onTierChange(fn: (tier: MotionTier) => void) {
  return subscribe(() => fn(readTier()))
}
