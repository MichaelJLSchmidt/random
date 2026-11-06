// Contact: the seal stamps, the email's brush underline redraws on hover /
// focus, copy-to-clipboard confirms with a tiny seal stamp.
import { gsap } from '../motion/core';
import { arm, draw, reveal, settle } from '../motion/brush';
import { qs, type Env } from './env';

function stamp(el: HTMLElement, tier: Env['tier']) {
  if (tier === 'still') return gsap.set(el, { autoAlpha: 1 });
  if (tier === 'calm') return gsap.fromTo(el, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.2 });
  return gsap.fromTo(
    el,
    { autoAlpha: 0, scale: 1.04 },
    {
      autoAlpha: 1,
      scale: 1,
      duration: 0.16,
      ease: 'lift',
      onComplete: () => settle(el.querySelector('.seal-vis')),
    },
  );
}

export function contact(env: Env) {
  const root = qs('[data-contact]');
  if (!root) return;
  const seal = qs('[data-stamp]', root);
  const link = qs<HTMLAnchorElement>('[data-email]', root)!;
  const underline = qs<SVGSVGElement>('svg.brush', link)!;
  if (seal) {
    gsap.set(seal, { autoAlpha: env.tier === 'still' ? 1 : 0 });
    env.later(() => stamp(seal, env.tier).delay?.(0.6));
  }
  if (env.tier === 'full') {
    arm(underline);
    env.later(() => draw(underline).delay(0.9));
    const redraw = () => draw(underline, { total: 320 });
    link.addEventListener('pointerenter', redraw, { signal: env.signal });
    link.addEventListener('focus', redraw, { signal: env.signal });
  } else reveal(underline);

  const btn = qs<HTMLButtonElement>('[data-copy]', root)!;
  const status = qs('[data-copy-status]', root)!;
  const mini = qs('[data-copy-seal]', root)!;
  let hideTimer: ReturnType<typeof setTimeout> | undefined;
  btn.addEventListener(
    'click',
    async () => {
      clearTimeout(hideTimer);
      try {
        await navigator.clipboard.writeText(link.dataset.email || link.textContent!.trim());
        status.dataset.state = 'ok';
        status.querySelector('[data-msg]')!.textContent = 'Copied to clipboard.';
        stamp(mini, env.tier);
      } catch {
        status.dataset.state = 'error';
        status.querySelector('[data-msg]')!.textContent = 'Could not copy. Select the address above and copy it by hand.';
        gsap.set(mini, { autoAlpha: 0 });
      }
      hideTimer = setTimeout(() => {
        gsap.to(mini, { autoAlpha: 0, duration: env.tier === 'still' ? 0 : 0.3 });
      }, 2400);
    },
    { signal: env.signal },
  );
  env.signal.addEventListener('abort', () => clearTimeout(hideTimer));
}
