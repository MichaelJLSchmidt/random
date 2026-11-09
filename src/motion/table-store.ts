import type { Identity } from '@/design/palette'
import { cardById, cardForPath, handCards } from '@/lib/hand-data'
import type { MotionTier } from './tokens'

/*
 * The table: a tiny store outside React. Persistent components (background
 * field, hand) subscribe to it and update DOM / shader uniforms directly, so
 * hovering or playing a card never re-renders React.
 *
 *   activeCard  the card whose page is open (null elsewhere)
 *   hoverCard   the card under the pointer or focus (after the intent delay)
 *   lastPlayed  the last card played
 *   field       what the background should show, with how to get there
 */

export type FieldKind = 'instant' | 'bloom' | 'unbloom' | 'switch' | 'crossfade'

export type FieldTarget = {
  identity: Identity
  /** 1: the identity fills the page (bloomed); 0: ink field with pools. */
  spread: 0 | 1
  /** Bloom / unbloom centre in viewport fractions (x right, y down). */
  origin: [number, number]
  /** About's contour lines. */
  topo: 0 | 1
  kind: FieldKind
  /** Increments on every change, so subscribers can tell targets apart. */
  seq: number
}

export type TableState = {
  activeCard: string | null
  hoverCard: string | null
  lastPlayed: string | null
  tier: MotionTier
  sheetOpen: boolean
  breaker: boolean
  field: FieldTarget
}

type Listener = (state: TableState, prev: TableState) => void

let state: TableState = {
  activeCard: null,
  hoverCard: null,
  lastPlayed: null,
  tier: 'full',
  sheetOpen: false,
  breaker: false,
  field: { identity: 'ink', spread: 0, origin: [0.5, 1], topo: 0, kind: 'instant', seq: 0 },
}
const listeners = new Set<Listener>()
let slotCenter: (id: string) => [number, number] | null = () => null
/** A play/return/switch already set the field for this path; route sync leaves it. */
let pendingPath: string | null = null
/** The intent behind the next navigation (play / switch / return), read once by the reveal system. */
let intent: 'play' | 'switch' | 'return' | null = null

function set(patch: Partial<TableState>) {
  const prev = state
  state = { ...state, ...patch }
  for (const fn of listeners) fn(state, prev)
}

function field(target: Omit<FieldTarget, 'seq'>) {
  set({ field: { ...target, seq: state.field.seq + 1 } })
}

const center = (rect: DOMRect): [number, number] => [
  (rect.left + rect.width / 2) / innerWidth,
  (rect.top + rect.height / 2) / innerHeight,
]
const normalise = (path: string) => path.replace(/\/$/, '') || '/'

export const table = {
  get: () => state,
  subscribe(fn: Listener) {
    listeners.add(fn)
    return () => void listeners.delete(fn)
  },
  setTier: (tier: MotionTier) => set({ tier }),
  setSheet: (sheetOpen: boolean) => set({ sheetOpen }),
  setBreaker: (breaker: boolean) => state.breaker !== breaker && set({ breaker }),
  /** The hand tells the table where each card slot is (viewport fractions). */
  registerSlots(fn: (id: string) => [number, number] | null) {
    slotCenter = fn
  },
  slotOf: (id: string) => slotCenter(id),

  /** Returns and clears the intent of the navigation that just happened. */
  takeIntent() {
    const value = intent
    intent = null
    return value
  },

  hover(id: string | null) {
    if (state.hoverCard !== id) set({ hoverCard: id })
  },

  /** Play: the field blooms from the card into its colour. */
  play(id: string, rect: DOMRect, href: string) {
    const card = cardById(id)
    if (!card) return
    pendingPath = normalise(href)
    const switching = state.field.spread === 1
    intent = state.activeCard ? 'switch' : 'play'
    set({ hoverCard: null, lastPlayed: id })
    field({ identity: card.identity, spread: 1, origin: center(rect), topo: 0, kind: switching ? 'switch' : 'bloom' })
  },

  /** Return: the field contracts into the card's slot, then goes back to ink. */
  returnHome(href = '/') {
    pendingPath = normalise(href)
    intent = 'return'
    const from = state.activeCard
    const origin = (from && slotCenter(from)) || [0.5, 1]
    field({ identity: 'ink', spread: 0, origin, topo: 0, kind: 'unbloom' })
  },

  /**
   * Route change (any navigation, including browser back/forward and direct
   * loads): set activeCard and, unless an intent already did, the field.
   */
  route(pathname: string, initial: boolean) {
    const path = normalise(pathname)
    const card = cardForPath(path)
    const activeCard = card?.id ?? null
    const prevActive = state.activeCard
    set({ activeCard, hoverCard: null, ...(card ? { lastPlayed: card.id } : {}) })
    if (pendingPath === path) {
      pendingPath = null
      return
    }
    pendingPath = null
    const kind = (k: FieldKind): FieldKind => (initial ? 'instant' : k)
    if (card) {
      const origin = slotCenter(card.id) ?? [0.5, 1]
      field({
        identity: card.identity,
        spread: 1,
        origin,
        topo: 0,
        kind: kind(state.field.spread === 1 ? 'switch' : 'bloom'),
      })
      return
    }
    if (path === '/about') {
      field({ identity: 'glacier', spread: 0, origin: state.field.origin, topo: 1, kind: kind('crossfade') })
      return
    }
    // Home and 404: back to the ink field.
    if (state.field.spread === 1 && prevActive) {
      const origin = slotCenter(prevActive) ?? [0.5, 1]
      field({ identity: 'ink', spread: 0, origin, topo: 0, kind: kind('unbloom') })
    } else {
      field({ identity: 'ink', spread: 0, origin: [0.5, 1], topo: 0, kind: kind('crossfade') })
    }
  },
}

/** Identity per path for the pre-paint script (card pages and About), so direct loads paint their colour. */
export const pathFields = (): Record<string, Identity> => ({
  ...Object.fromEntries(handCards.map((c) => [c.href, c.identity])),
  '/about': 'glacier',
})
