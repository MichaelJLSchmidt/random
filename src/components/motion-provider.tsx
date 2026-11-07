'use client'

import { LazyMotion, MotionConfig } from 'motion/react'
import { useMotionTier } from '@/motion/use-tier'

const loadFeatures = () => import('@/motion/features').then((mod) => mod.default)

/** LazyMotion (strict: only `m` components) with Motion's own reduced-motion switch tied to the tier. */
export function MotionProvider({ children }: { children: React.ReactNode }) {
  const tier = useMotionTier()
  return (
    <LazyMotion features={loadFeatures} strict>
      <MotionConfig reducedMotion={tier === 'reduced' ? 'always' : 'never'}>{children}</MotionConfig>
    </LazyMotion>
  )
}
