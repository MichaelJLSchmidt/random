// Intro: first visit per session, Full tier only, ≤ 2.4 s, skippable.
// An overlay over the server-rendered page, never a blocker.
import { gsap } from './core';
import { draw, settle, reveal } from './brush';

let running: gsap.core.Timeline | null = null;
let done: Promise<void> = Promise.resolve();

export function introDone() {
  return done;
}
export function skipIntro() {
  running?.progress(1);
}

export function runIntro() {
  const html = document.documentElement;
  if (html.dataset.intro !== 'play') return;
  try {
    sessionStorage.setItem('inkwake:intro', '1');
  } catch {
    /* ignore */
  }
  const overlay = document.querySelector<HTMLElement>('[data-intro]');
  const paper = overlay?.querySelector<HTMLElement>('.intro-paper');
  const word = overlay?.querySelector<SVGSVGElement>('[data-intro-word]');
  const seal = overlay?.querySelector<HTMLElement>('[data-intro-seal]');
  const logo = document.querySelector<SVGSVGElement>('[data-logo] svg');
  if (!overlay || !paper || !word || !seal || !logo) {
    delete html.dataset.intro;
    return;
  }
  overlay.style.animation = 'none'; // runtime owns it now (CSS fail-safe off)
  gsap.set(logo, { visibility: 'hidden' });
  let resolveDone!: () => void;
  done = new Promise((r) => (resolveDone = r));

  const finish = () => {
    reveal(word);
    gsap.set(logo, { clearProps: 'visibility' });
    delete html.dataset.intro;
    overlay.removeAttribute('style');
    gsap.set([overlay, paper, word, seal], { clearProps: 'all' });
    window.removeEventListener('keydown', onKey);
    running = null;
    resolveDone();
  };
  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') skipIntro();
  };
  window.addEventListener('keydown', onKey);
  overlay.querySelector('[data-intro-skip]')?.addEventListener('click', skipIntro, { once: true });

  const strokes = draw(word, { total: 1150 });
  const tl = gsap.timeline({ onComplete: finish });
  running = tl;
  // 1. paper fades in (grain + tone over the page)
  tl.fromTo(paper, { '--grain-o': 0 }, { '--grain-o': 0.08, duration: 0.2, ease: 'ui' }, 0);
  gsap.set(seal, { autoAlpha: 0 });
  // 2. the word draws stroke by stroke
  tl.add(strokes, 0.15);
  // 3. the seal stamps: 1.04 → 1 in 160 ms, then a one-shot settle
  tl.fromTo(
    seal,
    { autoAlpha: 0, scale: 1.04 },
    { autoAlpha: 1, scale: 1, duration: 0.16, ease: 'lift', onComplete: () => settle(seal.querySelector('.seal-vis')) },
    '>-0.05',
  );
  // 4. FLIP the word into the nav logo position (measured when the move starts)
  let flip: { x: number; y: number; s: number } | null = null;
  const measure = () => {
    if (!flip) {
      const from = word.getBoundingClientRect();
      const to = logo.getBoundingClientRect();
      flip = { x: to.left - from.left, y: to.top - from.top, s: to.width / from.width };
    }
    return flip;
  };
  gsap.set(word, { transformOrigin: '0 0' });
  tl.to(
    word,
    { x: () => measure().x, y: () => measure().y, scale: () => measure().s, duration: 0.55, ease: 'wipe' },
    '+=0.2',
  );
  tl.to(seal, { autoAlpha: 0, scale: 0.92, duration: 0.25, ease: 'ui' }, '<');
  tl.to(paper, { opacity: 0, duration: 0.45, ease: 'ui' }, '<0.08');
}
