import { trigger } from './registry'

/*
 * Keyboard shortcuts (loaded when the browser is idle): M Mulligan, D workshop
 * card, T tap, ? shortcut sheet, and typing "shuffle". Ignored inside fields,
 * with modifier keys, and while a dialog is open.
 */
const WORD = 'shuffle'

export function startKeys() {
  let typed = ''
  const onKey = (event: KeyboardEvent) => {
    if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey) return
    const target = event.target as HTMLElement | null
    if (target?.closest('input, textarea, select, [contenteditable=""], [contenteditable="true"], dialog[open]')) return
    const key = event.key
    if (key.length === 1) typed = (typed + key.toLowerCase()).slice(-WORD.length)
    if (typed === WORD) {
      typed = ''
      trigger('shuffle')
      return
    }
    if (key === '?') trigger('shortcuts')
    else if (key === 'm' || key === 'M') trigger('mulligan')
    else if (key === 'd' || key === 'D') trigger('workshop')
    else if (key === 't' || key === 'T') trigger('tap', document.activeElement)
  }
  document.addEventListener('keydown', onKey)
  return () => document.removeEventListener('keydown', onKey)
}
