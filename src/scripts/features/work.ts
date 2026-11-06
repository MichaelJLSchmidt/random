// Work list rows and the next-project card.
import { gsap, ScrollTrigger } from '../motion/core';
import { arm, draw, reveal, fade } from '../motion/brush';
import { splitLines, rise, prepRise } from '../motion/text';
import { setTransitionLead } from '../motion/transitions';
import { qs, qsa, type Env } from './env';

export function workRows(env: Env) {
  for (const row of qsa('[data-work-row]')) {
    const sketch = qs<SVGSVGElement>('.layer-sketch svg.brush', row)!;
    const paint = qs<SVGSVGElement>('.layer-paint svg.brush', row)!;
    const arrow = qs<SVGSVGElement>('.arrow svg.brush, svg.brush.arrow', row);
    const title = qs('[data-row-title]', row)!;
    const meta = qsa('[data-row-rise]', row);
    reveal(paint); // painted layer is revealed by its CSS mask on hover
    if (env.tier === 'still') {
      reveal(sketch);
      if (arrow) reveal(arrow);
      title.classList.add('is-split');
      meta.forEach((m) => m.classList.add('is-risen'));
      continue;
    }
    if (env.tier === 'full') arm(sketch, { layer: 'line' });
    else gsap.set(sketch, { opacity: 0 });
    if (arrow) env.tier === 'full' ? arm(arrow) : reveal(arrow);
    title.classList.add('is-split');
    gsap.set(title, { opacity: 0 });
    prepRise(meta, env.tier);
    ScrollTrigger.create({
      trigger: row,
      start: 'top 82%',
      once: true,
      onEnter: () => {
        // the totem draws (≤ 7 strokes, 900 ms), then the text lines rise
        const t = env.tier === 'full' ? draw(sketch, { layer: 'line', total: 900 }) : fade(sketch);
        const after = env.tier === 'full' ? 0.75 : 0.1;
        gsap.delayedCall(after, () => {
          gsap.set(title, { opacity: 1 });
          splitLines(title, env.tier);
          rise(meta, env.tier, 0.2);
        });
        return t;
      },
    });
    // hover / focus: the arrow draws a dry-brush flick
    if (arrow && env.tier === 'full') {
      const link = row.querySelector('a')!;
      let flick: gsap.core.Timeline | null = null;
      const on = () => {
        flick?.kill();
        flick = draw(arrow);
      };
      const off = () => {
        flick?.kill();
        flick = null;
        arm(arrow);
      };
      link.addEventListener('pointerenter', on, { signal: env.signal });
      link.addEventListener('focus', on, { signal: env.signal });
      link.addEventListener('pointerleave', off, { signal: env.signal });
      link.addEventListener('blur', off, { signal: env.signal });
    }
  }
}

export function nextCard(env: Env) {
  const card = qs<HTMLAnchorElement>('[data-next-card]');
  if (!card) return;
  const svg = qs<SVGSVGElement>('.next-ink svg.brush', card)!;
  if (env.tier !== 'full') {
    reveal(svg);
    return;
  }
  // hover / focus pre-draws the next totem to 30 %; click completes it and
  // the stroke runs on into the page transition.
  const tl = draw(svg, { paused: true, total: 1100 });
  const to = (progress: number, duration: number, ease = 'ui') => gsap.to(tl, { progress, duration, ease, overwrite: true });
  card.addEventListener('pointerenter', () => to(0.3, 0.45), { signal: env.signal });
  card.addEventListener('focus', () => to(0.3, 0.45), { signal: env.signal });
  card.addEventListener('pointerleave', () => to(0, 0.3), { signal: env.signal });
  card.addEventListener('blur', () => to(0, 0.3), { signal: env.signal });
  card.addEventListener(
    'click',
    () => {
      setTransitionLead(() => new Promise<void>((resolve) => void to(1, 0.4, 'brush').eventCallback('onComplete', () => resolve())));
    },
    { signal: env.signal },
  );
}
