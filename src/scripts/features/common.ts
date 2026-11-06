// Generic behaviours: the opening sequence of each page and scroll-in for
// everything below the fold. Components with their own choreography mark
// themselves data-own and are skipped here.
import { gsap, ScrollTrigger } from '../motion/core';
import { arm, play, reveal } from '../motion/brush';
import { splitLines, rise, prepRise } from '../motion/text';
import { qs, qsa, type Env } from './env';

const notOwned = (el: Element) => !el.closest('[data-own]');

export function opening(env: Env) {
  const root = qs('[data-opening]');
  if (!root || root.hasAttribute('data-own')) return;
  const arts = qsa<SVGSVGElement>('svg.brush[data-anim="load"]', root).filter(notOwned);
  const heads = qsa('[data-split]', root).filter(notOwned);
  const content = qsa('[data-rise]', root).filter(notOwned);
  // take over hiding from the CSS fail-safe right away
  if (env.tier === 'still') {
    arts.forEach(reveal);
    heads.forEach((h) => h.classList.add('is-split'));
    content.forEach((c) => c.classList.add('is-risen'));
    return;
  }
  arts.forEach((a) => (env.tier === 'full' ? arm(a) : gsap.set(a, { opacity: 0 })));
  heads.forEach((h) => {
    h.classList.add('is-split');
    gsap.set(h, { opacity: 0 });
  });
  prepRise(content, env.tier);
  env.later(() => {
    // stroke → headline (40 ms line stagger, 500 ms) → content
    arts.forEach((a, i) => play(a, env.tier, { settleLast: a.dataset.settle != null })?.delay?.(i * 0.15));
    const headAt = arts.length ? (env.tier === 'full' ? 0.45 : 0.1) : 0;
    heads.forEach((h) => {
      gsap.set(h, { opacity: 1 });
      splitLines(h, env.tier, headAt);
    });
    rise(content, env.tier, headAt + (heads.length ? 0.45 : 0.1));
  });
}

export function scrolled(env: Env) {
  const opening = qs('[data-opening]');
  const outside = (el: Element) => notOwned(el) && !(opening && opening.contains(el));
  const arts = qsa<SVGSVGElement>('svg.brush[data-anim="scroll"]').filter(outside);
  const heads = qsa('[data-split]').filter(outside);
  const content = qsa('[data-rise]').filter(outside);
  if (env.tier === 'still') {
    arts.forEach(reveal);
    heads.forEach((h) => h.classList.add('is-split'));
    content.forEach((c) => c.classList.add('is-risen'));
    return;
  }
  arts.forEach((a) => {
    if (env.tier === 'full') arm(a);
    else gsap.set(a, { opacity: 0 });
    ScrollTrigger.create({
      trigger: a,
      start: 'top 88%',
      once: true,
      onEnter: () => play(a, env.tier, { settleLast: a.dataset.settle != null }),
    });
  });
  heads.forEach((h) => {
    h.classList.add('is-split');
    gsap.set(h, { opacity: 0 });
    ScrollTrigger.create({
      trigger: h,
      start: 'top 90%',
      once: true,
      onEnter: () => {
        gsap.set(h, { opacity: 1 });
        splitLines(h, env.tier);
      },
    });
  });
  prepRise(content, env.tier);
  if (content.length)
    ScrollTrigger.batch(content, {
      start: 'top 92%',
      once: true,
      onEnter: (batch) => rise(batch, env.tier),
    });
}
