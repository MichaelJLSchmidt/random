/*
 * Stand-in for the parts of motion-plus this site uses, for installs without
 * MOTION_TOKEN (next.config.ts aliases the module here). Same call shapes,
 * simpler behaviour.
 */
export function splitText(element: Element, { wordClass = 'split-word' }: { wordClass?: string } = {}) {
  const text = element.textContent ?? ''
  element.textContent = ''
  const words = text.split(' ').map((word, i, all) => {
    const span = document.createElement('span')
    span.className = wordClass
    span.style.display = 'inline-block'
    span.textContent = word
    element.appendChild(span)
    if (i < all.length - 1) element.appendChild(document.createTextNode(' '))
    return span
  })
  return { chars: [] as HTMLSpanElement[], words, lines: [] as HTMLSpanElement[] }
}
