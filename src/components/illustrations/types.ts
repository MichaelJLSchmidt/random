/*
 * Illustration contract (docs/contracts.md#illustrations). Every illustration
 * is a static inline SVG with a fixed viewBox, a <title> and drawing groups:
 *   - strokes use stroke="currentColor" (or var(--id-accent) via CSS), never a hard-coded colour
 *   - every stroke element that draws on has pathLength="1" and data-draw
 *   - strokes are grouped in <g data-draw-group="1"> ... <g data-draw-group="n">, in drawing order
 * The Motion session animates [data-draw] by group; the SVG itself never animates.
 */

export type IllustrationProps = {
  className?: string
  /** id for the <title> (aria-labelledby). Pass one when the same illustration renders twice on a page. */
  titleId?: string
}

/** Project types on /more-projects, one glyph each. */
export const projectTypes = ['form', 'map', 'dashboard', 'portal', 'calendar', 'checklist'] as const
export type ProjectType = (typeof projectTypes)[number]

export type ProjectTypeGlyphProps = IllustrationProps & { type: ProjectType }

/** Every illustration in the registry (component names). */
export const illustrationNames = [
  'TeamGrowthTimeline',
  'IntakeBeforeAfter',
  'DesignSystemLayers',
  'ContributionLoop',
  'AdoptionBars',
  'ServiceBlueprint',
  'JourneyEmotionCurve',
  'TeamConstellation',
  'WeekRing',
  'CareerMatrix',
  'WorkshopGlyphs',
  'ContourPortrait',
  'AboutTimeline',
  'ProjectTypeGlyph',
  'DiscardedCard',
] as const
export type IllustrationName = (typeof illustrationNames)[number]

/** Illustrations content can reference by name (all but the per-row project glyph). */
export type ContentIllustration = Exclude<IllustrationName, 'ProjectTypeGlyph'>
