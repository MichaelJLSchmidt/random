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
let current: { layer: HTMLElement; animation: Animation } | null = null

export function stopGlint() {
  if (!current) return
  current.animation.cancel()
  current.layer.remove()
  current = null
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
    {
      duration: duration.glint * tiers[tier].time * 1000,
      delay: delay * 1000,
      easing: `cubic-bezier(${ease.inOut.join(',')})`,
      fill: 'both',
    },
  )
  const entry = { layer, animation }
  current = entry
  const done = () => {
    if (current === entry) current = null
    layer.remove()
  }
  animation.finished.then(done, done)
  return animation
}
