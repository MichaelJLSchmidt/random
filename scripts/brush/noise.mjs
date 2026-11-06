// Seeded, tileable value noise. One field drives both the paper-grain
// textures and the dry-brush breakup of every generated ink edge, so the
// ink and the paper read as the same material.

export function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hashString(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

const smooth = (t) => t * t * (3 - 2 * t);

/** Create a value-noise lattice of `period` cells that wraps (tileable). */
export function createNoise(seed, px = 64, py = px) {
  const rnd = mulberry32(seed);
  const lattice = new Float32Array(px * py);
  for (let i = 0; i < lattice.length; i++) lattice[i] = rnd();
  const at = (x, y) => lattice[(((y % py) + py) % py) * px + (((x % px) + px) % px)];
  return (x, y) => {
    const xi = Math.floor(x);
    const yi = Math.floor(y);
    const xf = smooth(x - xi);
    const yf = smooth(y - yi);
    const a = at(xi, yi);
    const b = at(xi + 1, yi);
    const c = at(xi, yi + 1);
    const d = at(xi + 1, yi + 1);
    return a + (b - a) * xf + (c - a) * yf + (a - b - c + d) * xf * yf;
  };
}

/**
 * The INKWAKE grain field, in [0, 1]. Fibre-like: stretched low octave,
 * plus fine tooth. `x`/`y` are in texture pixels (tile = 256).
 */
export function createGrain(seed = 0x1a7c) {
  const n1 = createNoise(seed, 32, 128); // short horizontal fibres
  const n2 = createNoise(seed + 1, 32);
  const n3 = createNoise(seed + 2, 96);
  const n4 = createNoise(seed + 3, 256);
  const S = 256;
  return (x, y) => {
    const u = x / S;
    const v = y / S;
    // fibres: anisotropic octave (stretched along x), then tooth
    const fibre = n1(u * 32, v * 128);
    const mid = n2(u * 32, v * 32);
    const fine = n3(u * 96, v * 96);
    const tooth = n4(u * 256, v * 256);
    return Math.min(1, Math.max(0, fibre * 0.2 + mid * 0.22 + fine * 0.26 + tooth * 0.32));
  };
}
