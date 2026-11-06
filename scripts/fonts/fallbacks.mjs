#!/usr/bin/env node
// Metric-matched fallback faces (no CLS on swap).
// Reads the real metrics of the self-hosted Fontsource files and the system
// fallbacks (capsize), then writes size-adjust / ascent / descent / line-gap
// overrides to src/generated/fonts.json.
import { writeFile, mkdir } from 'node:fs/promises';
import { fromFile } from '@capsizecss/unpack/fs';
import georgia from '@capsizecss/metrics/georgia';
import times from '@capsizecss/metrics/timesNewRoman';
import arial from '@capsizecss/metrics/arial';
import helvetica from '@capsizecss/metrics/helvetica';
import courier from '@capsizecss/metrics/courierNew';

const FS = 'node_modules/@fontsource-variable';
const families = [
  {
    family: 'Fraunces',
    file: `${FS}/fraunces/files/fraunces-latin-full-normal.woff2`,
    // The variable file's default instance is 9pt Black. Display text runs at
    // wght ≈ 380 and a large optical size, measured at 0.75 × that width
    // (Chromium, sample sentence; opsz 72–144 averaged).
    widthFactor: 0.75,
    fallbacks: [
      ['Georgia', georgia, 'Georgia'],
      ['Times', times, 'Times New Roman'],
    ],
  },
  {
    family: 'Instrument Sans',
    file: `${FS}/instrument-sans/files/instrument-sans-latin-wght-normal.woff2`,
    widthFactor: 1,
    fallbacks: [
      ['Arial', arial, 'Arial'],
      ['Helvetica', helvetica, 'Helvetica'],
    ],
  },
  {
    family: 'JetBrains Mono',
    file: `${FS}/jetbrains-mono/files/jetbrains-mono-latin-wght-normal.woff2`,
    widthFactor: 1,
    fallbacks: [['Courier', courier, 'Courier New']],
  },
];

const pct = (n) => `${(n * 100).toFixed(2)}%`;
const out = [];
for (const f of families) {
  const m = await fromFile(f.file);
  const xAvg = (m.xWidthAvg * f.widthFactor) / m.unitsPerEm;
  for (const [suffix, fb, local] of f.fallbacks) {
    const sizeAdjust = xAvg / (fb.xWidthAvg / fb.unitsPerEm);
    out.push({
      name: `${f.family} Fallback ${suffix}`,
      local,
      sizeAdjust: pct(sizeAdjust),
      ascentOverride: pct(m.ascent / m.unitsPerEm / sizeAdjust),
      descentOverride: pct(Math.abs(m.descent) / m.unitsPerEm / sizeAdjust),
      lineGapOverride: pct(m.lineGap / m.unitsPerEm / sizeAdjust),
    });
  }
}
await mkdir('src/generated', { recursive: true });
await writeFile('src/generated/fonts.json', JSON.stringify(out, null, 2));
console.log(`fonts: ${out.length} metric-matched fallback faces`);
