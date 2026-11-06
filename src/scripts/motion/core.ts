// GSAP setup: plugins, named eases from the design tokens, debug stats.
import { captureKeepAlive } from './raf-gate';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin';
import { SplitText } from 'gsap/SplitText';
import { CustomEase } from 'gsap/CustomEase';
import { ease, duration, motionRules } from '../../design/tokens';

captureKeepAlive(() => gsap.registerPlugin(ScrollTrigger, DrawSVGPlugin, SplitText, CustomEase));
for (const [name, [a, b, c, d]] of Object.entries(ease)) {
  CustomEase.create(name, `M0,0 C${a},${b} ${c},${d} 1,1`);
}
gsap.defaults({ ease: 'ui' });
// Scroll events drive updates; the 250 ms idle poll (syncInterval) would
// queue a frame four times a second forever, so it is pushed out of the way.
ScrollTrigger.config({ ignoreMobileResize: true, syncInterval: 1e9 });

export const ms = (n: number) => n / 1000;
export const D = Object.fromEntries(Object.entries(duration).map(([k, v]) => [k, v / 1000])) as Record<
  keyof typeof duration,
  number
>;
export const RULES = motionRules;

/** Runtime counters, read by the verification script. */
export const stats = {
  activeMasks: 0,
  maxActiveMasks: 0,
  activeFilters: 0,
  maxActiveFilters: 0,
  pageLoads: 0,
};
declare global {
  interface Window {
    __inkwake?: {
      stats: typeof stats;
      triggers: () => number;
      tier: () => string;
    };
  }
}

export { gsap, ScrollTrigger, DrawSVGPlugin, SplitText };
