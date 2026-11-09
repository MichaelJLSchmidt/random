/*
 * Applied by an inline script in <head> before first paint:
 *   data-motion:  "reduced" when prefers-reduced-motion matches, otherwise
 *                 "full" (two tiers; there is no site setting for the tier).
 *   data-intro:   "first" on the first visit to home in this session (the full
 *                 draw sequence), "repeat" on later visits (no draw).
 *   data-field:   the background identity of a card page, About or the thesis
 *                 (from the URL, read without its locale), so the CSS field
 *                 paints the right colour before JS.
 *   data-about-map: on About only, so its contour layer shows whole before JS.
 *   data-hand:    "collapsed" on every route except home (the hand shows 45%
 *                 there), so --hand-reserve is right from the first paint; the
 *                 hand component keeps it in step on client navigations.
 *   data-reveal:  "armed" so reveal targets can start hidden from first paint.
 *                 If the reveal system has not taken over 4 s later, the
 *                 attributes are dropped and every page shows its final state.
 * The script follows the reduced-motion media query, so it is the single
 * place that writes data-motion. There is no site setting for motion: ambient
 * background motion follows prefers-reduced-motion and stops while the tab is
 * hidden (the pause button of round 2 is gone, R2).
 */
import { locales } from '@/lib/i18n'

/** sessionStorage: set once the home draw sequence has played in this session. */
export const INTRO_KEY = 'table-drawn'
/** Fired when the first-visit intro completes or is skipped (the field finishes its fade-in). */
export const INTRO_DONE = 'table:intro-done'
/** Fired when the first-visit intro starts revealing the chrome (the header logo deals in then). */
export const CHROME_IN = 'table:chrome-in'
const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? ''
/** The locale prefix of a path ("/de", "/en"), dropped before the path is matched. */
const LOCALE_PREFIX = `^/(${locales.join('|')})(?=/|$)`

export const prefsScript = (fields: Record<string, string>, maps: string[]) =>
  `(function(){var d=document.documentElement,m=matchMedia("(prefers-reduced-motion: reduce)");function a(){d.dataset.motion=m.matches?"reduced":"full"}a();m.addEventListener("change",a);var s=null;try{s=sessionStorage.getItem("${INTRO_KEY}")}catch(e){}var p=location.pathname.slice(${JSON.stringify(BASE)}.length).replace(new RegExp(${JSON.stringify(LOCALE_PREFIX)}),"").replace(/\\/$/,"")||"/",f=${JSON.stringify(fields)}[p];if(f)d.dataset.field=f;if(${JSON.stringify(maps)}.indexOf(p)>-1)d.dataset.aboutMap="";if(p==="/"){d.dataset.intro=s?"repeat":"first"}else{d.dataset.hand="collapsed"}d.dataset.reveal="armed";setTimeout(function(){if(d.dataset.reveal==="armed"){d.removeAttribute("data-reveal");d.removeAttribute("data-intro")}},4000)})()`
