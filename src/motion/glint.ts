import { duration, ease, tiers } from './tokens'
import { readTier } from './use-tier'

/*
 * The Glint: a single 18° band of the foil gradient that sweeps once across an
 * element (700 ms, ease-in-out). It never loops, and starting a new one ends
 * the previous one, so at most one is on screen. The band is tinted by the
 * nearest --foil-gradient (case-study tints override it).
 *   full: sweeps   calm and reduced: no glint (the moment is still announced
 *   where it matters, e.g. a copied email)
 */
let current: { stop: () => void; animation: Animation } | null = null

export function stopGlint() {
  if (!current) return
  current.animation.cancel()
  current.stop()
  current = null
}

const timing = (delay: number) => ({
  duration: duration.glint * tiers[readTier()].time * 1000,
  delay: delay * 1000,
  easing: `cubic-bezier(${ease.inOut.join(',')})`,
  fill: 'both' as const,
})

/**
 * The same band, clipped to glyphs: `copy` is a foil-filled duplicate of some
 * text (see GlintText / TitleFill) whose clip-path window sweeps across it.
 */
export function glintText(copy: HTMLElement, { delay = 0 }: { delay?: number } = {}) {
  if (readTier() !== 'full') return null
  stopGlint()
  const animation = copy.animate(
    [
      { clipPath: 'polygon(-34% 0, -12% 0, -18% 100%, -40% 100%)' },
      { clipPath: 'polygon(118% 0, 140% 0, 134% 100%, 112% 100%)' },
    ],
    timing(delay),
  )
  const entry = { stop: () => {}, animation }
  current = entry
  const done = () => {
    if (current === entry) current = null
    animation.cancel()
  }
  animation.finished.then(done, done)
  return animation
}

export function glint(target: HTMLElement, { delay = 0 }: { delay?: number } = {}) {
  const tier = readTier()
  if (tier !== 'full') return null
  stopGlint()
  const layer = document.createElement('span')
  layer.className = 'glint'
  layer.setAttribute('aria-hidden', 'true')
  const band = document.createElement('span')
  layer.append(band)
  target.append(layer)
  const animation = band.animate(
    [{ transform: 'translateX(-140%) rotate(18deg)' }, { transform: 'translateX(360%) rotate(18deg)' }],
    timing(delay),
  )
  const entry = { stop: () => layer.remove(), animation }
  current = entry
  const done = () => {
    if (current === entry) current = null
    layer.remove()
  }
  animation.finished.then(done, done)
  return animation
}
