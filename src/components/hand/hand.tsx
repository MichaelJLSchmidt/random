'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { type CSSProperties, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { palette } from '@/design/palette'
import { attachHandEggs, tap, untapAll } from '@/eggs/hand-eggs'
import { cardForPath, coffeeEgg, handCards, handLabels } from '@/lib/hand-data'
import { drawCards } from '@/motion/reveal'
import { cancelPlay, interceptHistory, play, registerNavigate, returnHome, settleLift } from '@/motion/play'
import { table } from '@/motion/table-store'
import { angle, duration, hand as H } from '@/motion/tokens'
import { NAV } from '@/motion/transitions'
import '@/motion/view-transition'
import { CardBack, CardFace } from './card-face'

/** Outer cards sit a little lower: the hand's arc (px at desktop size). */
const ARC = [10, 2, 2, 10]
const normalise = (path: string) => path.replace(/\/$/, '') || '/'

/*
 * The hand: exactly four cards (three case studies and Management) as the
 * primary navigation. One list serves every layout:
 *   desktop      a fan fixed at the bottom centre (72% visible on home, 45% elsewhere)
 *   mobile home  the same fan, smaller
 *   mobile else  a 48px peek rail; tapping or swiping it up opens the list as
 *                a bottom sheet (a native popover, so it also works without JS)
 *                with the four cards only (About is in the header)
 * Hover and focus are pure CSS; the background hears about them through the
 * table store after an 80 ms intent delay. Nothing here re-renders React
 * except a route change. Foundation-owned (read-only in Wave 1); styles in
 * src/styles/hand.css (Motion). Contract: docs/contracts.md#hand.
 */
export function Hand() {
  const path = normalise(usePathname())
  const home = path === '/'
  const active = cardForPath(path)?.id ?? null
  const router = useRouter()
  const pathRef = useRef(path)
  pathRef.current = path
  const root = useRef<HTMLElement>(null)
  const sheet = useRef<HTMLDivElement>(null)
  // Roving tabindex: one tab stop for the whole hand, on the open card if any.
  const roving = useRef<string>(active ?? handCards[0].id)
  const lastActive = useRef(active)
  if (active && lastActive.current !== active) roving.current = active
  lastActive.current = active
  // Egg: typing "draw" on the start page deals a fifth card, "Coffee?".
  const [coffee, setCoffee] = useState(false)
  const coffeeRef = useRef<HTMLAnchorElement>(null)

  // Navigation for play / return, prefetch of every card route, Escape returns.
  useEffect(() => {
    registerNavigate((href, types, replace) =>
      replace
        ? router.replace(href, { transitionTypes: types, scroll: false })
        : router.push(href, { transitionTypes: types }),
    )
    const offHistory = interceptHistory(() => pathRef.current)
    for (const card of handCards) router.prefetch(card.href)
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || e.defaultPrevented || !table.get().activeCard) return
      if (document.querySelector(':popover-open, dialog[open]')) return
      returnHome('/')
    }
    document.addEventListener('keydown', onKey)
    return () => {
      registerNavigate(null)
      offHistory()
      document.removeEventListener('keydown', onKey)
    }
  }, [router])

  // The hand shows 72% on home and 45% elsewhere: off home, pages keep the collapsed
  // reserve (:root[data-hand="collapsed"] -> --hand-reserve 120px in layout.css). The
  // pre-paint script sets the same attribute for the first paint (motion/preferences.ts).
  useLayoutEffect(() => {
    const root = document.documentElement
    if (home) delete root.dataset.hand
    else root.dataset.hand = 'collapsed'
  }, [home])

  // Inside the view transition's update: the lifted card drops back as the ghost; tapped cards untap.
  useLayoutEffect(() => {
    settleLift()
    untapAll()
  }, [path])

  // Eggs on the hand: inspect, tap (T, or a double tap while a card lifts), new hand (long press on the table).
  useEffect(() => {
    const nav = root.current!
    const off = attachHandEggs(nav)
    const onDoubleTap = (e: Event) => {
      const card = (e as CustomEvent<HTMLElement>).detail
      if (cancelPlay()) tap(card)
    }
    const onCoffee = () => setCoffee(true)
    nav.addEventListener('egg:double-tap', onDoubleTap)
    addEventListener('egg:coffee', onCoffee)
    return () => {
      off()
      nav.removeEventListener('egg:double-tap', onDoubleTap)
      removeEventListener('egg:coffee', onCoffee)
    }
  }, [])

  useEffect(() => {
    if (!home) setCoffee(false)
  }, [home])

  useEffect(() => {
    const card = coffeeRef.current
    if (!coffee || !card) return
    if (table.get().tier === 'full') drawCards([card], 0)
    else card.dataset.drawn = ''
  }, [coffee])

  // The scrim under the hand follows the page colour.
  useEffect(() => {
    const nav = root.current!
    const paint = () => nav.style.setProperty('--page-field', palette[table.get().field.identity].field)
    paint()
    return table.subscribe((s, p) => s.field.seq !== p.field.seq && paint())
  }, [])

  // Slots, hover intent, keyboard.
  useEffect(() => {
    const nav = root.current!
    table.registerSlots((id) => {
      for (const el of nav.querySelectorAll<HTMLElement>(`[data-slot="${id}"], [data-slot-anchor="${id}"]`)) {
        const r = el.getBoundingClientRect()
        if (!r.width) continue
        const bottom = Math.min(r.bottom, innerHeight)
        return [(r.left + r.width / 2) / innerWidth, Math.min(1, (r.top + bottom) / 2 / innerHeight)]
      }
      return null
    })

    let timer = 0
    let current: string | null = null
    const intent = (id: string | null) => {
      if (id === current) return
      current = id
      clearTimeout(timer)
      if (id) timer = window.setTimeout(() => table.hover(id), duration.hoverIntent * 1000)
      else table.hover(null)
    }
    const cardOf = (el: EventTarget | null) =>
      el instanceof Element ? (el.closest<HTMLElement>('[data-play]')?.dataset.play ?? null) : null

    const onOver = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return
      intent(cardOf(e.target))
    }
    const onLeave = () => intent(null)
    const onFocusIn = (e: FocusEvent) => {
      const el = e.target as HTMLElement
      if (el.matches(':focus-visible')) intent(cardOf(el))
    }
    const onFocusOut = (e: FocusEvent) => {
      if (!nav.contains(e.relatedTarget as Node)) intent(null)
    }

    const items = () =>
      [...nav.querySelectorAll<HTMLElement>('[data-roving]')].filter((el) => el.getClientRects().length > 0)
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement
      if (!el.dataset.roving || e.altKey || e.ctrlKey || e.metaKey) return
      const list = items()
      const i = list.indexOf(el)
      const next =
        e.key === 'ArrowRight'
          ? list[Math.min(i + 1, list.length - 1)]
          : e.key === 'ArrowLeft'
            ? list[Math.max(i - 1, 0)]
            : e.key === 'Home'
              ? list[0]
              : e.key === 'End'
                ? list[list.length - 1]
                : null
      if (!next) return
      e.preventDefault()
      for (const item of nav.querySelectorAll<HTMLElement>('[data-roving]')) item.tabIndex = -1
      next.tabIndex = 0
      roving.current = next.dataset.roving!
      next.focus()
    }

    nav.addEventListener('pointerover', onOver)
    nav.addEventListener('pointerleave', onLeave)
    nav.addEventListener('focusin', onFocusIn)
    nav.addEventListener('focusout', onFocusOut)
    nav.addEventListener('keydown', onKey)
    return () => {
      clearTimeout(timer)
      table.hover(null)
      nav.removeEventListener('pointerover', onOver)
      nav.removeEventListener('pointerleave', onLeave)
      nav.removeEventListener('focusin', onFocusIn)
      nav.removeEventListener('focusout', onFocusOut)
      nav.removeEventListener('keydown', onKey)
    }
  }, [])

  // Mobile: the rail hides on scroll down past 120 px and returns on scroll up;
  // a swipe up opens the sheet; the open sheet pauses the background field.
  useEffect(() => {
    const nav = root.current!
    const pop = sheet.current!
    const rail = nav.querySelector<HTMLElement>('.hand-rail')!

    let lastY = scrollY
    let ticking = false
    const onScroll = () => {
      if (ticking) return
      ticking = true
      requestAnimationFrame(() => {
        ticking = false
        const y = scrollY
        if (Math.abs(y - lastY) < 4) return
        const hide = y > H.railHideAfter && y > lastY
        if (hide !== (nav.dataset.rail === 'hidden')) {
          if (hide) nav.dataset.rail = 'hidden'
          else delete nav.dataset.rail
        }
        lastY = y
      })
    }

    let startY: number | null = null
    let swallow = false
    const onDown = (e: PointerEvent) => {
      startY = e.clientY
      swallow = false
    }
    const onMove = (e: PointerEvent) => {
      if (startY === null || swallow) return
      if (startY - e.clientY > 24) {
        swallow = true
        startY = null
        pop.showPopover()
      }
    }
    const onUp = () => {
      startY = null
    }
    // A swipe already opened the sheet: the click that follows must not toggle it shut.
    const onClick = (e: MouseEvent) => {
      if (!swallow) return
      swallow = false
      e.preventDefault()
    }

    let moving = 0
    const onBeforeToggle = () => {
      clearTimeout(moving)
      nav.dataset.sheetMoving = ''
      moving = window.setTimeout(() => delete nav.dataset.sheetMoving, duration.sheet * 1000 + 100)
    }
    const onToggle = (e: Event) => {
      const open = (e as ToggleEvent).newState === 'open'
      table.setSheet(open)
      if (open) {
        const target =
          pop.querySelector<HTMLElement>(`[data-roving="${roving.current}"]`) ??
          pop.querySelector<HTMLElement>('[data-roving]')
        target?.focus({ preventScroll: true })
      }
    }
    // The sheet only exists below the breakpoint.
    const wide = matchMedia(`(min-width: ${H.breakpoint}px)`)
    const onWide = () => wide.matches && pop.matches(':popover-open') && pop.hidePopover()

    addEventListener('scroll', onScroll, { passive: true })
    rail.addEventListener('pointerdown', onDown)
    rail.addEventListener('pointermove', onMove)
    rail.addEventListener('pointerup', onUp)
    rail.addEventListener('pointercancel', onUp)
    rail.addEventListener('click', onClick)
    pop.addEventListener('beforetoggle', onBeforeToggle)
    pop.addEventListener('toggle', onToggle)
    wide.addEventListener('change', onWide)
    return () => {
      removeEventListener('scroll', onScroll)
      rail.removeEventListener('pointerdown', onDown)
      rail.removeEventListener('pointermove', onMove)
      rail.removeEventListener('pointerup', onUp)
      rail.removeEventListener('pointercancel', onUp)
      rail.removeEventListener('click', onClick)
      clearTimeout(moving)
      pop.removeEventListener('beforetoggle', onBeforeToggle)
      pop.removeEventListener('toggle', onToggle)
      wide.removeEventListener('change', onWide)
    }
  }, [])

  // Playing a card from the sheet closes it; every route change shows the rail again.
  useEffect(() => {
    const pop = sheet.current!
    if (pop.matches(':popover-open')) pop.hidePopover()
    delete root.current!.dataset.rail
  }, [path])

  const railName = `${handLabels.nav}: ${handCards.map((c) => c.railLabel).join(', ')}`

  return (
    <nav ref={root} className="hand" aria-label={handLabels.nav} data-home={home ? '' : undefined}>
      <button type="button" className="hand-rail" popoverTarget="hand-sheet" aria-label={railName}>
        {handCards.map((card) => (
          <span
            key={card.id}
            className="rail-card"
            data-identity={card.identity}
            data-slot-anchor={card.id}
            data-active={card.id === active ? '' : undefined}
          >
            {card.railLabel}
          </span>
        ))}
      </button>
      <div ref={sheet} id="hand-sheet" className="hand-fan" popover="auto">
        <div className="hand-row">
          <ul className="hand-list">
            {handCards.map((card, i) => (
              <li
                key={card.id}
                className="hand-slot"
                data-slot={card.id}
                style={{ '--r': `${angle.hand[i]}deg`, '--dy': `${ARC[i]}px` } as CSSProperties}
              >
                <Link
                  href={card.href}
                  className="hand-card"
                  data-identity={card.identity}
                  data-play={card.id}
                  data-roving={card.id}
                  tabIndex={roving.current === card.id ? 0 : -1}
                  aria-current={card.id === active ? 'page' : undefined}
                  onNavigate={(e) => {
                    if (card.id === active) {
                      // The open card: back to the top of its page.
                      e.preventDefault()
                      scrollTo({ top: 0, behavior: table.get().tier === 'full' ? 'smooth' : 'auto' })
                    } else if (play(card.id, card.href)) e.preventDefault()
                  }}
                >
                  {card.id === active ? (
                    <span className="hand-ghost">
                      <span aria-hidden="true">{handLabels.viewing}</span>
                      <span className="sr-only">{card.title}</span>
                    </span>
                  ) : (
                    <>
                      <CardFace card={card} />
                      {/* Seen only while the card flips during the first-visit draw. */}
                      <CardBack />
                    </>
                  )}
                </Link>
              </li>
            ))}
            {coffee && home && (
              <li className="hand-slot" data-slot="coffee" style={{ '--r': '15deg', '--dy': '24px' } as CSSProperties}>
                <Link ref={coffeeRef} href="/about#contact" className="hand-card hand-coffee" transitionTypes={[NAV]}>
                  <span className="card-face" data-identity="saffron">
                    <span className="card-band">
                      <span className="card-title">{coffeeEgg.title}</span>
                      <span className="card-type">{coffeeEgg.cta}</span>
                    </span>
                    <span className="card-summary">{coffeeEgg.body}</span>
                  </span>
                  <CardBack />
                </Link>
              </li>
            )}
          </ul>
        </div>
      </div>
    </nav>
  )
}
