// Headlines split into lines (accessible: aria-label on the parent, lines
// aria-hidden) and rise; content rises 12 px with opacity.
import { gsap, SplitText } from './core';
import type { Tier } from './tier';

export function splitLines(el: HTMLElement, tier: Tier, delay = 0, onDone?: () => void) {
  if (tier !== 'full') {
    el.classList.add('is-split');
    if (tier === 'calm') gsap.fromTo(el, { opacity: 0 }, { opacity: 1, duration: 0.2, delay });
    onDone?.();
    return null;
  }
  let first = true;
  const split = SplitText.create(el, {
    type: 'lines',
    mask: 'lines',
    aria: 'auto',
    autoSplit: true,
    linesClass: 'line',
    ignore: '[data-split-ignore]',
    onSplit(self) {
      el.classList.add('is-split');
      const tween = gsap.from(self.lines, {
        yPercent: 105,
        duration: 0.5,
        stagger: 0.04,
        ease: 'lift',
        delay: first ? delay : 0,
        onComplete: first ? onDone : undefined,
      });
      first = false;
      return tween;
    },
  });
  return split;
}

export function rise(targets: Element[], tier: Tier, delay = 0) {
  targets.forEach((t) => t.classList.add('is-risen'));
  if (tier === 'still' || !targets.length) return null;
  if (tier === 'calm') return gsap.fromTo(targets, { opacity: 0 }, { opacity: 1, duration: 0.2, delay, stagger: 0.04 });
  return gsap.fromTo(
    targets,
    { opacity: 0, y: 12 },
    { opacity: 1, y: 0, duration: 0.32, delay, stagger: 0.06, ease: 'ui', clearProps: 'transform' },
  );
}

/** Hide until revealed (used before a scroll trigger fires). */
export function prepRise(targets: Element[], tier: Tier) {
  targets.forEach((t) => t.classList.add('is-risen'));
  if (tier !== 'still' && targets.length) gsap.set(targets, { opacity: 0 });
}
