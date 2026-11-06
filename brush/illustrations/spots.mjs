// Spot illustrations (≤ 7 strokes each): paper plane, lantern, open loop.
import { curve, arc, line, join, hand } from '../lib/shapes.mjs';

const D = 2.2;
const P = 6.5;

export default [
  {
    id: 'plane',
    component: 'SpotPlane',
    kind: 'spot',
    title: 'Paper plane',
    label: 'A paper plane taking off, trailing a brush stroke',
    viewBox: [0, 0, 240, 240],
    display1440: [260],
    budget: 1600,
    strokes: [
      { brush: 'dry', size: 9, points: hand(curve([16, 220], [34, 196], [38, 160], [46, 128]), 2, 1.5) },
      { brush: 'primary', size: P, points: line([216, 46], [44, 116], 12) },
      { brush: 'primary', size: P, points: line([216, 46], [100, 164], 12) },
      { brush: 'detail', size: D, points: line([212, 50], [90, 128], 10) },
      { brush: 'detail', size: D, points: join(line([48, 118], [90, 128], 5), line([90, 128], [100, 160], 5)) },
      { brush: 'dry', size: 15, tone: 'wash', points: curve([112, 186], [150, 176], [190, 140], [224, 84]) },
    ],
  },
  {
    id: 'lantern',
    component: 'SpotLantern',
    kind: 'spot',
    title: 'Lantern',
    label: 'A small lantern with an indigo flame',
    viewBox: [0, 0, 240, 240],
    display1440: [260],
    budget: 1600,
    strokes: [
      { brush: 'detail', size: D, points: arc(120, 54, 20, 18, 180, 360) },
      { brush: 'primary', size: P, points: line([88, 66], [152, 64], 8) },
      { brush: 'primary', size: P, points: curve([94, 72], [76, 110], [76, 152], [94, 190]) },
      { brush: 'primary', size: P, points: curve([146, 72], [164, 110], [164, 152], [146, 190]) },
      { brush: 'primary', size: P, points: line([86, 196], [154, 194], 8) },
      { brush: 'detail', size: D, tone: 'indigo', points: curve([120, 152], [104, 138], [114, 116], [122, 104]) },
      { brush: 'dry', size: 14, tone: 'wash', points: curve([150, 210], [176, 206], [200, 196], [222, 178]) },
    ],
  },
  {
    id: 'openloop',
    component: 'SpotOpenLoop',
    kind: 'spot',
    title: 'Open loop',
    label: 'A single open loop of ink',
    viewBox: [0, 0, 240, 240],
    display1440: [260],
    budget: 1100,
    strokes: [
      { brush: 'dry', size: 11, points: hand(join(
        curve([16, 176], [76, 176], [146, 156], [156, 106]),
        curve([156, 106], [164, 64], [108, 54], [102, 94]),
        curve([102, 94], [96, 134], [168, 154], [228, 124]),
      ), 6, 1.4) },
    ],
  },
];
