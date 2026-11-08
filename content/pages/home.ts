/* Home (/). Server-only page text. */
import type { Home } from '../schema'

export const home: Home = {
  label: 'Bern, Switzerland — UX Team Lead',
  title: 'Moritz Lauber',
  role: 'UX Team Lead and Senior UX Designer at Lindengrund Informatik',
  intro:
    'I lead a team of five designers and a researcher who make digital public services clearer — for the people who use them and the people who run them. My work sits between UX design, product strategy and front-end code. Most weeks, it starts with a workshop.',
  hint: 'Pick a card',
  onTheTableNow: {
    label: 'On the table now',
    items: [
      'Allmend 3.0 design tokens',
      'A service blueprint jam with a cantonal tax office',
      'Hiring nobody, growing everybody',
    ],
  },
}
