// Spine (process / timeline), the "How I led" thread, the toolbox grid and
// the principles.
import { gsap, ScrollTrigger, SplitText } from '../motion/core';
import { arm, draw, reveal, fade } from '../motion/brush';
import { rise, prepRise } from '../motion/text';
import { qs, qsa, type Env } from './env';

/** Vertical ink line; scrubbed by scroll where data-scrub is set (one per page). */
export function spines(env: Env) {
  for (const sp of qsa('[data-spine]')) {
    const line = qs('.spine-line', sp)!;
    const nodes = qsa('.spine-node', sp);
    line.classList.add('is-armed');
    if (env.tier === 'full' && sp.hasAttribute('data-scrub')) {
      gsap.fromTo(
        line,
        { scaleY: 0 },
        { scaleY: 1, ease: 'none', scrollTrigger: { trigger: sp, start: 'top 62%', end: 'bottom 62%', scrub: 0.6 } },
      );
    }
    for (const node of nodes) {
      const loop = qs<SVGSVGElement>('svg.brush', node)!;
      const content = qsa('[data-rise]', node);
      if (env.tier === 'still') {
        reveal(loop);
        content.forEach((c) => c.classList.add('is-risen'));
        continue;
      }
      if (env.tier === 'full') arm(loop);
      else gsap.set(loop, { opacity: 0 });
      prepRise(content, env.tier);
      ScrollTrigger.create({
        trigger: node,
        start: 'top 62%',
        once: true,
        onEnter: () => {
          // an open brush loop draws at each node
          if (env.tier === 'full') draw(loop);
          else fade(loop);
          rise(content, env.tier, 0.12);
        },
      });
    }
  }
}

export function thread(env: Env) {
  const root = qs('[data-thread]');
  if (!root) return;
  const svg = qs<SVGSVGElement>('svg.brush', root)!;
  const labels = qsa('[data-thread-label]', root);
  if (env.tier === 'still') {
    reveal(svg);
    labels.forEach((l) => l.classList.add('is-risen'));
    return;
  }
  if (env.tier === 'full') arm(svg);
  else gsap.set(svg, { opacity: 0 });
  prepRise(labels, env.tier);
  ScrollTrigger.create({
    trigger: root,
    start: 'top 75%',
    once: true,
    onEnter: () => {
      if (env.tier === 'full') {
        const tl = draw(svg);
        // each name appears as the thread reaches it
        labels.forEach((l, i) => tl.add(rise([l], 'full') ?? gsap.timeline(), 0.15 + i * 0.32));
      } else {
        fade(svg);
        rise(labels, 'calm');
      }
    },
  });
}

export function toolbox(env: Env) {
  const grid = qs('[data-toolbox]');
  if (!grid) return;
  const icons = qsa<SVGSVGElement>('svg.brush', grid);
  const labels = qsa('[data-rise]', grid);
  if (env.tier === 'still') {
    icons.forEach(reveal);
    labels.forEach((l) => l.classList.add('is-risen'));
    return;
  }
  icons.forEach((i) => (env.tier === 'full' ? arm(i) : gsap.set(i, { opacity: 0 })));
  prepRise(labels, env.tier);
  ScrollTrigger.create({
    trigger: grid,
    start: 'top 80%',
    once: true,
    onEnter: () => {
      if (env.tier === 'full') {
        const tl = gsap.timeline();
        icons.forEach((icon, i) => tl.add(draw(icon), i * 0.06)); // 60 ms stagger
      } else icons.forEach((icon) => fade(icon));
      rise(labels, env.tier, 0.2);
    },
  });
}

/** Principles: Fraunces SOFT eases 0 → 100 as each enters, like ink drying. */
export function principles(env: Env) {
  for (const p of qsa('[data-principle]')) {
    p.classList.add('is-risen');
    if (env.tier !== 'full') {
      gsap.set(p, { '--soft': 100 });
      if (env.tier === 'calm') {
        gsap.set(p, { opacity: 0 });
        ScrollTrigger.create({ trigger: p, start: 'top 85%', once: true, onEnter: () => void gsap.to(p, { opacity: 1, duration: 0.2 }) });
      }
      continue;
    }
    gsap.set(p, { '--soft': 0, opacity: 0, y: 12 });
    ScrollTrigger.create({
      trigger: p,
      start: 'top 82%',
      once: true,
      onEnter: () => {
        // lock line breaks first: SOFT changes advance widths slightly
        SplitText.create(p, { type: 'lines', aria: 'auto', linesClass: 'line' });
        gsap
          .timeline()
          .to(p, { opacity: 1, y: 0, duration: 0.32, ease: 'ui' })
          .to(p, { '--soft': 100, duration: 1.4, ease: 'lift' }, 0);
      },
    });
  }
}
