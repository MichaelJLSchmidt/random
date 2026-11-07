/**
 * A bold title for hover (fine pointers): it rests in the secondary colour and
 * a primary copy sweeps in left to right (450 ms, clip-path). The host is the
 * closest link or [data-fill-host] element.
 */
export function TitleFill({ children }: { children: string }) {
  return (
    <span className="fill">
      <span className="fill-base">{children}</span>
      <span className="fill-copy" aria-hidden="true">
        {children}
      </span>
    </span>
  )
}
