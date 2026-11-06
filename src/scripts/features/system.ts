// /system: technique specimens with replay, Fraunces axis demo, easing demos.
import { gsap, ScrollTrigger } from '../motion/core';
import { arm, draw, reveal, fade } from '../motion/brush';
import { shaderGate } from './home';
import { qs, qsa, type Env } from './env';

export function system(env: Env) {
  const root = qs('[data-system]');
  if (!root) return;

  // ── technique specimens ──
  const players: Record<string, (el: HTMLElement) => void> = {
    dash(el) {
      const p = qs<SVGPathElement>('path', el)!;
      gsap.fromTo(p, { drawSVG: '0%' }, { drawSVG: '100%', duration: 1.1, ease: 'brush' });
    },
    mask(el) {
      draw(qs<SVGSVGElement>('svg.brush', el)!);
    },
    grain(el) {
      draw(qs<SVGSVGElement>('svg.brush', el)!);
    },
    settle(el) {
      draw(qs<SVGSVGElement>('svg.brush', el)!, { settleLast: true });
    },
    async bloom(el) {
      const svg = qs<SVGSVGElement>('svg.brush', el)!;
      const gate = shaderGate(env);
      const note = qs('[data-gate]', el)!;
      note.textContent = gate.ok ? 'Gate passed: WebGL2 ink bloom.' : `Gate not met (${gate.reasons.join(', ')}): SVG mask fallback.`;
      if (!gate.ok) return void draw(svg);
      arm(svg);
      try {
        const { bloom } = await import('../islands/bloom');
        if (env.alive()) await bloom(svg, { signal: env.signal });
      } catch {
        if (env.alive()) draw(svg);
      }
    },
  };
  for (const el of qsa('[data-specimen]', root)) {
    const kind = el.dataset.specimen!;
    const btn = qs<HTMLButtonElement>('[data-replay]', el)!;
    const svg = qs<SVGSVGElement>('svg.brush', el);
    if (kind === 'bloom') {
      const gate = shaderGate(env);
      qs('[data-gate]', el)!.textContent = gate.ok ? 'Gate passed on this device.' : `Gate not met: ${gate.reasons.join(', ')}.`;
    }
    if (env.tier === 'still') {
      if (svg) reveal(svg);
      btn.disabled = true;
      btn.title = 'Motion is set to Still';
      continue;
    }
    if (env.tier === 'full') {
      if (svg) arm(svg);
      else gsap.set(qs('path', el), { drawSVG: '0%' });
      ScrollTrigger.create({ trigger: el, start: 'top 80%', once: true, onEnter: () => void players[kind](el) });
      btn.addEventListener('click', () => void players[kind](el), { signal: env.signal });
    } else {
      btn.addEventListener('click', () => (svg ? fade(svg) : undefined), { signal: env.signal });
    }
  }

  // ── Fraunces axes ──
  const spec = qs('[data-axes]', root);
  if (spec) {
    const text = qs('[data-axes-text]', spec)!;
    const inputs = qsa<HTMLInputElement>('input[type=range]', spec);
    const out = (i: HTMLInputElement) => qs(`output[for="${i.id}"]`, spec);
    const apply = () =>
      inputs.forEach((i) => {
        text.style.setProperty(`--${i.name}`, i.value);
        const o = out(i);
        if (o) o.textContent = i.value;
      });
    inputs.forEach((i) => i.addEventListener('input', apply, { signal: env.signal }));
    apply();
    const play = qs<HTMLButtonElement>('[data-axes-play]', spec)!;
    play.disabled = env.tier === 'still';
    play.addEventListener(
      'click',
      () => {
        const state = Object.fromEntries(inputs.map((i) => [i.name, Number(i.value)]));
        const sync = () =>
          inputs.forEach((i) => {
            i.value = String(Math.round(state[i.name] * 100) / 100);
            apply();
          });
        gsap
          .timeline({ onUpdate: sync })
          .to(state, { opsz: 9, wght: 200, SOFT: 0, WONK: 0, duration: 0.6, ease: 'ui' })
          .to(state, { opsz: 144, wght: 800, duration: 1.1, ease: 'brush' })
          .to(state, { SOFT: 100, WONK: 1, duration: 0.6, ease: 'lift' }, '<0.4')
          .to(state, { wght: 380, opsz: 144, WONK: 0, duration: 0.8, ease: 'lift' });
      },
      { signal: env.signal },
    );
  }

  // ── easing demos ──
  for (const row of qsa('[data-ease-demo]', root)) {
    const dot = qs('.ease-dot', row)!;
    const btn = qs<HTMLButtonElement>('button', row)!;
    btn.disabled = env.tier === 'still';
    btn.addEventListener(
      'click',
      () => {
        const track = dot.parentElement!.clientWidth - dot.clientWidth;
        gsap.fromTo(dot, { x: 0 }, { x: track, duration: Number(row.dataset.duration) / 1000, ease: row.dataset.ease });
      },
      { signal: env.signal },
    );
  }
}
