// "How I led": one thread drawn between five placeholder team members.
// anchors are exported to the manifest so the HTML labels can sit on them.
import { curve, arc, join, hand } from '../lib/shapes.mjs';

const A = [70, 150];
const B = [220, 84];
const C = [360, 160];
const D = [500, 74];
const E = [650, 142];

export default {
  id: 'thread',
  component: 'LeadThread',
  kind: 'spot',
  title: 'Thread between team members',
  decorative: true,
  viewBox: [0, 0, 720, 240],
  display1440: 720,
  budget: 2400,
  anchors: [A, B, C, D, E],
  strokes: [
    { brush: 'primary', size: 6, points: hand(join(
      curve(A, [120, 60], [170, 54], B),
      curve(B, [270, 112], [300, 196], C),
      curve(C, [420, 128], [440, 50], D),
      curve(D, [560, 96], [600, 170], E),
    ), 8, 2) },
    ...[A, B, C, D, E].map(([x, y]) => ({ brush: 'detail', size: 3, points: arc(x, y, 13, 13, -100, 220, 18) })),
  ],
};
