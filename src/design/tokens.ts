// INKWAKE design tokens: the single source of truth.
// The layout emits these as CSS custom properties; the brush pipeline and
// the motion runtime import them directly. Keep values in sync with nothing:
// everything else reads from here.

export const color = {
  light: {
    paper: '#F4EFE6', // background
    'paper-deep': '#E9E1D3', // cards, image mats, alternate sections
    ink: '#1C1A17', // primary strokes, body text
    'ink-wash': '#6B655C', // secondary text, captions, dry brush
    graphite: '#8A847A', // decorative strokes only, never text
    indigo: '#2F4A6D', // links, focus rings, one accent layer
    seal: '#D2492A', // seal, active states, large display only
    'seal-text': '#B23A1E', // vermilion as small text
    moss: '#7A8B5C', // rare botanical accent, max one per page
  },
  // Dark: ground + paper-coloured ink are given; the rest are derived so
  // every text pair keeps WCAG 2.2 AA (see /system for measured ratios).
  dark: {
    paper: '#14130F',
    'paper-deep': '#1E1C17',
    ink: '#EDE6D8',
    'ink-wash': '#A39C90',
    graphite: '#6E685F',
    indigo: '#9DB4D6',
    seal: '#D2492A',
    'seal-text': '#E8664A',
    moss: '#8E9F6E',
  },
} as const;

export type ColorName = keyof typeof color.light;

/** Text/background pairs that must pass. `large` = only used ≥ 24px / 18.66px bold. */
export const textPairs: { fg: ColorName; bg: ColorName; use: string; large?: boolean }[] = [
  { fg: 'ink', bg: 'paper', use: 'Body text' },
  { fg: 'ink', bg: 'paper-deep', use: 'Text on cards and mats' },
  { fg: 'ink-wash', bg: 'paper', use: 'Secondary text, captions' },
  { fg: 'ink-wash', bg: 'paper-deep', use: 'Large secondary text on cards', large: true },
  { fg: 'indigo', bg: 'paper', use: 'Links' },
  { fg: 'indigo', bg: 'paper-deep', use: 'Links on cards' },
  { fg: 'seal-text', bg: 'paper', use: 'Small vermilion text' },
  { fg: 'seal-text', bg: 'paper-deep', use: 'Small vermilion text on cards' },
  { fg: 'seal', bg: 'paper', use: 'Large display vermilion', large: true },
  { fg: 'paper', bg: 'ink', use: 'Button label on ink fill' },
];

export const font = {
  display: "'Fraunces Variable', 'Fraunces Fallback Georgia', 'Fraunces Fallback Times', Georgia, serif",
  text: "'Instrument Sans Variable', 'Instrument Sans Fallback Arial', 'Instrument Sans Fallback Helvetica', Arial, sans-serif",
  mono: "'JetBrains Mono Variable', 'JetBrains Mono Fallback Courier', 'Courier New', monospace",
} as const;

export const type = {
  display: 'clamp(3.5rem, 8vw, 9rem)',
  h2: 'clamp(2rem, 4vw, 3.5rem)',
  h3: 'clamp(1.375rem, 2vw, 1.75rem)',
  body: '1.125rem',
  bodyLine: '1.6',
  caption: '0.875rem',
} as const;

export const layout = {
  maxWidth: '1440px',
  gutter: '24px',
  margin: '6vw',
  base: 8,
  // section spacing: desktop 160/240, mobile 96/128
  section: 'clamp(96px, 6.5rem + 4vw, 160px)',
  sectionLg: 'clamp(128px, 7rem + 8vw, 240px)',
} as const;

// ── Motion ──────────────────────────────────────────────────────────────
export const duration = {
  micro: 160, // hover tint, focus
  ui: 320, // menus, buttons, icon draw
  'stroke-s': 600,
  'stroke-m': 1100,
  'stroke-l': 1800,
  page: 900,
  'stroke-stagger': 120,
} as const;

export const ease = {
  brush: [0.55, 0.05, 0.25, 1], // slow load, fast drag, gentle lift
  lift: [0.22, 1, 0.36, 1], // settle, ink drying
  wipe: [0.76, 0, 0.24, 1], // page sweep
  ui: [0.2, 0, 0, 1],
} as const;

export type EaseName = keyof typeof ease;

/** Rules the brush pipeline and runtime enforce. */
export const motionRules = {
  maxStrokeOverlap: 0.15,
  headlineLineStagger: 40,
  headlineLineDuration: 500,
  contentRise: 12,
  contentDuration: 320,
  settleScaleFrom: 3,
  settleDuration: 400,
  calmFade: 200,
  maxContinuousMotion: 5000,
} as const;

export const cubic = (e: readonly number[]) => `cubic-bezier(${e.join(', ')})`;

/** CSS custom properties for every token, light + dark. */
export function tokensCss(): string {
  const vars = (o: Record<string, string>) =>
    Object.entries(o)
      .map(([k, v]) => `--${k}:${v};`)
      .join('');
  const motion =
    Object.entries(duration)
      .map(([k, v]) => `--dur-${k}:${v}ms;`)
      .join('') +
    Object.entries(ease)
      .map(([k, v]) => `--ease-${k}:${cubic(v)};`)
      .join('');
  const t =
    `--font-display:${font.display};--font-text:${font.text};--font-mono:${font.mono};` +
    `--fs-display:${type.display};--fs-h2:${type.h2};--fs-h3:${type.h3};--fs-body:${type.body};--lh-body:${type.bodyLine};--fs-caption:${type.caption};` +
    `--max-w:${layout.maxWidth};--gutter:${layout.gutter};--margin:${layout.margin};--space-section:${layout.section};--space-section-lg:${layout.sectionLg};`;
  const darkVars = vars(color.dark as unknown as Record<string, string>);
  return (
    `:root{color-scheme:light dark;${vars(color.light as unknown as Record<string, string>)}${t}${motion}}` +
    `@media (prefers-color-scheme: dark){:root{${darkVars}}}`
  );
}

// ── Contrast (WCAG 2.2) ─────────────────────────────────────────────────
function channel(c: number) {
  const s = c / 255;
  return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}
export function luminance(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  return 0.2126 * channel((n >> 16) & 255) + 0.7152 * channel((n >> 8) & 255) + 0.0722 * channel(n & 255);
}
export function contrast(a: string, b: string) {
  const [l1, l2] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
}
