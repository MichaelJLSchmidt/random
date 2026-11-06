// Home hero. The headline is the LCP element: it is painted at once and
// only "settles" (Fraunces SOFT/WONK axes, line breaks locked first so
// nothing reflows). Then the signature stroke draws under one word, then
// the illustration: SVG masks, or the ink-bloom shader where the gate passes.
import { gsap, SplitText } from '../motion/core';
import { arm, draw, reveal, fade } from '../motion/brush';
import { rise, prepRise } from '../motion/text';
import { qs, qsa, type Env } from './env';

export function shaderGate(env: Pick<Env, 'tier' | 'desktop'>): { ok: boolean; reasons: string[] } {
  const reasons: string[] = [];
  if (!matchMedia('(pointer: fine)').matches) reasons.push('no fine pointer');
  if (innerWidth < 1024) reasons.push('viewport narrower than 1024 px');
  if (env.tier !== 'full') reasons.push(`motion tier is ${env.tier}`);
  const mem = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
  if (mem !== undefined && mem < 4) reasons.push(`deviceMemory ${mem} < 4`);
  if (!reasons.length) {
    try {
      const c = document.createElement('canvas');
      const gl = c.getContext('webgl2');
      if (!gl) reasons.push('WebGL2 unavailable');
      else gl.getExtension('WEBGL_lose_context')?.loseContext();
    } catch {
      reasons.push('WebGL2 unavailable');
    }
  }
  return { ok: !reasons.length, reasons };
}

const idle = (fn: () => void, signal: AbortSignal) => {
  const ric = (window as any).requestIdleCallback as undefined | ((cb: () => void, o?: object) => number);
  const id = ric ? ric(fn, { timeout: 1200 }) : window.setTimeout(fn, 200);
  signal.addEventListener('abort', () => ((window as any).cancelIdleCallback ?? clearTimeout)(id));
};

export function hero(env: Env) {
  const root = qs('[data-hero]');
  if (!root) return;
  const title = qs<HTMLElement>('.hero-title', root)!;
  const sig = qs<SVGSVGElement>('.sig-word svg.brush', root)!;
  const art = qs<SVGSVGElement>('.hero-art svg.brush', root)!;
  const content = qsa('[data-rise]', root);

  if (env.tier === 'still') {
    [sig, art].forEach(reveal);
    content.forEach((c) => c.classList.add('is-risen'));
    return;
  }
  const gate = shaderGate(env);
  if (env.tier === 'full') {
    arm(sig);
    arm(art);
  } else {
    gsap.set([sig, art], { opacity: 0 });
  }
  prepRise(content, env.tier);

  env.later(() => {
    if (env.tier === 'calm') {
      fade(sig, 0.1);
      fade(art, 0.2);
      rise(content, 'calm', 0.2);
      return;
    }
    // 1. headline settles (lines locked first: no reflow, no CLS)
    SplitText.create(title, { type: 'lines', aria: 'auto', linesClass: 'line', ignore: '[data-split-ignore]' });
    const tl = gsap.timeline();
    tl.fromTo(title, { '--soft': 0, '--wonk': 1 }, { '--soft': 100, '--wonk': 0, duration: 0.9, ease: 'lift' }, 0);
    // 2. signature stroke under one word, after the headline settles
    tl.add(draw(sig), 0.75);
    // 3. content
    tl.add(rise(content, 'full') ?? gsap.timeline(), 0.55);
    // 4. illustration: shader island (desktop gate) or the SVG mask system
    if (gate.ok) {
      idle(async () => {
        if (!env.alive()) return;
        try {
          const { bloom } = await import('../islands/bloom');
          if (!env.alive()) return;
          await bloom(art, { signal: env.signal });
        } catch (err) {
          console.warn('[inkwake] bloom unavailable, using SVG masks', err);
          if (env.alive()) env.ctx.add(() => draw(art));
        }
      }, env.signal);
    } else {
      tl.add(draw(art), 0.5);
    }
  });
}
