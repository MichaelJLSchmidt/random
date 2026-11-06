// Optional smooth scrolling: desktop + fine pointer + Full tier only.
// Gentle lerp; no rAF while idle (the loop runs only while Lenis moves);
// stopped while the tab is hidden.
import { ScrollTrigger } from './core';

export async function startLenis(signal: AbortSignal): Promise<() => void> {
  const { default: Lenis } = await import('lenis');
  if (signal.aborted) return () => {};
  const lenis = new Lenis({ lerp: 0.12, smoothWheel: true, autoRaf: false });
  let raf = 0;
  const loop = (t: number) => {
    lenis.raf(t);
    raf = lenis.isScrolling ? requestAnimationFrame(loop) : 0;
  };
  const kick = () => {
    if (!raf) raf = requestAnimationFrame(loop);
  };
  lenis.on('scroll', ScrollTrigger.update);
  addEventListener('wheel', kick, { passive: true, signal });
  addEventListener('keydown', kick, { signal });
  const onVis = () => (document.hidden ? lenis.stop() : lenis.start());
  document.addEventListener('visibilitychange', onVis, { signal });
  return () => {
    cancelAnimationFrame(raf);
    lenis.destroy();
  };
}
