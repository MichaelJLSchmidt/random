// The three INKWAKE brushes. Every generated stroke uses one of these.
// Values feed perfect-freehand (size is set per stroke, in viewBox units).
//
// pressure(t) describes one breath along the stroke (t = 0..1 by length):
// a blunt, slightly pooled entry, thinning through the middle, and a
// dry-brush exit that the end taper finishes.

const pooled = (pool, mid) => (t) =>
  Math.min(1, mid + pool * Math.exp(-((t / 0.07) ** 2)) - 0.1 * Math.sin(Math.PI * t) + 0.06 * t);

export const BRUSHES = {
  primary: {
    label: 'Primary',
    use: 'Main contour strokes. One breath, blunt pooled entry, tapering exit.',
    thinning: 0.45,
    smoothing: 0.62,
    streamline: 0.42,
    startTaper: 0, // blunt
    endTaper: 0.38, // fraction of stroke length
    pressure: pooled(0.3, 0.58),
    edgeGrain: 0.035, // edge modulation by the grain field (fraction of size)
    bristles: { count: 3, from: 0.72, spread: 0.32, size: 0.24 },
  },
  dry: {
    label: 'Dry',
    use: 'Washes, wakes and trails. Less ink: thins hard and breaks into bristles.',
    thinning: 0.62,
    smoothing: 0.5,
    streamline: 0.34,
    startTaper: 0,
    endTaper: 0.5,
    pressure: pooled(0.22, 0.56),
    edgeGrain: 0.06,
    bristles: { count: 6, from: 0.55, spread: 0.4, size: 0.2 },
  },
  detail: {
    label: 'Detail',
    use: 'Annotations, folds and ticks. Even pressure, short tapers.',
    thinning: 0.22,
    smoothing: 0.7,
    streamline: 0.5,
    startTaper: 0.06,
    endTaper: 0.22,
    pressure: pooled(0.08, 0.6),
    edgeGrain: 0.015,
    bristles: null,
  },
};

export const BRUSH_NAMES = Object.keys(BRUSHES);
