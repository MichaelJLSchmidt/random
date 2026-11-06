// Page transitions through the ClientRouter.
//  Full : three wide ink strokes sweep across (500 ms, wipe ease); the DOM
//         swaps under full cover; the ink lifts by moving the mask offset (400 ms).
//  Calm : 200 ms fade.   Still: instant.
import { gsap } from './core';
import { getTier } from './tier';
import { timelineOf } from './brush';

let lead: (() => Promise<void>) | null = null;
let lifting: Promise<void> | null = null;
let covered: 'sweep' | 'fade' | null = null;

/** A component may run its own stroke into the transition (next-project card). */
export function setTransitionLead(fn: () => Promise<void>) {
  lead = fn;
}

function sweepParts() {
  const root = document.querySelector<HTMLElement>('[data-page-sweep]');
  const svg = root?.querySelector<SVGSVGElement>('svg.brush');
  if (!root || !svg) return null;
  const strokes = timelineOf(svg).map((e) => {
    const g = svg.querySelector<SVGGElement>(`.bs[data-o="${e.order}"]`)!;
    const m = svg.querySelector<SVGPathElement>(`[id="${g.id}-m"] .bm`)!;
    if (!(m as any).__inkLen) {
      (m as any).__inkLen = true;
      m.getTotalLength = () => 1;
    }
    return { g, m };
  });
  return { root, svg, strokes, solid: root.querySelector<HTMLElement>('.solid')! };
}

function sweepIn(): Promise<void> {
  const p = sweepParts();
  if (!p) return Promise.resolve();
  const { root, svg, strokes, solid } = p;
  svg.classList.add('is-armed');
  gsap.set(root, { visibility: 'visible' });
  gsap.set(solid, { opacity: 0 });
  strokes.forEach(({ g, m }) => {
    gsap.set(m, { drawSVG: '0% 0%' });
    gsap.set(g, { visibility: 'visible' });
  });
  return new Promise((resolve) => {
    const tl = gsap.timeline({
      onComplete: () => {
        gsap.set(solid, { opacity: 1 }); // guarantee full cover under the swap
        resolve();
      },
    });
    // 3 overlapping strokes: 340 ms each, 80 ms apart = 500 ms
    strokes.forEach(({ m }, i) => tl.to(m, { drawSVG: '0% 100%', duration: 0.34, ease: 'wipe' }, i * 0.08));
  });
}

function sweepOut(): Promise<void> {
  const p = sweepParts();
  if (!p) return Promise.resolve();
  const { root, strokes, solid } = p;
  gsap.set(solid, { opacity: 0 });
  return new Promise((resolve) => {
    const tl = gsap.timeline({
      onComplete: () => {
        gsap.set(root, { visibility: 'hidden' });
        resolve();
      },
    });
    strokes.forEach(({ m }, i) => tl.to(m, { drawSVG: '100% 100%', duration: 0.36, ease: 'wipe' }, i * 0.02));
  });
}

function fadeIn(): Promise<void> {
  const el = document.querySelector<HTMLElement>('[data-page-fade]');
  if (!el) return Promise.resolve();
  return new Promise((resolve) => {
    gsap.fromTo(el, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.2, ease: 'ui', onComplete: () => resolve() });
  });
}
function fadeOut(): Promise<void> {
  const el = document.querySelector<HTMLElement>('[data-page-fade]');
  if (!el) return Promise.resolve();
  return new Promise((resolve) => {
    gsap.to(el, { autoAlpha: 0, duration: 0.2, ease: 'ui', onComplete: () => resolve() });
  });
}

/** Resolves when the incoming page is uncovered (pages wait for it). */
export function whenUncovered(): Promise<void> {
  return lifting ?? Promise.resolve();
}

export function initTransitions() {
  document.addEventListener('astro:before-preparation', (e) => {
    const tier = getTier();
    const myLead = lead;
    lead = null;
    if (tier === 'still') return;
    const original = e.loader;
    e.loader = async () => {
      if (tier === 'full') {
        if (myLead) await myLead();
        covered = 'sweep';
        await Promise.all([sweepIn(), original()]);
      } else {
        covered = 'fade';
        await Promise.all([fadeIn(), original()]);
      }
    };
  });
  document.addEventListener('astro:after-swap', () => {
    if (!covered) return;
    const kind = covered;
    covered = null;
    lifting = (kind === 'sweep' ? sweepOut() : fadeOut()).then(() => {
      lifting = null;
    });
  });
}
