// /system technique specimens: the same centreline rendered with and
// without the grain (edge modulation + dry-brush breakup).
import { curve } from '../lib/shapes.mjs';

export const SPECIMEN_LINE = curve([20, 112], [96, 16], [210, 150], [300, 46], 24);

const base = {
  kind: 'spot',
  decorative: true,
  viewBox: [0, 0, 320, 160],
  display1440: 320,
  strokes: [{ brush: 'primary', size: 10, duration: 1100, points: SPECIMEN_LINE }],
  exportCentrelines: true,
};

export default [
  { ...base, id: 'specimen', component: 'Specimen', title: 'Specimen: mask + grain' },
  { ...base, id: 'specimen-clean', component: 'SpecimenClean', title: 'Specimen: mask only', grain: false },
];
