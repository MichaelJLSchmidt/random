import type { Tier } from '../motion/tier';

export interface Env {
  tier: Tier;
  /** ≥ 1024 px and a fine pointer */
  desktop: boolean;
  ctx: gsap.Context;
  signal: AbortSignal;
  alive(): boolean;
  /** Run after the intro / page-lift / fonts, inside the page's gsap context. */
  later(fn: () => void): void;
}

export const qs = <T extends Element = HTMLElement>(sel: string, root: ParentNode = document) => root.querySelector<T>(sel);
export const qsa = <T extends Element = HTMLElement>(sel: string, root: ParentNode = document) =>
  Array.from(root.querySelectorAll<T>(sel));
