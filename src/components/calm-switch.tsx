'use client'

import { announce } from '@/components/live-region'
import { MOTION_KEY, savePreference } from '@/motion/preferences'
import { useMotionTier } from '@/motion/use-tier'
import styles from './calm-switch.module.css'

type Labels = { calm: string; calmOn: string; calmOff: string; reducedHint: string }

/*
 * The calm-motion switch in the header. One source of truth: the stored
 * preference, which the pre-paint script applies as html[data-motion]
 * (src/motion/preferences.ts). The switch's look (thumb, track, disabled) is
 * pure CSS on that attribute, so it is right before hydration; React reads the
 * same attribute (useMotionTier) and syncs aria-checked and disabled on mount.
 * Reduced motion (system) always wins: the switch shows on, disabled, with a
 * short hint.
 */
export function CalmSwitch({ labels }: { labels: Labels }) {
  const tier = useMotionTier()
  const reduced = tier === 'reduced'
  const on = reduced || tier === 'calm'
  return (
    <div className={styles.calm}>
      <button
        type="button"
        role="switch"
        className={styles.switch}
        aria-checked={on}
        disabled={reduced}
        aria-describedby={reduced ? 'calm-hint' : undefined}
        data-calm-switch=""
        onClick={() => {
          // Read the attribute, not React state: it is what the visitor sees.
          const next = document.documentElement.dataset.motion === 'calm' ? 'full' : 'calm'
          savePreference(MOTION_KEY, next)
          announce(next === 'calm' ? labels.calmOn : labels.calmOff)
        }}
      >
        <span className={styles.label}>{labels.calm}</span>
        <span className={styles.track} aria-hidden="true">
          <span className={styles.thumb} />
        </span>
      </button>
      <span id="calm-hint" className={styles.hint}>
        {labels.reducedHint}
      </span>
    </div>
  )
}
