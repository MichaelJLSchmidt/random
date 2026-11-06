// Home hero: sketch → structure → system.
// A sketched loop (the idea) runs into a wake that lifts a paper plane;
// stepping stones give it structure; four indigo rules are the system.
// Light comes from the top left, so wash shadows fall below-right.
import { curve, arc, line, join, hand } from '../lib/shapes.mjs';

export default {
  id: 'hero',
  kind: 'hero',
  title: 'Hero: sketch, structure, system',
  label: 'A brush-drawn loop trails into a paper plane, over stepping stones and a small grid of indigo lines',
  viewBox: [0, 0, 720, 640],
  display1440: 700,
  budget: 3800,
  strokes: [
    // sketch — the loop
    { brush: 'dry', size: 13, points: hand(join(
      curve([58, 512], [110, 506], [168, 486], [204, 436]),
      curve([204, 436], [236, 390], [206, 348], [170, 362]),
      curve([170, 362], [128, 380], [138, 444], [190, 472]),
      curve([190, 472], [232, 494], [292, 490], [344, 470]),
    ), 3, 2) },
    // the wake rising toward the plane
    { brush: 'dry', size: 9, points: hand(curve([352, 466], [430, 436], [440, 300], [498, 222]), 5, 2.5) },
    // paper plane
    { brush: 'primary', size: 9, points: hand(line([664, 118], [500, 180], 14), 7, 1.4) },
    { brush: 'primary', size: 8, points: hand(line([664, 118], [550, 236], 12), 9, 1.2) },
    { brush: 'detail', size: 3, points: line([660, 122], [542, 198], 10) },
    { brush: 'detail', size: 3, points: join(line([504, 182], [544, 198], 5), line([544, 198], [552, 232], 5)) },
    { brush: 'dry', size: 26, tone: 'wash', points: curve([560, 268], [600, 246], [650, 214], [690, 170]) },
    // structure — stepping stones
    { brush: 'primary', size: 8, points: arc(318, 566, 46, 13, 165, 480) },
    { brush: 'primary', size: 8, points: arc(440, 522, 40, 11, 165, 480) },
    { brush: 'primary', size: 8, points: arc(552, 474, 34, 10, 165, 480) },
    { brush: 'dry', size: 22, tone: 'wash', points: curve([300, 596], [400, 584], [520, 540], [612, 496]) },
    // system — indigo rules
    { brush: 'detail', size: 3, tone: 'indigo', points: line([574, 296], [574, 404], 10) },
    { brush: 'detail', size: 3, tone: 'indigo', points: line([574, 314], [692, 314], 10) },
    { brush: 'detail', size: 3, tone: 'indigo', points: line([574, 344], [668, 344], 10) },
    { brush: 'detail', size: 3, tone: 'indigo', points: line([574, 374], [640, 374], 10) },
  ],
};
