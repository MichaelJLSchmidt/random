'use client'

import { AMBIENT_KEY, savePreference } from '@/motion/preferences'
import { useAmbientPaused } from '@/motion/use-tier'
import styles from './ambient-toggle.module.css'

type Labels = { pause: string; play: string }

/*
 * Pause / play for the background's ambient motion (WCAG 2.2.2): the field's
 * breath and pool drift and About's contour drift. Transitions and reveals are
 * not ambient and always run. One source of truth: the stored choice, which
 * the pre-paint script applies as html[data-ambient="paused"]
 * (src/motion/preferences.ts); the glyph is CSS on that attribute, so it is
 * right before hydration, and React reads the same attribute for
 * aria-pressed. The accessible name stays "Pause background motion" in both
 * states (a toggle button's name never changes; aria-pressed carries the
 * state); the tooltip names the action the click takes. Hidden under reduced
 * motion: the background is still then anyway.
 */
export function AmbientToggle({ labels }: { labels: Labels }) {
  const paused = useAmbientPaused()
  return (
    <button
      type="button"
      className={styles.toggle}
      aria-pressed={paused}
      aria-label={labels.pause}
      title={paused ? labels.play : labels.pause}
      data-ambient-toggle=""
      onClick={() => {
        // Read the attribute, not React state: it is what the visitor sees.
        const next = document.documentElement.dataset.ambient === 'paused' ? 'playing' : 'paused'
        savePreference(AMBIENT_KEY, next)
      }}
    >
      <svg className={styles.icon} viewBox="0 0 16 16" aria-hidden="true">
        <g className={styles.pause}>
          <rect x="3.5" y="2.5" width="3" height="11" rx="0.75" />
          <rect x="9.5" y="2.5" width="3" height="11" rx="0.75" />
        </g>
        <path
          className={styles.play}
          d="M4.5 2.9v10.2a.6.6 0 0 0 .92.5l7.9-5.1a.6.6 0 0 0 0-1L5.42 2.4a.6.6 0 0 0-.92.5Z"
        />
      </svg>
    </button>
  )
}
