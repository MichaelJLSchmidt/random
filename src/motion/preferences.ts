/*
 * Display preferences, applied by an inline script in <head> before first paint.
 *   data-motion: "reduced" when prefers-reduced-motion matches (overrides calm),
 *                otherwise "calm" if the visitor chose it, otherwise "full".
 *   data-foil:   "off" if the visitor turned the foil effect off.
 * The script listens for `prefs-change` (same tab), `storage` (other tabs) and
 * media query changes, so it is the single place that writes these attributes.
 *   data-intro:  "pending" on the first full-tier visit to the home page, so the
 *                hand can start inside the deck from first paint. If the intro
 *                has not started 3.5 s later, the attribute is dropped and the
 *                page shows its final state.
 */
export const PREFS_EVENT = 'prefs-change'
export const MOTION_KEY = 'motion'
export const FOIL_KEY = 'foil'
/** Set once the first-visit intro has played (or was skipped). */
export const INTRO_KEY = 'intro-seen'
const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? ''

export const prefsScript = `(function(){var d=document.documentElement,m=matchMedia("(prefers-reduced-motion: reduce)");function g(k){try{return localStorage.getItem(k)}catch(e){return d.getAttribute("data-pref-"+k)}}function a(){d.dataset.motion=m.matches?"reduced":g("${MOTION_KEY}")==="calm"?"calm":"full";d.dataset.foil=g("${FOIL_KEY}")==="off"?"off":"on"}a();m.addEventListener("change",a);addEventListener("storage",a);addEventListener("${PREFS_EVENT}",a);if(d.dataset.motion==="full"&&location.pathname==="${BASE}/"&&!g("${INTRO_KEY}")){d.dataset.intro="pending";setTimeout(function(){d.dataset.intro==="pending"&&d.removeAttribute("data-intro")},3500)}})()`

export function savePreference(key: typeof MOTION_KEY | typeof FOIL_KEY, value: string) {
  try {
    localStorage.setItem(key, value)
  } catch {
    // Storage blocked: keep the choice for this page view only.
    document.documentElement.setAttribute(`data-pref-${key}`, value)
  }
  dispatchEvent(new Event(PREFS_EVENT))
}

export function readPreference(key: typeof MOTION_KEY | typeof FOIL_KEY): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return document.documentElement.getAttribute(`data-pref-${key}`)
  }
}
