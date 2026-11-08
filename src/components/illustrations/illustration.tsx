import type { ComponentType } from 'react'
import { AboutTimeline } from './about-timeline'
import { AdoptionBars } from './adoption-bars'
import { CareerMatrix } from './career-matrix'
import { ContourPortrait } from './contour-portrait'
import { ContributionLoop } from './contribution-loop'
import { DesignSystemLayers } from './design-system-layers'
import { DiscardedCard } from './discarded-card'
import { IntakeBeforeAfter } from './intake-before-after'
import { JourneyEmotionCurve } from './journey-emotion-curve'
import { ServiceBlueprint } from './service-blueprint'
import { TeamConstellation } from './team-constellation'
import { TeamGrowthTimeline } from './team-growth-timeline'
import type { ContentIllustration, IllustrationProps } from './types'
import { WeekRing } from './week-ring'
import { WorkshopGlyphs } from './workshop-glyphs'

/** Illustrations content can name (everything except the per-row ProjectTypeGlyph). */
export const illustrations: Record<ContentIllustration, ComponentType<IllustrationProps>> = {
  TeamGrowthTimeline,
  IntakeBeforeAfter,
  DesignSystemLayers,
  ContributionLoop,
  AdoptionBars,
  ServiceBlueprint,
  JourneyEmotionCurve,
  TeamConstellation,
  WeekRing,
  CareerMatrix,
  WorkshopGlyphs,
  ContourPortrait,
  AboutTimeline,
  DiscardedCard,
}

/** Renders an illustration by its registry name (for content that names one, e.g. a section's illustration). */
export function Illustration({ name, ...props }: IllustrationProps & { name: ContentIllustration }) {
  const Component = illustrations[name]
  return <Component {...props} />
}
