import { useId } from 'react'

/*
 * The logo: two fanned cards in the hand's card ratio, an M cut out of the back
 * card and an F out of the front one; the front card covers the M's right stem,
 * so the two letters share it. The back card is the text colour, the front card
 * the page accent (`--accent`, the ink identity's warm grey in the header).
 *
 * Geometry from the logo lab (concept 3, master), copied here so the lab can be
 * deleted without touching the site: user units of the lab's 48-unit box, the
 * viewBox cropped to the fan. The front card's outline, widened by 1.5 units, is
 * knocked out of the back card, so the overlap reads in one colour too.
 * Decorative: the link around it carries the name.
 */
const BACK = 'rotate(-6 18.235 37.923)'
const FRONT = 'rotate(5 30.235 37.923)'
const CARD = { y: 9.923, width: 20, height: 28, rx: 2.5 }
const M =
  'M14.735 30.923V22.181L19.235 25.823L23.735 22.181V30.923H27.235V16.923H25.064L19.235 21.642L13.406 16.923H11.235V30.923Z'
const F = 'M23.735 16.923H27.235V30.923H23.735ZM23.735 16.923H36.235V20.423H23.735ZM23.735 22.673H33.735V26.173H23.735Z'
const AREA = { x: -24, y: -24, width: 96, height: 96 }

export function Logo({ className }: { className?: string }) {
  const id = useId().replace(/:/g, '')
  const mask = (name: string) => `${id}-${name}`
  const props = { maskUnits: 'userSpaceOnUse', maskContentUnits: 'userSpaceOnUse', ...AREA } as const
  return (
    <svg className={className} viewBox="5 8.5 38 31" aria-hidden="true" focusable="false">
      <defs>
        <mask id={mask('gap')} {...props}>
          <rect {...AREA} fill="white" />
          <rect x="20.235" {...CARD} transform={FRONT} fill="black" stroke="black" strokeWidth="3" />
        </mask>
        <mask id={mask('m')} {...props}>
          <rect {...AREA} fill="white" />
          <path d={M} fill="black" />
        </mask>
        <mask id={mask('f')} {...props}>
          <rect {...AREA} fill="white" />
          <path d={F} fill="black" />
        </mask>
      </defs>
      <g mask={`url(#${mask('gap')})`}>
        <g transform={BACK}>
          <rect x="8.235" {...CARD} fill="currentColor" mask={`url(#${mask('m')})`} />
        </g>
      </g>
      <g transform={FRONT}>
        <rect x="20.235" {...CARD} fill="var(--accent, currentColor)" mask={`url(#${mask('f')})`} />
      </g>
    </svg>
  )
}
