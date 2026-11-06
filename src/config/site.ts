// All personal content lives here. Every value is a neutral placeholder.
// Replace freely; no other file holds names, roles or contact details.

export const site = {
  title: 'Portfolio',
  wordmark: 'folio', // drawn by the brush system (brush/illustrations/ui.mjs)
  monogram: 'FO', // placeholder seal monogram
  owner: 'Your Name',
  role: 'UX Designer & Team Lead',
  location: 'City, Country',
  email: 'hello@example.com',
  description:
    'Placeholder portfolio of a UX designer and team lead, presented in the INKWAKE art direction: sketch, structure, system.',
  social: [
    { label: 'LinkedIn', href: 'https://www.linkedin.com/' },
    { label: 'Read.cv', href: 'https://read.cv/' },
  ],
};

export const nav = [
  { label: 'Work', href: 'work/' },
  { label: 'About', href: 'about/' },
  { label: 'Contact', href: 'contact/' },
  { label: 'System', href: 'system/' },
];

export const home = {
  headline: ['I design the line', 'between sketch', 'and', 'system'],
  signatureWord: 'system',
  lede: 'Placeholder introduction. A UX designer and team lead who turns rough ideas into clear structures, and structures into systems that teams can keep using.',
  approach: [
    { step: 'Sketch', icon: 'prototype', text: 'Make the idea visible early. Draw it, test it, keep what holds.' },
    { step: 'Structure', icon: 'systems', text: 'Give the idea a shape that people can find their way through.' },
    { step: 'System', icon: 'workshop', text: 'Turn the shape into parts a team can reuse with confidence.' },
  ],
};

export const about = {
  headline: 'A quiet hand, a clear line.',
  intro: [
    'Placeholder biography. Leads small design teams through research, concept and delivery. Prefers drawing before deciding and writing before building.',
    'Works across product discovery, interaction design and design systems, and spends roughly a third of the week coaching and unblocking others.',
  ],
  toolbox: [
    { icon: 'research', label: 'Research', note: 'Interviews, diary studies' },
    { icon: 'workshop', label: 'Workshops', note: 'Framing, co-design' },
    { icon: 'prototype', label: 'Prototyping', note: 'Paper to high fidelity' },
    { icon: 'systems', label: 'Design systems', note: 'Tokens, components' },
    { icon: 'facilitation', label: 'Facilitation', note: 'Critique, decisions' },
    { icon: 'metrics', label: 'Metrics', note: 'Task success, adoption' },
    { icon: 'access', label: 'Accessibility', note: 'WCAG 2.2 AA' },
    { icon: 'mentoring', label: 'Mentoring', note: 'Career growth' },
  ],
  timeline: [
    { when: '2023 — now', title: 'Design Lead', body: 'Placeholder company. Leads a team of five across two product areas.' },
    { when: '2020 — 2023', title: 'Senior UX Designer', body: 'Placeholder company. Owned the onboarding and settings journeys.' },
    { when: '2017 — 2020', title: 'UX Designer', body: 'Placeholder agency. Research and interaction design for client products.' },
    { when: '2014 — 2017', title: 'Visual Designer', body: 'Placeholder studio. Editorial and brand work.' },
  ],
  principles: [
    'Draw before you decide.',
    'Structure is a kindness.',
    'Leave room for the next hand.',
    'Ship the smallest true thing.',
  ],
};

export const contact = {
  headline: 'Say hello',
  body: 'Placeholder text. Open to conversations about design leadership, product teams and design systems. Replies within a few days.',
  availability: 'Placeholder: available from next quarter',
};

/** Placeholder team for the "How I led" thread (5 anchors in thread.mjs). */
export const team = ['Researcher', 'Product manager', 'Design lead', 'Engineer', 'Content designer'];
