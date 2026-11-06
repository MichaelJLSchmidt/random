// About: an abstract brush portrait placeholder (≤ 20 strokes).
// Three-quarter view facing left; light from the top left, so the wash
// sits on the right of the face and shoulder. Moss sprig = the page's one
// botanical accent.
import { curve, arc, line, hand } from '../lib/shapes.mjs';

export default {
  id: 'portrait',
  kind: 'portrait',
  title: 'Portrait placeholder',
  label: 'An abstract brush-drawn portrait placeholder: head and shoulders in a few strokes',
  viewBox: [0, 0, 480, 560],
  display1440: 440,
  budget: 4200,
  strokes: [
    { brush: 'primary', size: 9, points: hand(arc(240, 226, 80, 108, 196, -128, 40), 2, 1.5) },
    { brush: 'detail', size: 3, points: curve([170, 212], [160, 234], [158, 250], [172, 258]) },
    { brush: 'dry', size: 14, points: hand(curve([166, 154], [206, 92], [292, 94], [320, 162]), 5, 2) },
    { brush: 'dry', size: 11, points: hand(curve([192, 130], [240, 112], [292, 132], [314, 196]), 6, 2) },
    { brush: 'detail', size: 3, points: curve([302, 176], [322, 204], [320, 242], [302, 266]) },
    { brush: 'detail', size: 3, points: arc(284, 238, 10, 16, -90, 120, 14) },
    { brush: 'detail', size: 3, points: arc(202, 230, 18, 13, -10, 320, 20) },
    { brush: 'detail', size: 3, points: arc(252, 228, 18, 13, -10, 320, 20) },
    { brush: 'detail', size: 3, points: line([220, 228], [234, 227], 4) },
    { brush: 'primary', size: 8, points: line([230, 330], [234, 382], 8) },
    { brush: 'detail', size: 3, points: line([278, 318], [274, 374], 8) },
    { brush: 'primary', size: 9, points: hand(curve([78, 522], [110, 432], [180, 394], [236, 386]), 3, 2) },
    { brush: 'primary', size: 9, points: hand(curve([274, 380], [342, 386], [402, 422], [432, 522]), 4, 2) },
    { brush: 'detail', size: 3, points: curve([206, 398], [230, 432], [262, 430], [290, 390]) },
    { brush: 'dry', size: 20, tone: 'wash', points: curve([304, 184], [322, 242], [304, 302], [270, 334]) },
    { brush: 'dry', size: 24, tone: 'wash', points: curve([306, 424], [362, 434], [402, 474], [420, 532]) },
    { brush: 'detail', size: 3, tone: 'moss', points: curve([104, 506], [116, 470], [138, 446], [166, 432]) },
    { brush: 'detail', size: 3, tone: 'moss', points: curve([128, 462], [116, 446], [120, 430], [136, 424]) },
    { brush: 'detail', size: 3, tone: 'moss', points: curve([148, 444], [150, 426], [166, 418], [180, 420]) },
  ],
};
