import { typewriter } from 'motion-plus'
import { animate } from 'motion'
import { announce } from '@/components/live-region'
import { glint } from '@/motion/glint'
import { duration, ease, spring, tiers } from '@/motion/tokens'
import { readTier } from '@/motion/use-tier'
import site from '@content/site.json'
import workshops from '@content/workshops.json'
import { buzz } from './haptics'

/*
 * Workshop card: draws a random facilitation method from the deck. The title
 * is typed out (Motion+ Typewriter) inside a box reserved by a hidden copy,
 * then a Glint crosses the card. Dismissing (button or Escape) sends it back
 * into the deck. The card is a small non-modal dialog; its text is announced.
 */
let open: { close: () => void } | null = null
let last = -1

export function drawWorkshop() {
  const deck = document.querySelector<HTMLElement>('[data-deck]')
  const table = deck?.closest<HTMLElement>('[data-table]')
  if (!deck || !table) return
  if (open) open.close()
  const tier = readTier()
  let pick = Math.floor(Math.random() * workshops.length)
  if (pick === last) pick = (pick + 1) % workshops.length
  last = pick
  const method = workshops[pick]
  buzz(10)

  const card = document.createElement('div')
  card.className = 'workshop-card'
  card.setAttribute('role', 'dialog')
  card.setAttribute('aria-labelledby', 'workshop-title')
  card.setAttribute('aria-describedby', 'workshop-how')
  card.setAttribute('data-foil-surface', '')
  card.innerHTML = `
    <p class="meta">${site.eggs.workshopLabel}</p>
    <h2 id="workshop-title" class="workshop-title" tabindex="-1">
      <span class="sr-only"></span>
      <span class="workshop-type" aria-hidden="true"><span class="workshop-reserve"></span><span class="workshop-typed"></span></span>
    </h2>
    <p id="workshop-how" class="workshop-how"></p>
    <button type="button" class="pill workshop-back">${site.eggs.workshopBack}</button>`
  card.querySelector('.sr-only')!.textContent = method.title
  card.querySelector('.workshop-reserve')!.textContent = method.title
  card.querySelector('.workshop-how')!.textContent = method.howTo
  table.append(card)

  // Rise from the deck.
  const from = deck.getBoundingClientRect()
  const to = card.getBoundingClientRect()
  const dx = from.left + from.width / 2 - (to.left + to.width / 2)
  const dy = from.top + from.height / 2 - (to.top + to.height / 2)
  const typed = card.querySelector<HTMLElement>('.workshop-typed')!
  if (tier === 'full') {
    animate(card, { x: [dx, 0], y: [dy, 0], rotate: [-6, 0], scale: [0.6, 1] }, spring.gentle)
    const writer = typewriter(typed, method.title, { speed: 'fast', cursorBlinkRepeat: 2 })
    writer.finished.then(() => glint(card))
  } else {
    typed.textContent = method.title
    if (tier === 'calm') card.animate([{ opacity: 0 }, { opacity: 1 }], duration.base * tiers.calm.time * 1000)
  }
  card.querySelector<HTMLElement>('#workshop-title')!.focus()
  announce(`${site.eggs.workshopLabel}: ${method.title}. ${method.howTo}`)

  const close = async () => {
    if (open !== entry) return
    open = null
    document.removeEventListener('keydown', onKey)
    if (tier === 'full') {
      const now = deck.getBoundingClientRect()
      const box = card.getBoundingClientRect()
      await animate(
        card,
        {
          x: now.left + now.width / 2 - (box.left + box.width / 2),
          y: now.top + now.height / 2 - (box.top + box.height / 2),
          rotate: 4,
          scale: 0.6,
        },
        { duration: duration.deal, ease: ease.in },
      ).finished
    } else if (tier === 'calm') {
      await card.animate([{ opacity: 1 }, { opacity: 0 }], duration.base * tiers.calm.time * 1000).finished
    }
    card.remove()
    deck.focus()
    announce(site.eggs.workshopBackDone)
  }
  const onKey = (event: KeyboardEvent) => {
    if (event.key === 'Escape') close()
  }
  const entry = { close }
  open = entry
  card.querySelector('.workshop-back')!.addEventListener('click', close)
  document.addEventListener('keydown', onKey)
}
