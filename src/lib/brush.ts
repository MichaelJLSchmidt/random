/** Replace the generated id placeholder so one illustration can appear twice per page. */
export function prefixed(markup: string, prefix: string): string {
  return markup.replaceAll('__P__', prefix);
}
