// Toolbox icons: 24 px grid, centreline strokes, detail brush.
import { arc, line, join } from '../lib/shapes.mjs';

const S = 1.6;
const icon = (id, title, strokes) => ({
  id: `icon-${id}`,
  component: `Icon${id[0].toUpperCase()}${id.slice(1)}`,
  kind: 'icon',
  title,
  decorative: true,
  viewBox: [0, 0, 24, 24],
  display1440: 40,
  budget: 520,
  strokes: strokes.map((points) => ({ brush: 'detail', size: S, points })),
});

export default [
  icon('research', 'Research', [arc(10, 10, 6, 6, -40, 280, 24), line([14.6, 14.6], [20, 20], 6)]),
  icon('workshop', 'Workshops', [
    join(line([4, 8], [4, 19.5], 6), line([4, 19.5], [15.5, 19.5], 6)),
    join(line([8.5, 4], [20, 4], 6), line([20, 4], [20, 15.5], 6), line([20, 15.5], [8.5, 15.5], 6)),
  ]),
  icon('prototype', 'Prototyping', [line([6.5, 17.5], [16.5, 7.5], 8), line([14.6, 5.4], [18.6, 9.4], 4), line([4, 20], [8.5, 20], 4)]),
  icon('systems', 'Design systems', [line([4, 9], [20, 9], 8), line([4, 15], [20, 15], 8), line([10, 4], [10, 20], 8)]),
  icon('facilitation', 'Facilitation', [arc(12, 10.5, 8, 6, 115, 420, 28), line([8.4, 15.8], [6, 21], 4)]),
  icon('metrics', 'Metrics', [line([5, 20], [5, 13], 5), line([11, 20], [11, 8], 6), line([17, 20], [17, 4], 8)]),
  icon('access', 'Accessibility', [arc(12, 4.6, 2.3, 2.3, -60, 250, 14), line([5, 9.5], [19, 9.5], 8), join(line([12, 9.5], [12, 14], 4), line([12, 14], [8, 21], 5)), line([12, 14], [16, 21], 5)]),
  icon('mentoring', 'Mentoring', [arc(12, 14, 8, 8, 180, 360, 22), arc(12, 14, 3.5, 3.5, 180, 360, 12), line([10.4, 20.6], [13.6, 20.4], 4)]),
];
