/*
 * About (/about, glacier). Server-only page text. Photos without a fixed slot
 * (about-mountain, about-tcg2 and about-og, the Open Graph image) are in
 * content/images.ts for Layout to use as breakers. The topography label,
 * attribution and placeholder note are the existing copy.
 */
import type { About } from '../schema'

export const about: About = {
  title: 'About',
  lead: 'I grew up between two lakes and still think in contour lines.',
  story: {
    label: 'Story',
    image: 'about-roots',
    body: [
      "I was born in Interlaken in 1988, on the strip of flat land between Lake Thun and Lake Brienz. My first job was an apprenticeship as a Mediamatiker in Thun, building websites for hotels in the Oberland — which taught me that people don't read, they scan for the thing they came for.",
      "I spent five years as a front-end developer at a Bern agency before a Hyper Island programme in Stockholm changed how I think about teams. I came back more interested in how people decide together than in any single screen, and I've been designing workshops ever since.",
      'After three years as a UX designer at a Zurich agency, I joined Lindengrund in 2018 to work on public services. In 2021 I became UX Team Lead. I still design and prototype every week, because leading a design team from a distance never works for long.',
    ],
  },
  timeline: {
    label: 'Timeline',
    title: 'Timeline',
    items: [
      { years: '2004–2008', title: 'Apprenticeship as Mediamatiker, Thun' },
      { years: '2008–2013', title: 'Front-end developer, digital agency, Bern' },
      {
        years: '2011–2014',
        title: 'BSc in Multimedia Production (part-time), a Swiss university of applied sciences',
      },
      {
        years: '2015',
        title: 'Hyper Island programme, Stockholm — facilitation, team dynamics, digital experience design',
      },
      { years: '2015–2018', title: 'UX designer, digital agency, Zurich' },
      { years: '2018–2021', title: 'Senior UX designer, Lindengrund Informatik, Bern' },
      { years: '2021–today', title: 'UX Team Lead and Senior UX Designer, Lindengrund Informatik' },
    ],
  },
  howIWork: {
    label: 'How I work',
    title: 'How I work',
    items: [
      {
        title: 'Start with the question, not the screen.',
        body: 'Every project gets a research question before it gets a wireframe.',
      },
      { title: 'Draw it together.', body: 'A shared picture on a wall beats ten aligned slide decks.' },
      {
        title: 'Prototype in the real material.',
        body: "Often that's code, because public services break at the edges.",
      },
      { title: "Say what you'd do differently.", body: 'Out loud, in the retro, before anyone asks.' },
    ],
  },
  tcg: {
    label: 'At the table',
    title: 'At the table',
    image: 'about-tcg',
    body: 'I play One Piece TCG at a local store on Friday evenings, Magic: The Gathering in a Commander group that has met monthly since 2016, and Yu-Gi-Oh! when my nephew wins the argument. Card games have taught me more about systems design than most books: every card is a component, every format a set of constraints, and the best decks are the ones where everything works together.',
    lessons: [
      {
        title: 'Sequencing matters.',
        body: 'The right card at the wrong time is the wrong card. Same with features.',
      },
      { title: 'Read the table.', body: "Watch what people do, not what they say they'll do." },
      {
        title: 'Build for the meta, not the dream.',
        body: 'Design for the real constraints, not the ideal user.',
      },
    ],
    stats: '14 sleeved decks · Top 8 at a regional One Piece event (2025) · 3 playmats, one too many',
  },
  roots: {
    label: 'Roots',
    title: 'Interlaken',
    image: 'about-lake',
    body: "Interlaken sits between two lakes, overlooked by the Eiger, Mönch and Jungfrau. The contour lines behind this page are its terrain. Growing up there, you learn early that a map is a model — useful precisely because it leaves things out. That's still how I think about design.",
  },
  onTheTable: {
    label: 'On the table',
    title: "What's on the table",
    items: [
      { label: 'Reading', value: 'Thinking in Systems, Donella Meadows' },
      { label: 'Building', value: 'A token pipeline for Allmend 3.0' },
      { label: 'Learning', value: 'Japanese, one card text at a time' },
      { label: 'Planning', value: 'Finally hiking the Hardergrat' },
      { label: 'Brewing', value: 'A V60 every morning, light roast' },
    ],
  },
  creditsTitle: 'Photo credits',
  topo: {
    label: 'Contour map of the Lake Thun area',
    attribution: 'Contours derived from swissALTI3D – Source: Federal Office of Topography swisstopo',
    placeholderNote: 'Placeholder terrain generated from noise until the real data is built (see scripts/topo).',
  },
}
