/** Base-path-safe internal URL. Every internal link, asset and texture goes through this. */
export function url(path = ''): string {
  const base = import.meta.env.BASE_URL.replace(/\/+$/, '');
  const clean = path.replace(/^\/+/, '');
  return `${base}/${clean}`;
}

/** Is `href` (from url()) the current page or a parent section of it? */
export function isCurrent(href: string, pathname: string): boolean {
  const norm = (p: string) => p.replace(/\/+$/, '') + '/';
  return norm(pathname).startsWith(norm(href));
}
