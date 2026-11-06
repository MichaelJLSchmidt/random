// Helpers for authoring centrelines. Every helper returns an ordered list
// of [x, y] points in drawing direction. Compose them with `join`.

const rad = (deg) => (deg * Math.PI) / 180;

export function line(a, b, n = 8) {
  const out = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]);
  }
  return out;
}

/** Cubic Bézier from a to b with control points c1, c2. */
export function curve(a, c1, c2, b, n = 18) {
  const out = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const u = 1 - t;
    out.push([
      u * u * u * a[0] + 3 * u * u * t * c1[0] + 3 * u * t * t * c2[0] + t * t * t * b[0],
      u * u * u * a[1] + 3 * u * u * t * c1[1] + 3 * u * t * t * c2[1] + t * t * t * b[1],
    ]);
  }
  return out;
}

/** Elliptical arc. Angles in degrees, 0 = +x, 90 = down (SVG space). */
export function arc(cx, cy, rx, ry, from, to, n) {
  const steps = n ?? Math.max(8, Math.round(Math.abs(to - from) / 8));
  const out = [];
  for (let i = 0; i <= steps; i++) {
    const a = rad(from + ((to - from) * i) / steps);
    out.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]);
  }
  return out;
}

/** Join segments, dropping duplicated joint points. */
export function join(...segments) {
  const out = [];
  for (const seg of segments) {
    for (const p of seg) {
      const last = out[out.length - 1];
      if (last && Math.hypot(last[0] - p[0], last[1] - p[1]) < 0.01) continue;
      out.push(p);
    }
  }
  return out;
}

/** Translate / scale a point list. */
export function move(points, dx = 0, dy = 0, s = 1) {
  return points.map(([x, y]) => [x * s + dx, y * s + dy]);
}

/**
 * A human hand: low-frequency, deterministic wobble perpendicular to the
 * path. `amp` in viewBox units. Ends stay put so joints remain intentional.
 */
export function hand(points, seed = 1, amp = 1.2) {
  const n = points.length;
  if (n < 3) return points;
  return points.map(([x, y], i) => {
    const t = i / (n - 1);
    const prev = points[Math.max(0, i - 1)];
    const next = points[Math.min(n - 1, i + 1)];
    let nx = -(next[1] - prev[1]);
    let ny = next[0] - prev[0];
    const len = Math.hypot(nx, ny) || 1;
    nx /= len;
    ny /= len;
    const env = Math.sin(Math.PI * t);
    const w = Math.sin(t * 5.3 + seed * 1.7) * 0.6 + Math.sin(t * 11.1 + seed * 3.1) * 0.4;
    return [x + nx * w * amp * env, y + ny * w * amp * env];
  });
}
