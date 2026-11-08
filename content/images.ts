import type { ImageEntry } from './schema'

/*
 * Image registry: every image the site shows, by id. <Picture id> reads it.
 * Owned by the Content & Images session (scripts/images writes the local
 * renditions to public/images/<id>-<width>.<ext>; ext avif, webp or jpg).
 *
 * Local renditions:  local: { widths: [640, 1280], formats: ['avif', 'webp', 'jpeg'] }
 * Hotlinked source:  remote: { src: 'https://example.org/photo.jpg?w={w}', widths: [640, 1280] }
 * Photos:            kind: 'photo' plus photographer, photographerUrl and pageUrl (required;
 *                    the About colophon credits and links each one)
 * Placeholders:      kind: 'generated' (credit fields optional)
 *
 * The three entries below are generated placeholders (scripts/images/placeholders.mjs):
 * soft gradients in each case study's colour identity, decorative (alt "").
 */
export const images = {
  'team-of-teams-hero': {
    kind: 'generated',
    alt: '',
    width: 1280,
    height: 720,
    local: { widths: [640, 1280], formats: ['webp', 'jpeg'] },
    placeholder: '#2A0E0C',
  },
  'shared-foundations-hero': {
    kind: 'generated',
    alt: '',
    width: 1280,
    height: 720,
    local: { widths: [640, 1280], formats: ['webp', 'jpeg'] },
    placeholder: '#0A1A2B',
  },
  'front-door-hero': {
    kind: 'generated',
    alt: '',
    width: 1280,
    height: 720,
    local: { widths: [640, 1280], formats: ['webp', 'jpeg'] },
    placeholder: '#0C1F17',
  },
} satisfies Record<string, ImageEntry>

export type ImageId = keyof typeof images
