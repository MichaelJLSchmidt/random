import type { Concept } from '../model'
import { diagonalCut } from './diagonal-cut'
import { ligature } from './ligature'
import { sharedStem } from './shared-stem'
import { twoCards, twoCardsDynamic } from './two-cards'

/** The concepts in the lab, in order. Ids are stable (deep links, stored scores). */
export const concepts: Concept[] = [sharedStem, twoCards, twoCardsDynamic, ligature, diagonalCut]

export const conceptById = (id: string | null) => concepts.find((c) => c.id === id) ?? null
