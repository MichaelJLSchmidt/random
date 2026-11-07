/*
 * Used only when the optional motion-plus package is not installed (builds
 * without MOTION_TOKEN, e.g. the static preview). Same call shape as
 * motion-plus splitText, word level only.
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
