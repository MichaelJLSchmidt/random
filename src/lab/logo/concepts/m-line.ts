import { type Pt, clipPath, g, path, pathOf, strokeOutline, valleyFor } from '../geometry'
import { type SvgNode, idOf, urlOf } from '../model'

/*
 * The stroked M of concept 1: one path from the bottom of the left
 * stem over both apexes into the F's top arm. It draws as one stroke, and two
 * static clips shape it:
 *   band     a rect between the top line and the baseline; trims the miter
 *            spike of the acute left apex, so every top edge sits on one line
 *   outline  the designed outline: the same polyline offset with thinner
 *            diagonals (optical correction at the acute joins).
 */
export type MSpec = {
  /** Stem and arm stroke. */
  sw: number
  /** Diagonal stroke (a little thinner). */
  diag: number
  leftX: number
  apexL: Pt
  apexR: Pt
  valleyX: number
  /** The visible valley tip (lowest point of the stroked V). */
  tip: number
  armEnd: number
  band: [top: number, bottom: number]
}

export function mLine(spec: MSpec, paint: string, prefix = 'm') {
  const valley = valleyFor(spec.apexL, spec.apexR, spec.valleyX, spec.tip, spec.diag / 2)
  const pts: Pt[] = [[spec.leftX, spec.band[1]], spec.apexL, valley, spec.apexR, [spec.armEnd, spec.apexR[1]]]
  const half = [spec.sw / 2, spec.diag / 2, spec.diag / 2, spec.sw / 2]
  const outline = strokeOutline(pts, half)
  const [top, bottom] = spec.band
  const defs: SvgNode[] = [
    clipPath(idOf(`${prefix}-band`), { tag: 'rect', attrs: { x: -12, y: top, width: 72, height: bottom - top } }),
    clipPath(idOf(`${prefix}-outline`), path({ d: pathOf(outline, true) })),
  ]
  const wrap = (line: SvgNode) =>
    g({ 'clip-path': urlOf(`${prefix}-band`) }, g({ 'clip-path': urlOf(`${prefix}-outline`) }, line))
  return { pts, half, valley, d: pathOf(pts), outline, defs, wrap, paint }
}
