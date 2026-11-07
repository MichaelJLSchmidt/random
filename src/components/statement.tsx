import { WeightText } from './weight-text'

/**
 * The case study's one large statement. Its words fill from weight 200 to 760
 * in reading order as it crosses the viewport (scroll-linked, full tier only;
 * calm, reduced and no-JS show it filled).
 */
export function Statement({ children }: { children: string }) {
  return (
    <p className="statement" data-statement="">
      <WeightText text={children} final="statement" />
    </p>
  )
}
