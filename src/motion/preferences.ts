/*
 * Applied by an inline script in <head> before first paint:
 *   data-motion:  "reduced" when prefers-reduced-motion matches, otherwise
 *                 "full" (two tiers; there is no site setting for the tier).
 *   data-ambient: "paused" when the visitor paused the background's ambient
 *                 motion (the header's pause / play button, stored in
 *                 localStorage), so the field and About's contours are still
 *                 from the first frame. Ambient motion only: transitions and
 *                 reveals always run.
 *   data-intro:   "first" on the first visit to home in this session (the full
 *                 draw sequence), "repeat" on later visits (no draw).
 *   data-field:   the background identity of a card page or About (from the
 *                 URL, read without its locale), so the CSS field paints the
 *                 right colour before JS.
 *   data-hand:    "collapsed" on every route except home (the hand shows 45%
 *                 there), so --hand-reserve is right from the first paint; the
 *                 hand component keeps it in step on client navigations.
 *   data-reveal:  "armed" so reveal targets can start hidden from first paint.
 *                 If the reveal system has not taken over 4 s later, the
 *                 attributes are dropped and every page shows its final state.
 * The script listens for `prefs-change` (same tab), `storage` (other tabs) and
 * media query changes, so it is the single place that writes data-motion and
 * data-ambient.
 */
import { locales } from '@/lib/i18n'

export const PREFS_EVENT = 'prefs-change'
/** localStorage: "paused" while the visitor has paused the background's ambient motion. */
export const AMBIENT_KEY = 'ambient'
/** sessionStorage: set once the home draw sequence has played in this session. */
export const INTRO_KEY = 'table-drawn'
/** Fired when the first-visit intro completes or is skipped (the field finishes its fade-in). */
export const INTRO_DONE = 'table:intro-done'
const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? ''
/** The locale prefix of a path ("/de", "/en"), dropped before the path is matched. */
const LOCALE_PREFIX = `^/(${locales.join('|')})(?=/|$)`

export const prefsScript = (fields: Record<string, string>) =>
  `(function(){var d=document.documentElement,m=matchMedia("(prefers-reduced-motion: reduce)");function g(k){try{return localStorage.getItem(k)}catch(e){return d.getAttribute("data-pref-"+k)}}function a(){d.dataset.motion=m.matches?"reduced":"full";if(g("${AMBIENT_KEY}")==="paused")d.dataset.ambient="paused";else d.removeAttribute("data-ambient")}a();m.addEventListener("change",a);addEventListener("storage",a);addEventListener("${PREFS_EVENT}",a);var s=null;try{s=sessionStorage.getItem("${INTRO_KEY}")}catch(e){}var p=location.pathname.slice(${JSON.stringify(BASE)}.length).replace(new RegExp(${JSON.stringify(LOCALE_PREFIX)}),"").replace(/\\/$/,"")||"/",f=${JSON.stringify(fields)}[p];if(f)d.dataset.field=f;if(p==="/"){d.dataset.intro=s?"repeat":"first"}else{d.dataset.hand="collapsed"}d.dataset.reveal="armed";setTimeout(function(){if(d.dataset.reveal==="armed"){d.removeAttribute("data-reveal");d.removeAttribute("data-intro")}},4000)})()`

export function savePreference(key: typeof AMBIENT_KEY, value: string) {
  try {
    localStorage.setItem(key, value)
  } catch {
    // Storage blocked: keep the choice for this page view only.
    document.documentElement.setAttribute(`data-pref-${key}`, value)
  }
  dispatchEvent(new Event(PREFS_EVENT))
}
