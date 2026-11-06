#!/usr/bin/env node
// Production verification with Playwright (run after `npm run build`).
//   node scripts/verify/run.mjs            → verify-output/ (screens + report)
// Starts `astro preview` (base path applied) unless VERIFY_URL is set.
import { createServer } from 'node:http';
import { mkdir, writeFile, readdir, readFile } from 'node:fs/promises';
import { gzipSync } from 'node:zlib';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { color, textPairs, contrast } from '../../src/design/tokens.ts';
import { repo } from '../repo.mjs';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const OUT = process.env.VERIFY_OUT || join(ROOT, 'verify-output');
const PORT = 4329;
const BASE_PATH = `${repo().base}/`;
let BASE = process.env.VERIFY_URL || `http://127.0.0.1:${PORT}${BASE_PATH}`;

const PAGES = [
  ['home', ''],
  ['case', 'work/wayfinding/'],
  ['about', 'about/'],
  ['contact', 'contact/'],
  ['system', 'system/'],
];
const VIEWPORTS = { desktop: { width: 1440, height: 900 }, mobile: { width: 390, height: 844 } };
const IGNORE = [/GL Driver Message/, /GPU stall/, /WebGL/i];

const results = [];
const check = (name, ok, detail = '') => {
  results.push({ name, ok, detail });
  console.log(`${ok ? '✓' : '✗'} ${name}${detail ? ` — ${detail}` : ''}`);
};

// A static server that behaves like GitHub Pages for a project site:
// dist/ is served under /<repo>/, directories resolve to index.html and
// unknown paths get 404.html with a 404 status.
const TYPES = { html: 'text/html; charset=utf-8', js: 'text/javascript', css: 'text/css', svg: 'image/svg+xml', png: 'image/png', woff2: 'font/woff2', json: 'application/json' };
async function startServer() {
  if (process.env.VERIFY_URL) return null;
  const dist = join(ROOT, 'dist');
  const server = createServer(async (req, res) => {
    const path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    if (!path.startsWith(BASE_PATH)) return res.writeHead(404).end('outside base path');
    let file = join(dist, path.slice(BASE_PATH.length));
    if (file.endsWith('/') || !/\.[a-z0-9]+$/i.test(file)) file = join(file, 'index.html');
    try {
      const body = await readFile(file);
      res.writeHead(200, { 'content-type': TYPES[file.split('.').pop()] || 'application/octet-stream' }).end(body);
    } catch {
      res.writeHead(404, { 'content-type': TYPES.html }).end(await readFile(join(dist, '404.html')));
    }
  });
  await new Promise((r) => server.listen(PORT, '127.0.0.1', r));
  return { kill: () => server.close() };
}

function initScript({ tier, introSeen = true }) {
  return `(() => {
    try {
      ${tier ? `localStorage.setItem('inkwake:motion', '${tier}');` : ''}
      ${introSeen ? "sessionStorage.setItem('inkwake:intro', '1');" : ''}
    } catch (e) {}
    window.__cls = 0;
    try {
      new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__cls += e.value; })
        .observe({ type: 'layout-shift', buffered: true });
    } catch (e) {}
    window.__rafCount = 0;
    const raf = window.requestAnimationFrame.bind(window);
    window.requestAnimationFrame = (cb) => raf((t) => { window.__rafCount++; cb(t); });
  })();`;
}

function watchConsole(page, bucket) {
  page.on('console', (m) => {
    if (m.type() !== 'error') return;
    if (IGNORE.some((r) => r.test(m.text()))) return;
    bucket.push(m.text());
  });
  page.on('pageerror', (e) => bucket.push(`pageerror: ${e.message}`));
}

async function settle(page, tier) {
  if (tier === 'still') {
    await page.waitForTimeout(400);
    return;
  }
  await page.waitForTimeout(5200);
  const H = await page.evaluate(() => document.documentElement.scrollHeight);
  const vh = page.viewportSize().height;
  for (let y = 0; y < H; y += Math.round(vh * 0.6)) {
    await page.evaluate((y) => window.scrollTo(0, y), y);
    await page.waitForTimeout(260);
  }
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await page.waitForTimeout(2600);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(800);
}

async function screenshots(browser) {
  await mkdir(join(OUT, 'screens'), { recursive: true });
  const errors = [];
  let maxMasks = 0;
  let maxFilters = 0;
  for (const [vpName, vp] of Object.entries(VIEWPORTS)) {
    for (const tier of ['full', 'still']) {
      const ctx = await browser.newContext({ viewport: vp });
      await ctx.addInitScript(initScript({ tier }));
      const page = await ctx.newPage();
      const bucket = [];
      watchConsole(page, bucket);
      for (const [name, path] of PAGES) {
        await page.goto(BASE + path, { waitUntil: 'networkidle' });
        const clsLoad = await page.evaluate(() => new Promise((r) => setTimeout(() => r(window.__cls), 4500)));
        await settle(page, tier);
        await page.screenshot({ path: join(OUT, 'screens', `${name}-${tier}-${vpName}.png`), fullPage: true });
        const s = await page.evaluate(() => window.__inkwake?.stats);
        maxMasks = Math.max(maxMasks, s?.maxActiveMasks ?? 0);
        maxFilters = Math.max(maxFilters, s?.maxActiveFilters ?? 0);
        check(`CLS < 0.1 · ${name} ${tier} ${vpName}`, clsLoad < 0.1, clsLoad.toFixed(4));
        if (tier === 'full' && name === 'home') {
          // idle: no rAF loop once everything has settled
          await page.waitForTimeout(2500);
          const before = await page.evaluate(() => window.__rafCount);
          await page.waitForTimeout(2000);
          const after = await page.evaluate(() => window.__rafCount);
          check(`no rAF loop while idle · ${vpName}`, after - before <= 2, `${after - before} frames in 2 s`);
        }
      }
      errors.push(...bucket.map((e) => `${vpName}/${tier}: ${e}`));
      await ctx.close();
    }
  }
  check('no console errors (all pages, tiers, viewports)', errors.length === 0, errors.slice(0, 5).join(' | '));
  check('≤ 20 animating masks at once', maxMasks <= 20, `max ${maxMasks}`);
  check('≤ 1 active SVG filter at once', maxFilters <= 1, `max ${maxFilters}`);
  // dark mode reference shots
  for (const [vpName, vp] of Object.entries(VIEWPORTS)) {
    const ctx = await browser.newContext({ viewport: vp, colorScheme: 'dark' });
    await ctx.addInitScript(initScript({ tier: 'still' }));
    const page = await ctx.newPage();
    await page.goto(BASE, { waitUntil: 'networkidle' });
    await page.waitForTimeout(300);
    await page.screenshot({ path: join(OUT, 'screens', `home-still-${vpName}-dark.png`) });
    await ctx.close();
  }
}

async function navigation(browser) {
  const ctx = await browser.newContext({ viewport: VIEWPORTS.desktop });
  await ctx.addInitScript(initScript({ tier: 'full' }));
  const page = await ctx.newPage();
  const bucket = [];
  watchConsole(page, bucket);
  const count = () => page.evaluate(() => window.__inkwake.triggers());
  // baseline: fresh load of each page, top of page, 1.5 s after load
  const route = ['work/', 'about/', 'contact/', 'system/', '', 'work/wayfinding/', 'work/design-system/', 'about/', 'system/', ''];
  const baseline = {};
  for (const p of new Set(route)) {
    await page.goto(BASE + p, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);
    baseline[p] = await count();
  }
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  const loadsBefore = await page.evaluate(() => window.__inkwake.stats.pageLoads);
  const log = [];
  let allMatch = true;
  for (const p of route) {
    const waitLoad = page.evaluate(
      () => new Promise((r) => document.addEventListener('astro:page-load', () => r(true), { once: true })),
    );
    const href = BASE_PATH + p;
    const link = page.locator(`a[href="${href}"]`).first();
    if (await link.isVisible().catch(() => false)) await link.click();
    else await page.evaluate((h) => window.__nav?.(h) ?? document.querySelector(`a[href="${h}"]`)?.click(), href);
    await waitLoad;
    await page.waitForTimeout(1500);
    const n = await count();
    const ok = n === baseline[p];
    allMatch &&= ok;
    log.push(`${p || 'home'}:${n}/${baseline[p]}`);
  }
  const loadsAfter = await page.evaluate(() => window.__inkwake.stats.pageLoads);
  const sweeps = await page.locator('[data-page-sweep]').count();
  check('10 ClientRouter navigations: ScrollTriggers match a fresh load', allMatch, log.join(' '));
  check('10 ClientRouter navigations: one init per navigation', loadsAfter - loadsBefore === route.length, `${loadsAfter - loadsBefore} inits`);
  check('persisted transition overlay not duplicated', sweeps === 1, `${sweeps}`);
  check('no console errors during navigation', bucket.length === 0, bucket.slice(0, 3).join(' | '));
  await ctx.close();
}

async function intro(browser) {
  const ctx = await browser.newContext({ viewport: VIEWPORTS.desktop });
  await ctx.addInitScript(initScript({ tier: 'full', introSeen: false }));
  const page = await ctx.newPage();
  const t0 = Date.now();
  await page.goto(BASE, { waitUntil: 'domcontentloaded' });
  const playing = await page.evaluate(() => document.documentElement.dataset.intro === 'play');
  await page.waitForFunction(() => !document.documentElement.dataset.intro, null, { timeout: 6000 });
  const total = Date.now() - t0;
  await page.screenshot({ path: join(OUT, 'screens', 'intro-after.png') });
  check('intro plays on first visit and clears', playing, `${total} ms incl. load`);
  await page.reload({ waitUntil: 'domcontentloaded' });
  const again = await page.evaluate(() => document.documentElement.dataset.intro === 'play');
  check('intro plays once per session', !again);
  await ctx.close();
  const ctx2 = await browser.newContext({ viewport: VIEWPORTS.desktop });
  await ctx2.addInitScript(initScript({ tier: 'full', introSeen: false }));
  const p2 = await ctx2.newPage();
  await p2.goto(BASE, { waitUntil: 'load' });
  await p2.waitForTimeout(300);
  await p2.keyboard.press('Escape');
  await p2.waitForTimeout(150);
  const skipped = await p2.evaluate(() => !document.documentElement.dataset.intro);
  check('intro is skippable (Escape)', skipped);
  await ctx2.close();
}

async function budgets(browser) {
  const ctx = await browser.newContext({ viewport: VIEWPORTS.desktop });
  await ctx.addInitScript(initScript({ tier: 'full' }));
  const page = await ctx.newPage();
  const responses = [];
  page.on('response', async (r) => {
    try {
      const body = await r.body();
      responses.push({ url: r.url(), type: r.request().resourceType(), bytes: body.length, gz: gzipSync(body).length });
    } catch {}
  });
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);
  const lazy = /bloom|lenis|MorphSVG/;
  const initialJs = responses.filter((r) => r.type === 'script' && !lazy.test(r.url));
  const jsGz = initialJs.reduce((a, r) => a + r.gz, 0);
  check('initial JS ≤ 90 KB gzip', jsGz <= 90 * 1024, `${(jsGz / 1024).toFixed(1)} KB (${initialJs.length} files)`);
  const bloom = responses.find((r) => /bloom/.test(r.url));
  const dist = join(ROOT, 'dist/_astro');
  const bloomFile = (await readdir(dist)).find((f) => f.startsWith('bloom'));
  const bloomGz = bloomFile ? gzipSync(await readFile(join(dist, bloomFile))).length : 0;
  check('WebGL island ≤ 60 KB gzip', bloomGz <= 60 * 1024, `${(bloomGz / 1024).toFixed(1)} KB${bloom ? ' (loaded on this device)' : ''}`);
  const first = responses.filter((r) => !lazy.test(r.url));
  const wire = first.reduce((a, r) => a + (/(font|image)/.test(r.type) ? r.bytes : r.gz), 0);
  check('first view ≤ 1 MB', wire <= 1024 * 1024, `${(wire / 1024).toFixed(0)} KB over the wire (text gzipped), ${first.length} requests`);
  await ctx.close();
}

async function a11y(browser) {
  const ctx = await browser.newContext({ viewport: VIEWPORTS.desktop });
  await ctx.addInitScript(initScript({ tier: 'still' }));
  const page = await ctx.newPage();
  const problems = [];
  for (const [name, path] of PAGES) {
    await page.goto(BASE + path, { waitUntil: 'networkidle' });
    const bad = await page.evaluate(() =>
      [...document.querySelectorAll('svg.brush')]
        .filter((s) => !(s.getAttribute('aria-hidden') === 'true' || (s.getAttribute('role') === 'img' && s.getAttribute('aria-label'))))
        .map((s) => s.dataset.brush),
    );
    if (bad.length) problems.push(`${name}: ${bad.join(',')}`);
  }
  check('illustrations are aria-hidden or role="img" with a label', problems.length === 0, problems.join(' | '));
  // keyboard: every focus stop shows a visible indicator
  await page.goto(BASE, { waitUntil: 'networkidle' });
  let invisible = 0;
  let stops = 0;
  for (let i = 0; i < 22; i++) {
    await page.keyboard.press('Tab');
    const v = await page.evaluate(() => {
      const el = document.activeElement;
      if (!el || el === document.body) return null;
      const cs = getComputedStyle(el);
      const lab = el.closest('label');
      const lcs = lab ? getComputedStyle(lab) : null;
      return cs.outlineStyle !== 'none' || (lcs && lcs.outlineStyle !== 'none');
    });
    if (v === null) continue;
    stops++;
    if (!v) invisible++;
  }
  check('keyboard focus is visible', invisible === 0, `${stops} focus stops, ${invisible} without a ring`);
  // 404 under the base path
  const r = await page.goto(BASE + 'does-not-exist/', { waitUntil: 'networkidle' });
  const h1 = await page.locator('h1').textContent();
  check('404 page served under the base path', /Lost the thread/.test(h1 || ''), `HTTP ${r?.status()}`);
  await ctx.close();
}

async function staticChecks() {
  // every internal URL in the built HTML carries the base path
  const files = [];
  const walk = async (d) => {
    for (const e of await readdir(d, { withFileTypes: true })) {
      if (e.isDirectory()) await walk(join(d, e.name));
      else if (e.name.endsWith('.html')) files.push(join(d, e.name));
    }
  };
  await walk(join(ROOT, 'dist'));
  const offenders = [];
  for (const f of files) {
    const html = await readFile(f, 'utf8');
    for (const m of html.matchAll(/\s(?:href|src)="(\/[^"]*)"/g)) if (!m[1].startsWith(BASE_PATH)) offenders.push(`${f.replace(ROOT, '')}: ${m[1]}`);
    for (const m of html.matchAll(/url\((\/[^)]*)\)/g)) if (!m[1].startsWith(BASE_PATH)) offenders.push(`${f.replace(ROOT, '')}: ${m[1]}`);
  }
  const css = (await readdir(join(ROOT, 'dist/_astro'))).filter((f) => f.endsWith('.css'));
  for (const c of css) {
    const t = await readFile(join(ROOT, 'dist/_astro', c), 'utf8');
    for (const m of t.matchAll(/url\((\/[^)]*)\)/g)) if (!m[1].startsWith(BASE_PATH)) offenders.push(`${c}: ${m[1]}`);
  }
  check('all internal URLs use the base path', offenders.length === 0, offenders.slice(0, 4).join(' | ') || `${files.length} HTML files`);
  // contrast of every text pair, light and dark
  const fails = [];
  for (const p of textPairs) {
    for (const mode of ['light', 'dark']) {
      const r = contrast(color[mode][p.fg], color[mode][p.bg]);
      if (r < (p.large ? 3 : 4.5)) fails.push(`${mode} ${p.fg}/${p.bg} ${r.toFixed(2)}`);
    }
  }
  check('WCAG 2.2 AA contrast for every text pair (light + dark)', fails.length === 0, fails.join(' | ') || `${textPairs.length * 2} pairs`);
}

const server = await startServer();
const browser = await chromium.launch();
try {
  await mkdir(OUT, { recursive: true });
  await staticChecks();
  await budgets(browser);
  await intro(browser);
  await navigation(browser);
  await a11y(browser);
  await screenshots(browser);
} finally {
  await browser.close();
  server?.kill();
}
const failed = results.filter((r) => !r.ok);
const md = `# Verification\n\n${results.map((r) => `- ${r.ok ? '✅' : '❌'} ${r.name}${r.detail ? ` — ${r.detail}` : ''}`).join('\n')}\n`;
await writeFile(join(OUT, 'report.md'), md);
console.log(`\n${results.length - failed.length}/${results.length} checks passed → ${join(OUT, 'report.md')}`);
process.exit(failed.length ? 1 : 0);
