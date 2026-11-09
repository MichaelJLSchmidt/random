/*
 * View-transition vocabulary.
 *   play:   a hand card zooms into its detail page
 *   return: the hero goes back into its hand slot (Back, Escape, wordmark)
 *   switch: from one detail page straight to another card
 *   nav:    any other link (About, the wordmark)
 * Browser back/forward carries no type; every rule has an untyped default.
 */
export const PLAY = 'play'
export const RETURN = 'return'
export const SWITCH = 'switch'
export const NAV = 'nav'

export const cardName = (id: string) => `card-${id}`
export const titleName = (id: string) => `card-title-${id}`

/** Page content enter/exit classes, keyed by transition type. */
export const pageExit = {
  [PLAY]: 'page-exit-play',
  [RETURN]: 'page-exit-return',
  [SWITCH]: 'page-exit-switch',
  [NAV]: 'page-fade',
  default: 'page-exit-return',
}
export const pageEnter = {
  [PLAY]: 'page-enter-play',
  [RETURN]: 'page-enter-return',
  [SWITCH]: 'page-enter-play',
  [NAV]: 'page-fade',
  default: 'page-enter-return',
}

/*
 * Card and title morphs. React takes the class from the element that mounts,
 * so the hero's map times play / switch and the hand card's map times every
 * return (Back, Escape, wordmark, browser back, leaving for another page).
 */
export const heroShare = { [SWITCH]: 'card-switch', default: 'card-zoom' }
export const heroTitleShare = { [SWITCH]: 'title-switch', default: 'title-zoom' }
export const handShare = { default: 'card-return' }
export const handTitleShare = { default: 'title-return' }
