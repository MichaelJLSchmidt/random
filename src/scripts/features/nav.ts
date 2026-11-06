// Navigation: motion toggles and the mobile menu (a paper sheet revealed by
// one horizontal brush sweep; the burger strokes morph into a close mark).
import { gsap } from '../motion/core';
import { setTier, syncToggles, type Tier } from '../motion/tier';
import { qs, qsa, type Env } from './env';

let morph: Promise<typeof import('gsap/MorphSVGPlugin')> | null = null;

export function nav(env: Env) {
  syncToggles();
  qsa<HTMLInputElement>('[data-motion-toggle] input').forEach((i) =>
    i.addEventListener('change', () => i.checked && setTier(i.value as Tier), { signal: env.signal }),
  );

  const btn = qs<HTMLButtonElement>('[data-menu-open]');
  const sheet = qs<HTMLElement>('[data-menu-sheet]');
  if (!btn || !sheet) return;
  const icon = qs<SVGSVGElement>('svg.brush', btn)!;
  const iconPaths = qsa<SVGPathElement>('.bv path', icon);
  // the morphing icon is not drawn by masks
  qsa('.bs', icon).forEach((g) => g.removeAttribute('mask'));
  const closeShapes = qsa<SVGPathElement>('[data-menu-x] .bv path');
  const openShapes = iconPaths.map((p) => p.getAttribute('d')!);
  const items = qsa('[data-menu-item]', sheet);
  const label = qs('.sr-only', btn)!;
  let open = false;

  const morphTo = async (toClose: boolean) => {
    if (env.tier === 'still') {
      iconPaths.forEach((p, i) => p.setAttribute('d', toClose ? closeShapes[i].getAttribute('d')! : openShapes[i]));
      return;
    }
    morph ??= import('gsap/MorphSVGPlugin');
    const { MorphSVGPlugin } = await morph;
    gsap.registerPlugin(MorphSVGPlugin);
    iconPaths.forEach((p, i) =>
      gsap.to(p, {
        morphSVG: toClose ? closeShapes[i] : openShapes[i],
        duration: env.tier === 'full' ? 0.32 : 0.2,
        ease: 'ui',
      }),
    );
  };

  const setOpen = (next: boolean) => {
    open = next;
    btn.setAttribute('aria-expanded', String(next));
    label.textContent = next ? 'Close menu' : 'Open menu';
    document.documentElement.style.overflow = next ? 'hidden' : '';
    void morphTo(next);
    const mp = (v: string) => ({ maskPosition: v, webkitMaskPosition: v });
    if (next) {
      sheet.setAttribute('data-open', '');
      if (env.tier === 'full') {
        gsap.fromTo(sheet, mp('125% 0%'), { ...mp('0% 0%'), duration: 0.5, ease: 'brush' });
        gsap.fromTo(items, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.32, stagger: 0.05, delay: 0.22, ease: 'ui' });
      } else {
        gsap.set(sheet, mp('0% 0%'));
        if (env.tier === 'calm') gsap.fromTo(sheet, { opacity: 0 }, { opacity: 1, duration: 0.2 });
      }
      qs<HTMLElement>('a', sheet)?.focus();
    } else {
      const done = () => {
        sheet.removeAttribute('data-open');
        gsap.set(sheet, { clearProps: 'opacity' });
      };
      if (env.tier === 'full') gsap.to(sheet, { ...mp('125% 0%'), duration: 0.32, ease: 'wipe', onComplete: done });
      else if (env.tier === 'calm') gsap.to(sheet, { opacity: 0, duration: 0.2, onComplete: done });
      else done();
      btn.focus();
    }
  };
  btn.addEventListener('click', () => setOpen(!open), { signal: env.signal });
  document.addEventListener(
    'keydown',
    (e) => {
      if (!open) return;
      if (e.key === 'Escape') setOpen(false);
      if (e.key === 'Tab') {
        // keep focus inside the sheet + button
        const f = [btn, ...qsa<HTMLElement>('a, input', sheet)];
        const i = f.indexOf(document.activeElement as HTMLElement);
        if (e.shiftKey && i <= 0) {
          e.preventDefault();
          f[f.length - 1].focus();
        } else if (!e.shiftKey && i === f.length - 1) {
          e.preventDefault();
          f[0].focus();
        }
      }
    },
    { signal: env.signal },
  );
  env.signal.addEventListener('abort', () => {
    document.documentElement.style.overflow = '';
  });
}
