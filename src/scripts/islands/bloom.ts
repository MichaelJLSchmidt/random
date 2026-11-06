// Ink-bloom shader island (OGL, lazy-loaded on idle, desktop gate only).
// A noise-threshold reveal of the hero art with a darker ink-pooling rim and
// paper grain, rendered at half resolution. Plays once, then stops rendering,
// hands back to the crisp SVG and releases the GL context.
import { Renderer, Program, Mesh, Triangle, Texture } from 'ogl';
import { gsap } from '../motion/core';
import { reveal } from '../motion/brush';

const vertex = /* glsl */ `#version 300 es
in vec2 uv;
in vec2 position;
out vec2 vUv;
void main() { vUv = uv; gl_Position = vec4(position, 0.0, 1.0); }`;

const fragment = /* glsl */ `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 outColor;
uniform sampler2D tArt;
uniform float uP;
uniform float uAspect;
uniform vec3 uInk;
float hash(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  float a = hash(i), b = hash(i + vec2(1.0, 0.0)), c = hash(i + vec2(0.0, 1.0)), d = hash(i + vec2(1.0, 1.0));
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}
float fbm(vec2 p) { float v = 0.0, a = 0.5; for (int i = 0; i < 5; i++) { v += a * noise(p); p *= 2.03; a *= 0.5; } return v; }
void main() {
  vec4 art = texture(tArt, vUv);
  // the bloom travels along the wake: lower left → upper right
  float dir = vUv.x * 0.62 + vUv.y * 0.38;
  float n = fbm(vUv * vec2(uAspect, 1.0) * 4.0);
  float field = dir * 0.72 + n * 0.42;
  float t = uP * 1.3 - 0.08;
  float inside = 1.0 - smoothstep(t - 0.03, t, field);
  float rim = smoothstep(t - 0.12, t - 0.015, field) * inside;
  float grain = hash(gl_FragCoord.xy);
  vec3 c = art.a > 0.0 ? art.rgb / art.a : vec3(0.0);
  c = mix(c, uInk * 0.8, rim * 0.55);
  float a = art.a * inside * (0.92 + 0.08 * grain);
  a = min(1.0, a + art.a * rim * 0.2);
  outColor = vec4(c * a, a);
}`;

function rgb(css: string): [number, number, number] {
  const m = css.match(/\d+(\.\d+)?/g)?.map(Number) ?? [0, 0, 0];
  return [m[0] / 255, m[1] / 255, m[2] / 255];
}

/** Rasterise the final state of an illustration (resolved token colours). */
async function rasterise(svg: SVGSVGElement, w: number, h: number): Promise<HTMLImageElement> {
  const clone = svg.cloneNode(true) as SVGSVGElement;
  const live = svg.querySelectorAll<SVGGElement>('.bs');
  clone.querySelectorAll<SVGGElement>('.bs').forEach((g, i) => {
    const cs = getComputedStyle(live[i]);
    g.removeAttribute('mask');
    g.removeAttribute('style');
    g.setAttribute('fill', cs.fill);
    g.setAttribute('opacity', cs.opacity);
  });
  clone.querySelector('defs')?.remove();
  clone.setAttribute('width', String(w));
  clone.setAttribute('height', String(h));
  clone.removeAttribute('class');
  const src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(new XMLSerializer().serializeToString(clone));
  const img = new Image();
  img.decoding = 'async';
  img.src = src;
  await img.decode();
  return img;
}

export async function bloom(svg: SVGSVGElement, { signal, duration = 1.8 }: { signal: AbortSignal; duration?: number }) {
  const host = svg.parentElement!;
  const rect = svg.getBoundingClientRect();
  const dpr = Math.min(devicePixelRatio || 1, 2) * 0.5; // half resolution
  const img = await rasterise(svg, Math.round(rect.width * dpr), Math.round(rect.height * dpr));
  if (signal.aborted) return;

  const canvas = document.createElement('canvas');
  canvas.className = 'bloom-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  const hostRect = host.getBoundingClientRect();
  Object.assign(canvas.style, {
    position: 'absolute',
    left: `${rect.left - hostRect.left}px`,
    top: `${rect.top - hostRect.top}px`,
    width: `${rect.width}px`,
    height: `${rect.height}px`,
    pointerEvents: 'none',
  });
  if (getComputedStyle(host).position === 'static') host.style.position = 'relative';
  host.appendChild(canvas);

  const renderer = new Renderer({ canvas, dpr, alpha: true, premultipliedAlpha: true, webgl: 2, antialias: false });
  const gl = renderer.gl;
  renderer.setSize(rect.width, rect.height);
  const texture = new Texture(gl, { image: img, generateMipmaps: false, flipY: true, premultiplyAlpha: true });
  const program = new Program(gl, {
    vertex,
    fragment,
    transparent: true,
    uniforms: {
      tArt: { value: texture },
      uP: { value: 0 },
      uAspect: { value: rect.width / rect.height },
      uInk: { value: rgb(getComputedStyle(svg).color) },
    },
  });
  const mesh = new Mesh(gl, { geometry: new Triangle(gl), program });
  const render = () => renderer.render({ scene: mesh });

  const cleanup = () => {
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    canvas.remove();
  };
  signal.addEventListener('abort', cleanup, { once: true });

  // One pass. Rendering happens only inside the tween, so no idle rAF.
  await new Promise<void>((resolve) => {
    const state = { p: 0 };
    gsap.to(state, {
      p: 1,
      duration,
      ease: 'brush',
      onUpdate: () => {
        program.uniforms.uP.value = state.p;
        render();
      },
      onComplete: () => resolve(),
    });
  });
  if (signal.aborted) return;
  reveal(svg); // crisp SVG underneath
  await new Promise<void>((resolve) => gsap.to(canvas, { opacity: 0, duration: 0.2, onComplete: () => resolve() }));
  cleanup();
}
