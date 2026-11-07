/*
 * True once the first client render has finished. Components that mount after
 * that came in through a client navigation, so they may animate in; on a full
 * page load they must render as-is (first paint, LCP and no-JS stay the same).
 */
let ready = false

export const markFirstRenderDone = () => {
  ready = true
}

export const isClientNavigation = () => ready
