/*
 * Colour identities. Each has field / mid / glow / accent / ink. Single source
 * for CSS (identityCss(), injected in the root layout) and the background
 * shader. Rules: body text is always `text` on fields; accents only for links,
 * focus rings, metrics and dividers; text on glow surfaces uses the identity's
 * ink, never white.
 */
export type Identity = 'ink' | 'ember' | 'tide' | 'grove' | 'saffron' | 'glacier'

export type Swatch = { field: string; mid: string; glow: string; accent: string; ink: string }

export const text = '#ECEAE4'
export const muted = '#9A9890'

export const palette: Record<Identity, Swatch> = {
  // Home. accent and ink are not given by the spec: a light warm grey for
  // links/focus and the field itself for text on glow.
  ink: { field: '#0E0F11', mid: '#1A1C20', glow: '#2A2D33', accent: '#D6D3CA', ink: '#0E0F11' },
  ember: { field: '#2A0E0C', mid: '#7A1F17', glow: '#E2553D', accent: '#FF8A73', ink: '#140806' },
  tide: { field: '#0A1A2B', mid: '#13406E', glow: '#3D8BDA', accent: '#8CC4FF', ink: '#06101A' },
  grove: { field: '#0C1F17', mid: '#1E5A3E', glow: '#3FAF7A', accent: '#8FE0B5', ink: '#06120C' },
  saffron: { field: '#241A06', mid: '#6B4E0E', glow: '#E8B23A', accent: '#F5CF73', ink: '#171004' },
  // About. The spec gives field, mid, lines and text; glow and ink are derived
  // (glow sits between mid and the contour colour).
  glacier: { field: '#0B1A1C', mid: '#14393B', glow: '#2C6E6C', accent: '#5FB3B0', ink: '#061011' },
}

/** About's text colour on the contour field. */
export const glacierText = '#DCE8E6'

/**
 * About's contour field: the old password page's ground. Its lines (#8A8C80)
 * live in the SVGs themselves (public/contour-bg/).
 */
export const contour = { ground: '#1B1C18' } as const

export const identities = Object.keys(palette) as Identity[]

/**
 * CSS custom properties for every identity, plus [data-identity] scopes. Each
 * scope also re-declares --accent, so it follows the scope's --id-accent
 * (declared only on :root it would resolve once, to the ink accent).
 */
export function identityCss(): string {
  const root = [
    `--text:${text}`,
    `--muted:${muted}`,
    `--glacier-text:${glacierText}`,
    `--contour-ground:${contour.ground}`,
  ]
  for (const id of identities) {
    for (const [k, v] of Object.entries(palette[id])) root.push(`--${id}-${k}:${v}`)
  }
  const scopes = identities
    .map(
      (id) =>
        `[data-identity="${id}"]{--id-field:var(--${id}-field);--id-mid:var(--${id}-mid);--id-glow:var(--${id}-glow);--id-accent:var(--${id}-accent);--id-ink:var(--${id}-ink);--accent:var(--id-accent)}`,
    )
    .join('')
  return `:root{${root.join(';')}}${scopes}`
}
