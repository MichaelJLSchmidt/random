import type { RefObject } from 'react'

/*
 * The deal scene: DealRow's four decision cards dealt onto the table as the
 * row scrolls in (Motion session). Contract: docs/contracts.md#scenes.
 *
 *   const { active } = useDealScene(ref, { cards: 4 })
 *
 * `ref` is the DealRow root ([data-scene="deal"]); its cards are
 * [data-deal-card="1".."4"]. `active` is true while the scene runs (the row
 * can then skip hover styles). Stub: a no-op that never activates, so the row
 * stays in its static, final layout.
 */
export type DealSceneOptions = {
  /** Number of cards in the row (always 4 for decisions). */
  cards: number
}

export type DealSceneState = {
  /** True while the deal runs. */
  active: boolean
}

const idle: DealSceneState = { active: false }

export function useDealScene(ref: RefObject<HTMLElement | null>, options: DealSceneOptions): DealSceneState {
  void ref
  void options
  return idle
}
