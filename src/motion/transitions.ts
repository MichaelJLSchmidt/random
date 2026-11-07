/*
 * View-transition vocabulary shared by links and <ViewTransition> boundaries.
 *   nav-forward / nav-back: direction (content slides; header stays put)
 *   nav-fade:               sideways moves between top-level pages (cross-fade)
 *   card-<slug>:            the one card that morphs between two routes
 *   title-<page>:           a nav label morphing into that page's h1 (CSS names in
 *                           view-transitions.css, active only during this type)
 * Browser back/forward carries no type, so it swaps without animation.
 */
export const navForward = 'nav-forward'
export const navBack = 'nav-back'
export const navFade = 'nav-fade'
export const cardType = (slug: string) => `card-${slug}`
export const cardName = (slug: string) => `card-${slug}`
export const titleType = (page: string) => `title-${page}`

/** Classes for page enter/exit, keyed by transition type. */
export const pageClasses = {
  [navForward]: 'nav-forward',
  [navBack]: 'nav-back',
  [navFade]: 'nav-fade',
  default: 'none',
}

/** A card morphs only when the navigation was started from (or towards) that card. */
export const morphClasses = (slug: string) => ({ [cardType(slug)]: 'morph', default: 'none' })
