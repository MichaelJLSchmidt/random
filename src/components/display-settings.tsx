'use client'

import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
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
  tilt: string
  tiltHint: string
  tiltOn: string
  tiltOff: string
  tiltDenied: string
}

type OrientationModule = typeof import('@/interactions/orientation')

const noSubscribe = () => () => {}
const orientationSupported = () => 'DeviceOrientationEvent' in window && matchMedia('(hover: none)').matches

// Native switch (Safari 17.4+, with system haptics on iOS); a plain checkbox elsewhere.
const nativeSwitch = { switch: '' } as Record<string, string>

/** Footer settings: calm motion and foil, saved in localStorage and applied before first paint. */
export function DisplaySettings({ labels }: { labels: Labels }) {
  const tier = useMotionTier()
  const foil = useFoilEnabled()
  const reduced = tier === 'reduced'
  // Reduced motion (system) always wins: the switch shows on and cannot be changed here.
  const calm = reduced || tier === 'calm'

  // Device tilt: touch devices with orientation events only; off until the visitor opts in.
  const tiltSupported = useSyncExternalStore(noSubscribe, orientationSupported, () => false)
  const [tilt, setTilt] = useState(false)
  const orientation = useRef<OrientationModule | null>(null)
  const stopTilt = useRef<(() => void) | null>(null)
  useEffect(() => {
    // Preload so the permission request still runs inside the tap.
    if (tiltSupported) import('@/interactions/orientation').then((mod) => (orientation.current = mod))
    return () => stopTilt.current?.()
  }, [tiltSupported])

  const toggleTilt = async (on: boolean) => {
    const mod = orientation.current
    if (!mod) return
    if (!on) {
      stopTilt.current?.()
      stopTilt.current = null
      setTilt(false)
      announce(labels.tiltOff)
      return
    }
    const granted = await mod.requestOrientation()
    if (!granted) {
      announce(labels.tiltDenied)
      return
    }
    stopTilt.current = mod.startOrientation()
    setTilt(true)
    announce(labels.tiltOn)
  }

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
      {tiltSupported && (
        <>
          <label className={styles.row}>
            <input
              type="checkbox"
              role="switch"
              {...nativeSwitch}
              checked={tilt}
              disabled={tier !== 'full'}
              aria-describedby="tilt-hint"
              onChange={(e) => toggleTilt(e.target.checked)}
            />
            <span>{labels.tilt}</span>
          </label>
          <p id="tilt-hint" className={styles.hint}>
            {labels.tiltHint}
          </p>
        </>
      )}
    </fieldset>
  )
}
