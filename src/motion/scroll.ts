import { scroll as onScroll } from 'motion'
import { scroll, weight } from './tokens'

/*
 * Scroll behaviour for the current page (full tier only; loaded on demand).
 *   Sections ([data-reveal] and the blocks of .prose) that start below the
 *   fold reveal once when 35% in view: they rise 24 px (narrow) / 40 px (wide)
 *   and fade in over 420 ms, ease-out (CSS, see scroll.css).
 *   Section titles below the fold rise line by line from a clipping mask while
 *   their weight goes from 400 to 680.
 *   The case-study statement fills word by word from 200 to 760 as it
 *   crosses the viewport (scroll-linked, reading order).
 * Calm and reduced never load this module; CSS shows every final state.
 */
export function setupScroll(main: HTMLElement) {
  const cleanups: (() => void)[] = []
  const viewport = innerHeight

  const reveal = (el: HTMLElement, onIn: () => void) => {
    const box = el.getBoundingClientRect()
    if (box.top < viewport) return // visible (or passed) at load: stays as it is
    const threshold = Math.min(scroll.revealAt, (scroll.revealAt * viewport) / Math.max(box.height, 1))
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return
        observer.disconnect()
        onIn()
      },
      { threshold },
    )
    observer.observe(el)
    cleanups.push(() => observer.disconnect())
    return true
  }

  for (const el of main.querySelectorAll<HTMLElement>('[data-reveal], .prose > :not(h2)')) {
    if (reveal(el, () => (el.dataset.reveal = 'in'))) el.dataset.reveal = 'pending'
  }

  for (const title of main.querySelectorAll<HTMLElement>('[data-section-title]')) {
    const words = [...title.querySelectorAll<HTMLElement>('.wt-word')]
    let line = -1
    let top = -Infinity
    for (const word of words) {
      if (word.offsetTop > top + 2) {
        line++
        top = word.offsetTop
      }
      word.style.setProperty('--line', String(line))
    }
    if (reveal(title, () => (title.dataset.rise = 'in'))) title.dataset.rise = 'pending'
  }

  for (const statement of main.querySelectorAll<HTMLElement>('[data-statement]')) {
    const words = [...statement.querySelectorAll<HTMLElement>('.wt-word')]
    const from = weight.thin
    const to = weight.statement
    const last: number[] = []
    statement.dataset.live = ''
    cleanups.push(
      onScroll(
        (progress: number) => {
          words.forEach((word, i) => {
            const fill = Math.min(1, Math.max(0, progress * words.length - i))
            const value = Math.round(from + (to - from) * fill)
            if (last[i] === value) return
            last[i] = value
            word.style.setProperty('--wt-target', String(value))
          })
        },
        { target: statement, offset: scroll.statementOffset },
      ),
    )
  }

  return () => cleanups.forEach((stop) => stop())
}
