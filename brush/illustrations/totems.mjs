// Case-study totems. Each case study owns one object (≤ 7 strokes).
// layer 'line' draws on enter; layer 'paint' is revealed on hover
// (sketch → painted) and drawn in full on the case-study opening.
// Light from the top left: washes fall below-right.
import { curve, arc, line, join, hand } from '../lib/shapes.mjs';

const D = 1.95; // detail size: 2–4 px at both 240 and 420 px display
const P = 6; // primary size: 6–18 px at both display sizes

export default [
  {
    id: 'compass',
    component: 'TotemCompass',
    kind: 'spot',
    title: 'Totem: compass',
    label: 'A compass drawn in a few brush strokes',
    viewBox: [0, 0, 240, 240],
    display1440: [240, 420],
    budget: 1800,
    strokes: [
      { brush: 'primary', size: P, points: arc(120, 126, 72, 72, -50, 255) },
      { brush: 'primary', size: P, points: hand(curve([86, 172], [108, 140], [128, 112], [154, 80]), 2, 1) },
      { brush: 'detail', size: D, points: arc(120, 126, 5, 5, 0, 330, 12) },
      { brush: 'detail', size: D, points: line([120, 36], [120, 56], 6) },
      { brush: 'detail', size: D, points: line([208, 126], [190, 126], 6) },
      { brush: 'dry', size: 15, tone: 'wash', layer: 'paint', points: arc(128, 136, 76, 76, 0, 104) },
      { brush: 'primary', size: 5, tone: 'indigo', layer: 'paint', points: line([124, 122], [151, 86], 8) },
    ],
  },
  {
    id: 'knot',
    component: 'TotemKnot',
    kind: 'spot',
    title: 'Totem: thread and knot',
    label: 'A thread tied into a loose knot',
    viewBox: [0, 0, 240, 240],
    display1440: [240, 420],
    budget: 1800,
    strokes: [
      { brush: 'primary', size: P, points: hand(join(
        curve([22, 150], [60, 150], [90, 140], [112, 112]),
        curve([112, 112], [132, 82], [172, 82], [170, 112]),
        curve([170, 112], [168, 142], [118, 150], [104, 126]),
        curve([104, 126], [94, 108], [150, 98], [218, 92]),
      ), 4, 1.2) },
      { brush: 'detail', size: D, points: curve([34, 184], [90, 178], [150, 164], [206, 152]) },
      { brush: 'detail', size: D, points: arc(64, 180, 6, 6, -90, 250, 12) },
      { brush: 'detail', size: D, points: arc(156, 162, 6, 6, -90, 250, 12) },
      { brush: 'dry', size: 15, tone: 'wash', layer: 'paint', points: curve([70, 200], [110, 210], [170, 200], [214, 176]) },
      { brush: 'primary', size: 5, tone: 'indigo', layer: 'paint', points: arc(141, 112, 24, 24, 200, 300) },
    ],
  },
  {
    id: 'stones',
    component: 'TotemStones',
    kind: 'spot',
    title: 'Totem: stepping stones',
    label: 'Three stepping stones rising across water',
    viewBox: [0, 0, 240, 240],
    display1440: [240, 420],
    budget: 1800,
    strokes: [
      { brush: 'primary', size: P, points: arc(62, 178, 36, 11, 165, 480) },
      { brush: 'primary', size: P, points: arc(124, 138, 32, 10, 165, 480) },
      { brush: 'primary', size: P, points: arc(182, 96, 28, 9, 165, 480) },
      { brush: 'detail', size: D, points: line([28, 204], [98, 202], 8) },
      { brush: 'dry', size: 15, tone: 'wash', layer: 'paint', points: curve([44, 198], [100, 190], [160, 150], [216, 112]) },
      { brush: 'detail', size: D, tone: 'indigo', layer: 'paint', points: curve([18, 224], [80, 214], [150, 216], [226, 204]) },
    ],
  },
];
