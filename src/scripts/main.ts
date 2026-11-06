// INKWAKE runtime entry. One module, loaded once; pages initialise on
// astro:page-load and tear down completely before every swap.
import { gsap, ScrollTrigger, stats } from './motion/core';
import { getTier } from './motion/tier';
import { initTransitions, whenUncovered } from './motion/transitions';
import { runIntro, introDone, skipIntro } from './motion/intro';
import { killSettle } from './motion/brush';
import { startLenis } from './motion/lenis';
import type { Env } from './features/env';
import { opening, scrolled } from './features/common';
import { hero } from './features/home';
import { workRows, nextCard } from './features/work';
import { spines, thread, toolbox, principles } from './features/sections';
import { contact } from './features/contact';
import { system } from './features/system';
import { nav } from './features/nav';

// Order matters: owners claim their elements before the generic passes.
const FEATURES = [nav, hero, workRows, nextCard, spines, thread, toolbox, principles, contact, system, opening, scrolled];

let mm: gsap.MatchMedia | null = null;

function start() {
  stats.pageLoads++;
  mm = gsap.matchMedia();
  mm.add(
    {
      desktop: '(min-width: 1024px) and (pointer: fine)',
      reduce: '(prefers-reduced-motion: reduce)',
      always: '(min-width: 0px)',
    },
    (context) => {
      const tier = getTier(); // re-read: the OS setting may have just changed
      const ac = new AbortController();
      let alive = true;
      const ready = Promise.all([introDone(), whenUncovered(), document.fonts?.ready]).then(() => undefined);
      const env: Env = {
        tier,
        desktop: !!context.conditions?.desktop,
        ctx: context,
        signal: ac.signal,
        alive: () => alive,
        later: (fn) => {
          ready.then(() => {
            if (alive) context.add(fn);
          });
        },
      };
      for (const f of FEATURES) {
        try {
          f(env);
        } catch (err) {
          console.error('[inkwake]', f.name, err);
        }
      }
      // Lenis: desktop + fine pointer + Full tier only, after first idle
      if (tier === 'full' && env.desktop) {
        let stop: (() => void) | null = null;
        const id = setTimeout(() => {
          startLenis(ac.signal)
            .then((s) => (alive ? (stop = s) : s()))
            .catch(() => {});
        }, 600);
        ac.signal.addEventListener('abort', () => {
          clearTimeout(id);
          stop?.();
        });
      }
      return () => {
        alive = false;
        ac.abort();
        killSettle();
      };
    },
  );
}

function stop() {
  mm?.revert(); // kills every timeline, tween, SplitText and ScrollTrigger of the page
  mm = null;
  ScrollTrigger.getAll().forEach((t) => t.kill()); // belt and braces
}

document.addEventListener('astro:page-load', () => {
  stop();
  runIntro();
  start();
});
document.addEventListener('astro:before-swap', stop);
document.addEventListener('inkwake:tier', () => {
  skipIntro();
  stop();
  start();
  ScrollTrigger.refresh();
});
initTransitions();

window.__inkwake = {
  stats,
  triggers: () => ScrollTrigger.getAll().length,
  tier: () => getTier(),
};
