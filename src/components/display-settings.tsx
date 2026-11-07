'use client'

import { announce } from '@/components/live-region'
import { FOIL_KEY, MOTION_KEY, savePreference } from '@/motion/preferences'
import { useFoilEnabled, useMotionTier } from '@/motion/use-tier'
import styles from './display-settings.module.css'

type Labels = {
  heading: string
  calm: string
  calmHint: string
  foil: string
  calmOn: string
  calmOff: string
  foilOn: string
  foilOff: string
}

// Native switch (Safari 17.4+, with system haptics on iOS); a plain checkbox elsewhere.
const nativeSwitch = { switch: '' } as Record<string, string>

/** Footer settings: calm motion and foil, saved in localStorage and applied before first paint. */
export function DisplaySettings({ labels }: { labels: Labels }) {
  const tier = useMotionTier()
  const foil = useFoilEnabled()
  const reduced = tier === 'reduced'
  // Reduced motion (system) always wins: the switch shows on and cannot be changed here.
  const calm = reduced || tier === 'calm'

  return (
    <fieldset className={styles.settings}>
      <legend className="meta">{labels.heading}</legend>
      <label className={styles.row}>
        <input
          type="checkbox"
          role="switch"
          {...nativeSwitch}
          checked={calm}
          disabled={reduced}
          aria-describedby="calm-hint"
          onChange={(e) => {
            savePreference(MOTION_KEY, e.target.checked ? 'calm' : 'full')
            announce(e.target.checked ? labels.calmOn : labels.calmOff)
          }}
        />
        <span>{labels.calm}</span>
      </label>
      <p id="calm-hint" className={styles.hint}>
        {labels.calmHint}
      </p>
      <label className={styles.row}>
        <input
          type="checkbox"
          role="switch"
          {...nativeSwitch}
          checked={foil}
          onChange={(e) => {
            savePreference(FOIL_KEY, e.target.checked ? 'on' : 'off')
            announce(e.target.checked ? labels.foilOn : labels.foilOff)
          }}
        />
        <span>{labels.foil}</span>
      </label>
    </fieldset>
  )
}
