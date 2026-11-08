/*
 * Illustration registry (docs/contracts.md#illustrations). Owned by the
 * Illustrations session: replace the stubs' contents, keep the names, props,
 * viewBoxes and the drawing attributes (pathLength="1", data-draw,
 * data-draw-group="1..n").
 */
import { AboutTimeline } from './about-timeline'
import { AdoptionBars } from './adoption-bars'
import { CareerMatrix } from './career-matrix'
import { ContourPortrait } from './contour-portrait'
import { ContributionLoop } from './contribution-loop'
import { DesignSystemLayers } from './design-system-layers'
import { DiscardedCard } from './discarded-card'
import { IntakeBeforeAfter } from './intake-before-after'
import { JourneyEmotionCurve } from './journey-emotion-curve'
import { ProjectTypeGlyph } from './project-type-glyph'
import { ServiceBlueprint } from './service-blueprint'
import { TeamConstellation } from './team-constellation'
import { TeamGrowthTimeline } from './team-growth-timeline'
import { WeekRing } from './week-ring'
import { WorkshopGlyphs } from './workshop-glyphs'

export * from './types'
export {
  AboutTimeline,
  AdoptionBars,
  CareerMatrix,
  ContourPortrait,
  ContributionLoop,
  DesignSystemLayers,
  DiscardedCard,
  IntakeBeforeAfter,
  JourneyEmotionCurve,
  ProjectTypeGlyph,
  ServiceBlueprint,
  TeamConstellation,
  TeamGrowthTimeline,
  WeekRing,
  WorkshopGlyphs,
}

export { Illustration, illustrations } from './illustration'
