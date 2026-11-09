import { VB, g, rect } from './geometry'
import { type Concept, type SvgNode, type VariantKey, conceptLabel } from './model'

/*
 * One tree per (concept, variant, container): the root <svg> with defs, the
 * optional container shape and the mark. mark.tsx renders it inline (React),
 * svg-string.ts writes it as a standalone file. Placeholders (@neutral,
 * @accent, @container, @id:) are resolved by each renderer.
 */
export type Container = 'none' | 'square' | 'card'
export const CONTAINER = '@container'

/** Card container: the hand's 132:184 card around the 48-unit mark box, with the site's card radius (10 / 176). */
const CARD_W = 60
const CARD_H = (CARD_W * 184) / 132
const CARD_R = (CARD_W * 10) / 176
/** Rounded square: the full 48-unit box, radius 10.5 (22 %). */
const SQUARE_R = 10.5

export function viewBoxFor(container: Container) {
  if (container !== 'card') return { x: 0, y: 0, w: VB, h: VB }
  return { x: (VB - CARD_W) / 2, y: (VB - CARD_H) / 2, w: CARD_W, h: CARD_H }
}

/** Numeric attributes rounded to 3 decimals (the files stay short and stable). */
function tidy(node: SvgNode): SvgNode {
  const attrs = node.attrs
    ? Object.fromEntries(
        Object.entries(node.attrs).map(([k, v]) => [k, typeof v === 'number' ? Math.round(v * 1000) / 1000 : v]),
      )
    : undefined
  return { ...node, attrs, children: node.children?.map(tidy) }
}

export function buildMark(concept: Concept, key: VariantKey, container: Container = 'none'): SvgNode {
  return tidy(buildRaw(concept, key, container))
}

function buildRaw(concept: Concept, key: VariantKey, container: Container): SvgNode {
  const variant = concept.variants[key] ?? concept.variants.master
  const box = viewBoxFor(container)
  const children: SvgNode[] = []
  if (variant.defs?.length) children.push({ tag: 'defs', children: variant.defs })
  if (container === 'square') {
    children.push(
      rect({ 'data-container': 'square', x: 0, y: 0, width: VB, height: VB, rx: SQUARE_R, fill: CONTAINER }),
    )
  } else if (container === 'card') {
    children.push(
      rect({ 'data-container': 'card', x: box.x, y: box.y, width: box.w, height: box.h, rx: CARD_R, fill: CONTAINER }),
    )
  }
  const [dx, dy] = variant.nudge ?? [0, 0]
  children.push(g({ 'data-mark': '', transform: dx || dy ? `translate(${dx} ${dy})` : undefined }, ...variant.body))
  return {
    tag: 'svg',
    attrs: {
      xmlns: 'http://www.w3.org/2000/svg',
      viewBox: [box.x, box.y, box.w, box.h].map((n) => Math.round(n * 1000) / 1000).join(' '),
      role: 'img',
      'aria-label': conceptLabel(concept),
      'data-concept': concept.n,
      'data-variant': key,
    },
    children,
  }
}

/** Lockup metrics after the optical nudge. */
export function metricsOf(concept: Concept, key: VariantKey) {
  const v = concept.variants[key] ?? concept.variants.master
  const dy = v.nudge?.[1] ?? 0
  return { cap: v.metrics.cap + dy, base: v.metrics.base + dy, stem: v.metrics.stem }
}

/** Every data-part element name in a tree (QA: parts are unique and complete). */
export function partsOf(node: SvgNode, out: string[] = []) {
  const p = node.attrs?.['data-part']
  if (typeof p === 'string') out.push(p)
  for (const c of node.children ?? []) partsOf(c, out)
  return out
}
