// Geometry helpers for the brush pipeline.
import { optimize } from 'svgo';

export const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);

/** Catmull-Rom spline through points, as cubic Bézier segments. */
export function catmullToBezier(points) {
  const segs = [];
  const n = points.length;
  for (let i = 0; i < n - 1; i++) {
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(n - 1, i + 2)];
    segs.push([
      p1,
      [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6],
      [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6],
      p2,
    ]);
  }
  return segs;
}

const bez = (s, t) => {
  const u = 1 - t;
  return [
    u * u * u * s[0][0] + 3 * u * u * t * s[1][0] + 3 * u * t * t * s[2][0] + t * t * t * s[3][0],
    u * u * u * s[0][1] + 3 * u * u * t * s[1][1] + 3 * u * t * t * s[2][1] + t * t * t * s[3][1],
  ];
};

/** Dense, arc-length-uniform samples along the spline. Each: [x, y, t]. */
export function sampleSpline(points, spacing) {
  const segs = catmullToBezier(points);
  const dense = [points[0]];
  for (const s of segs) {
    const approx = dist(s[0], s[1]) + dist(s[1], s[2]) + dist(s[2], s[3]);
    const k = Math.max(4, Math.ceil(approx / (spacing * 0.25)));
    for (let j = 1; j <= k; j++) dense.push(bez(s, j / k));
  }
  // cumulative length
  const cum = [0];
  for (let i = 1; i < dense.length; i++) cum.push(cum[i - 1] + dist(dense[i - 1], dense[i]));
  const total = cum[cum.length - 1];
  const count = Math.max(2, Math.round(total / spacing));
  const out = [];
  let j = 0;
  for (let i = 0; i <= count; i++) {
    const target = (total * i) / count;
    while (j < cum.length - 2 && cum[j + 1] < target) j++;
    const seg = cum[j + 1] - cum[j] || 1;
    const f = (target - cum[j]) / seg;
    out.push([
      dense[j][0] + (dense[j + 1][0] - dense[j][0]) * f,
      dense[j][1] + (dense[j + 1][1] - dense[j][1]) * f,
      i / count,
    ]);
  }
  return { samples: out, length: total };
}

/** Smooth SVG path (cubic) through the authored centreline points. */
export function centrelinePath(points, fmt) {
  const segs = catmullToBezier(points);
  let d = `M${fmt(points[0][0])} ${fmt(points[0][1])}`;
  for (const s of segs) {
    d += `C${fmt(s[1][0])} ${fmt(s[1][1])} ${fmt(s[2][0])} ${fmt(s[2][1])} ${fmt(s[3][0])} ${fmt(s[3][1])}`;
  }
  return d;
}

/** perfect-freehand outline → smooth closed path (quadratic midpoints). */
export function outlineToPath(pts, fmt) {
  const len = pts.length;
  if (len < 4) return '';
  const avg = (a, b) => (a + b) / 2;
  let a = pts[0];
  let b = pts[1];
  const c = pts[2];
  let d = `M${fmt(a[0])} ${fmt(a[1])}Q${fmt(b[0])} ${fmt(b[1])} ${fmt(avg(b[0], c[0]))} ${fmt(avg(b[1], c[1]))}T`;
  for (let i = 2; i < len - 1; i++) {
    a = pts[i];
    b = pts[i + 1];
    d += `${fmt(avg(a[0], b[0]))} ${fmt(avg(a[1], b[1]))} `;
  }
  return d.trim() + 'Z';
}

/** Offset a polyline sideways by `offset(t)` (positive = left of travel). */
export function offsetSamples(samples, offset) {
  return samples.map((p, i) => {
    const prev = samples[Math.max(0, i - 1)];
    const next = samples[Math.min(samples.length - 1, i + 1)];
    let nx = -(next[1] - prev[1]);
    let ny = next[0] - prev[0];
    const l = Math.hypot(nx, ny) || 1;
    nx /= l;
    ny /= l;
    const o = offset(p[2]);
    return [p[0] + nx * o, p[1] + ny * o, p[2]];
  });
}

/** Displace a closed outline along its normals by f(x, y) (units). */
export function modulateOutline(pts, f) {
  const n = pts.length;
  return pts.map((p, i) => {
    const prev = pts[(i - 1 + n) % n];
    const next = pts[(i + 1) % n];
    let nx = -(next[1] - prev[1]);
    let ny = next[0] - prev[0];
    const l = Math.hypot(nx, ny) || 1;
    nx /= l;
    ny /= l;
    const o = f(p[0], p[1]);
    return [p[0] + nx * o, p[1] + ny * o];
  });
}

export function polygonArea(pts) {
  let a = 0;
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i];
    const q = pts[(i + 1) % pts.length];
    a += p[0] * q[1] - q[0] * p[1];
  }
  return Math.abs(a / 2);
}

/**
 * Flatten any SVG path `d` into points (used for scanned art). SVGO first
 * rewrites it with absolute commands; arcs must be converted to curves on export.
 * Returns points with t = 0..1 by length, and the total length.
 */
export function samplePathD(d, step = 1) {
  const abs = optimize(`<svg><path d="${d}"/></svg>`, {
    plugins: [{ name: 'convertPathData', params: { forceAbsolutePath: true, floatPrecision: 4, makeArcs: false } }],
  }).data.match(/ d="([^"]+)"/)[1];
  if (/[Aa]/.test(abs)) throw new Error('scanned paths must not contain arcs; convert arcs to curves on export');
  const tokens = abs.match(/[MLHVCSQTZ]|-?(?:\d+\.?\d*|\.\d+)(?:e-?\d+)?/gi);
  const pts = [];
  let i = 0;
  let cmd = '';
  let cur = [0, 0];
  let start = [0, 0];
  let lastC = null; // last cubic control (for S)
  let lastQ = null; // last quadratic control (for T)
  const num = () => Number(tokens[i++]);
  const push = (p) => pts.push(p);
  const cubic = (p0, c1, c2, p3) => {
    const n = Math.max(4, Math.ceil((dist(p0, c1) + dist(c1, c2) + dist(c2, p3)) / step));
    for (let k = 1; k <= n; k++) {
      const t = k / n;
      const u = 1 - t;
      push([
        u * u * u * p0[0] + 3 * u * u * t * c1[0] + 3 * u * t * t * c2[0] + t * t * t * p3[0],
        u * u * u * p0[1] + 3 * u * u * t * c1[1] + 3 * u * t * t * c2[1] + t * t * t * p3[1],
      ]);
    }
  };
  const quad = (p0, c, p2) => cubic(p0, [p0[0] + (2 / 3) * (c[0] - p0[0]), p0[1] + (2 / 3) * (c[1] - p0[1])], [p2[0] + (2 / 3) * (c[0] - p2[0]), p2[1] + (2 / 3) * (c[1] - p2[1])], p2);
  const line = (a, b) => {
    const n = Math.max(1, Math.ceil(dist(a, b) / step));
    for (let k = 1; k <= n; k++) push([a[0] + ((b[0] - a[0]) * k) / n, a[1] + ((b[1] - a[1]) * k) / n]);
  };
  while (i < tokens.length) {
    if (/[a-z]/i.test(tokens[i])) cmd = tokens[i++].toUpperCase();
    else if (cmd === 'M') cmd = 'L'; // implicit lineto after moveto
    let next = cur;
    if (cmd === 'M') {
      next = [num(), num()];
      start = next;
      push(next);
      lastC = lastQ = null;
    } else if (cmd === 'L') {
      next = [num(), num()];
      line(cur, next);
      lastC = lastQ = null;
    } else if (cmd === 'H') {
      next = [num(), cur[1]];
      line(cur, next);
      lastC = lastQ = null;
    } else if (cmd === 'V') {
      next = [cur[0], num()];
      line(cur, next);
      lastC = lastQ = null;
    } else if (cmd === 'C') {
      const c1 = [num(), num()];
      const c2 = [num(), num()];
      next = [num(), num()];
      cubic(cur, c1, c2, next);
      lastC = c2;
      lastQ = null;
    } else if (cmd === 'S') {
      const c1 = lastC ? [2 * cur[0] - lastC[0], 2 * cur[1] - lastC[1]] : cur;
      const c2 = [num(), num()];
      next = [num(), num()];
      cubic(cur, c1, c2, next);
      lastC = c2;
      lastQ = null;
    } else if (cmd === 'Q') {
      const c = [num(), num()];
      next = [num(), num()];
      quad(cur, c, next);
      lastQ = c;
      lastC = null;
    } else if (cmd === 'T') {
      const c = lastQ ? [2 * cur[0] - lastQ[0], 2 * cur[1] - lastQ[1]] : cur;
      next = [num(), num()];
      quad(cur, c, next);
      lastQ = c;
      lastC = null;
    } else if (cmd === 'Z') {
      line(cur, start);
      next = start;
      lastC = lastQ = null;
    } else throw new Error(`unsupported path command ${cmd}`);
    cur = next;
  }
  let total = 0;
  const cum = [0];
  for (let k = 1; k < pts.length; k++) cum.push((total += dist(pts[k - 1], pts[k])));
  return { points: pts.map((p, k) => [p[0], p[1], total ? cum[k] / total : 0]), length: total };
}

/** Widest point of a brush shape: 2 × max distance from outline to centreline. */
export function widestPoint(outlinePts, centreSamples) {
  let max = 0;
  for (const o of outlinePts) {
    let min = Infinity;
    for (const c of centreSamples) {
      const d = (o[0] - c[0]) ** 2 + (o[1] - c[1]) ** 2;
      if (d < min) min = d;
    }
    if (min > max) max = min;
  }
  return 2 * Math.sqrt(max);
}
