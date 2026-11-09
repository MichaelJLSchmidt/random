/*
 * View-transition vocabulary.
 *   play:   a hand card zooms into its detail page
 *   return: the hero goes back into its hand slot (Back, Escape, wordmark)
 *   switch: from one detail page straight to another card
 *   nav:    any other link (About, the wordmark)
 *   locale: the same page in the other language (the header's "DE · EN"): the
 *           [locale] layout remounts and every part cross-fades once, in place;
 *           never a card morph
 * Browser back/forward carries no type; every rule has an untyped default.
 */
export const PLAY = 'play'
export const RETURN = 'return'
export const SWITCH = 'switch'
export const NAV = 'nav'
export const LOCALE = 'locale'

/** The class every part of the page cross-fades with on a language switch (view-transitions.css). */
export const LOCALE_FADE = 'locale-fade'

export const cardName = (id: string) => `card-${id}`
export const titleName = (id: string) => `card-title-${id}`

/** Page content enter/exit classes, keyed by transition type. */
export const pageExit = {
  [PLAY]: 'page-exit-play',
  [RETURN]: 'page-exit-return',
  [SWITCH]: 'page-exit-switch',
  [NAV]: 'page-fade',
  [LOCALE]: LOCALE_FADE,
  default: 'page-exit-return',
}
export const pageEnter = {
  [PLAY]: 'page-enter-play',
  [RETURN]: 'page-enter-return',
  [SWITCH]: 'page-enter-play',
  [NAV]: 'page-fade',
  [LOCALE]: LOCALE_FADE,
  default: 'page-enter-return',
}

/*
 * Card and title morphs. React takes the class from the element that mounts,
 * so the hero's map times play / switch and the hand card's map times every
 * return (Back, Escape, wordmark, browser back, leaving for another page).
 */
export const heroShare = { [SWITCH]: 'card-switch', [LOCALE]: LOCALE_FADE, default: 'card-zoom' }
export const heroTitleShare = { [SWITCH]: 'title-switch', [LOCALE]: LOCALE_FADE, default: 'title-zoom' }
export const handShare = { [LOCALE]: LOCALE_FADE, default: 'card-return' }
export const handTitleShare = { [LOCALE]: LOCALE_FADE, default: 'title-return' }
