'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useRef } from 'react'
import { site } from '@/lib/content'
import { at, duration as D, stagger as S } from '@/motion/tokens'
import { readTier } from '@/motion/use-tier'
import { eggOn } from './registry'

const typing = (el: EventTarget | null) =>
  el instanceof HTMLElement && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName))

/*
 * Global egg wiring: "?" opens the shortcut sheet, M deals a new hand and
 * typing "draw" deals "Coffee?" (start page), and 1 page load in 40 gets a
 * rare card. Each egg's code is imported the first time it fires.
 */
export function Eggs() {
  const path = usePathname().replace(/\/$/, '') || '/'
  const pathRef = useRef(path)
  pathRef.current = path
  const dialog = useRef<HTMLDialogElement>(null)
  const title = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    let buffer = ''
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey || typing(e.target)) return
      if (dialog.current?.open) return
      const home = pathRef.current === '/'
      if (e.key === '?' && eggOn('shortcuts')) {
        e.preventDefault()
        openShortcuts()
        return
      }
      if ((e.key === 'm' || e.key === 'M') && home && eggOn('mulligan')) {
        import('./hand-eggs').then((m) => m.mulligan())
        return
      }
      if (e.key.length === 1) {
        buffer = (buffer + e.key.toLowerCase()).slice(-4)
        if (buffer === 'draw' && home && eggOn('coffee')) {
          buffer = ''
          dispatchEvent(new Event('egg:coffee'))
          import('@/components/live-region').then((m) => m.announce(site.eggs.coffeeDealt))
        }
      }
    }
    addEventListener('keydown', onKey)

    // Rare pull: 1 in 40 loads (or ?rare), once the hand has landed.
    if (eggOn('rarePull') && (Math.random() < 1 / 40 || new URLSearchParams(location.search).has('rare'))) {
      const first = document.documentElement.dataset.intro === 'first'
      const delay = first ? at.draw + 3 * S.draw + D.draw + 0.2 : 1
      import('./hand-eggs').then((m) => m.rarePull(delay))
    }
    return () => removeEventListener('keydown', onKey)
  }, [])

  function openShortcuts() {
    const d = dialog.current!
    const h = title.current!
    d.showModal()
    if (readTier() !== 'full') {
      h.textContent = site.eggs.shortcutsTitle
      return
    }
    h.textContent = ''
    import('motion-plus')
      .then(({ typewriter }) => typewriter(h, site.eggs.shortcutsTitle, { speed: 'fast' }))
      .catch(() => (h.textContent = site.eggs.shortcutsTitle))
  }

  return (
    <dialog ref={dialog} className="shortcuts" aria-labelledby="shortcuts-title" closedby="any">
      <h2 id="shortcuts-title" ref={title} className="shortcuts-title">
        {site.eggs.shortcutsTitle}
      </h2>
      <dl className="shortcuts-list">
        {site.eggs.shortcuts.map((row) => (
          <div key={row.keys}>
            <dt>
              <kbd>{row.keys}</kbd>
            </dt>
            <dd>{row.label}</dd>
          </div>
        ))}
      </dl>
      <form method="dialog">
        <button className="button" type="submit" autoFocus>
          {site.eggs.shortcutsClose}
        </button>
      </form>
    </dialog>
  )
}
