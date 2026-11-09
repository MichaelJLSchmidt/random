import type { Concept } from '../model'
import { dealtModules } from './dealt-modules'
import { ligature } from './ligature'
import { portraitStack } from './portrait-stack'
import { ridgeConcept } from './ridge'
import { sharedStem } from './shared-stem'
import { twoCards } from './two-cards'
import { umlautDots } from './umlaut-dots'

/** The seven concepts, in brief order. */
export const concepts: Concept[] = [
  sharedStem,
  portraitStack,
  twoCards,
  dealtModules,
  ligature,
  ridgeConcept,
  umlautDots,
]

export const conceptByN = (n: number) => concepts.find((c) => c.n === n) ?? null
