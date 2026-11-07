/**
 * Text with a foil-filled duplicate for the glyph-clipped Glint
 * (glintText in src/motion/glint.ts). Screen readers get the text once.
 */
export function GlintText({ children }: { children: string }) {
  return (
    <span className="gt">
      <span>{children}</span>
      <span className="gt-glint" aria-hidden="true" data-glint-text="">
        {children}
      </span>
    </span>
  )
}

/**
 * A bold title for hover (fine pointers): it rests in the secondary colour,
 * a primary-colour copy sweeps in left to right through clip-path, and the
 * Glint trails 80 ms behind, clipped to the glyphs. The host is the closest
 * link or [data-fill-host] element.
 */
export function TitleFill({ children }: { children: string }) {
  return (
    <span className="gt tf">
      <span className="tf-base">{children}</span>
      <span className="tf-fill" aria-hidden="true">
        {children}
      </span>
      <span className="gt-glint" aria-hidden="true" data-glint-text="">
        {children}
      </span>
    </span>
  )
}
