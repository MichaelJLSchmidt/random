import { contour, palette, type Identity } from '@/design/palette'
import { identityOf } from '@/lib/hand-data'
import { INTRO_DONE } from '@/motion/preferences'
import { isPinned, onPinned } from '@/motion/scenes/pin'
import { VT_DONE } from '@/motion/view-transition'
import { type FieldTarget, type TableState, table } from '@/motion/table-store'
import { type MotionTier, duration as D, field as F, reducedCrossfade } from '@/motion/tokens'
import { ambientPaused, onAmbientChange } from '@/motion/use-tier'
import { CssField } from './field-css'
import { type FieldFrame, GlField } from './field-gl'
import { hexToLab, labCss, labToRgb } from './oklab'
import { type EaseName, Track, easeCss } from './tracks'

/*
 * The background field's state machine. It listens to the table store and
 * eases a handful of channels (palettes, bloom spread, intensities, breath,
 * About's morph); the WebGL renderer samples them each frame, the CSS
 * fallback receives each change as a transition. React never re-renders for
 * any of it.
 *
 *   rest     ink pools breathing on a 9 s sine, their centres drifting on slow
 *            Lissajous loops (90 s and longer, 2.5% of the viewport; full tier).
 *            This is the ambient motion the header's pause button stops: the
 *            field's clock freezes where it is (html[data-ambient="paused"]);
 *            hover, bloom, switch and About's morph still run.
 *   hover    A's mid/glow blend to the card's, intensity up, pools lean to its slot
 *   bloom    B (the card's identity) spreads from the played card to fill the page
 *   unbloom  B contracts into the slot, then the residual tint settles to ink
 *   switch   B crossfades in OKLab with a 6% luminance dip at the midpoint
 *   About    the pools contract and fade into the contour ground while the
 *            contour layer (background-field.tsx) reveals through a radial
 *            mask from the centre, 1.6 s inOut (reduced: 160 ms crossfade);
 *            at rest the canvas draws no frames until About is left
 */

type Name =
  | 'a'
  | 'b'
  | 'h'
  | 'hover'
  | 'pull'
  | 'spread'
  | 'iA'
  | 'iB'
  | 'breaker'
  | 'breath'
  | 'topo'
  | 'dip'
  | 'fade'
  | 'motion'

const swatch = (id: Identity) => [
  ...hexToLab(palette[id].field),
  ...hexToLab(palette[id].mid),
  ...hexToLab(palette[id].glow),
]
/** A hex colour as sRGB 0..1 (the contour field's ground). */
const srgb = (hex: string): [number, number, number] => {
  const n = parseInt(hex.slice(1), 16)
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255]
}
const hoverSwatch = (id: Identity) => [...hexToLab(palette[id].mid), ...hexToLab(palette[id].glow)]
const mixArr = (a: number[], b: number[], t: number) => a.map((v, i) => v + (b[i] - v) * t)

/** CSS fallback properties for each channel that has one. */
const CSS: Partial<Record<Name, (v: number[]) => [string, string][]>> = {
  a: (v) => [
    ['--fa-field', labCss(v.slice(0, 3))],
    ['--fa-mid', labCss(v.slice(3, 6))],
    ['--fa-glow', labCss(v.slice(6, 9))],
  ],
  b: (v) => [
    ['--fb-field', labCss(v.slice(0, 3))],
    ['--fb-mid', labCss(v.slice(3, 6))],
    ['--fb-glow', labCss(v.slice(6, 9))],
  ],
  h: (v) => [
    ['--fh-mid', labCss(v.slice(0, 3))],
    ['--fh-glow', labCss(v.slice(3, 6))],
  ],
  hover: (v) => [['--fh', v[0].toFixed(4)]],
  iA: (v) => [['--fa-i', v[0].toFixed(4)]],
  iB: (v) => [['--fb-i', v[0].toFixed(4)]],
  breaker: (v) => [['--fk', v[0].toFixed(4)]],
  spread: (v) => [['--fs', v[0].toFixed(4)]],
  fade: (v) => [['--fade', v[0].toFixed(4)]],
}

type Connection = { saveData?: boolean }

export class FieldEngine {
  private tracks: Record<Name, Track>
  private gl: GlField | null = null
  private css: CssField
  private mode: 'gl' | 'css' = 'css'
  private tier: MotionTier
  private origin: [number, number] = [0.5, 1]
  private maxD = 1
  private time = 0
  private raf = 0
  private lastFrame = 0
  private lastDraw = 0
  private paused = false
  /** The visitor paused ambient motion: the clock stands still (transitions still run). */
  private held = false
  private saveData = false
  private samples: number[] = []
  private slowWindows = 0
  private warmUntil = 0
  private frame: FieldFrame
  private offs: (() => void)[] = []

  constructor(
    private root: HTMLElement,
    canvas: HTMLCanvasElement,
    cssLayer: HTMLElement,
    /** About's contour layer (src/styles/field.css) and a function that fetches its SVG for this viewport. */
    private about: { layer: HTMLElement; preload: () => void },
  ) {
    this.css = new CssField(cssLayer)
    this.tier = table.get().tier
    const ink = swatch('ink')
    this.tracks = {
      a: new Track(ink),
      b: new Track(ink),
      h: new Track(hoverSwatch('ink')),
      hover: new Track([0]),
      pull: new Track([0.5, 1]),
      spread: new Track([0]),
      iA: new Track([F.intensityRest]),
      iB: new Track([F.intensityPage]),
      breaker: new Track([0]),
      breath: new Track([1]),
      topo: new Track([0]),
      dip: new Track([1]),
      fade: new Track([1]),
      motion: new Track([0]),
    }
    this.frame = {
      time: 0,
      a: new Float32Array(9),
      b: new Float32Array(9),
      intensity: [0, 0],
      spread: 0,
      origin: [0.5, 1],
      maxD: 1,
      pull: [0.5, 1],
      pullAmt: 0,
      drift: new Float32Array(6),
      breath: [1, 1],
      lum: 1,
      fade: 1,
      topo: 0,
      ground: srgb(contour.ground),
    }
    this.saveData = Boolean((navigator as Navigator & { connection?: Connection }).connection?.saveData)
    this.held = ambientPaused()
    this.tracks.motion.jump([this.animated() ? 1 : 0], performance.now())

    const now = performance.now()
    // Hydration and the first navigation are busy: judge frame times after that.
    this.warmUntil = now + 2000
    if (document.documentElement.dataset.intro === 'first') {
      // First visit: the field fades in from black.
      this.tracks.fade.jump([0], now)
      this.tracks.fade.set([1], this.dur(D.fieldIn), 'outSoft', now)
    }

    try {
      this.gl = new GlField(canvas, () => this.fallback())
      this.mode = 'gl'
    } catch {
      this.mode = 'css'
    }

    // The route sync (a child effect) may already have set the first target.
    this.applyField({ ...table.get().field, kind: 'instant' })
    this.offs.push(table.subscribe((s, p) => this.onTable(s, p)))
    // A skipped intro ends the fade from black at once.
    const onIntroDone = () => this.go('fade', [1], 0, 'linear')
    addEventListener(INTRO_DONE, onIntroDone)
    this.offs.push(() => removeEventListener(INTRO_DONE, onIntroDone))
    // A pinned scene (the decision deal) holds the viewport: half the field's resolution meanwhile.
    const onPin = (pinned: boolean) => {
      if (!this.gl) return
      this.gl.detail = pinned ? F.pinnedDetail : 1
      this.gl.resize()
      this.kick(true)
    }
    if (isPinned()) onPin(true)
    this.offs.push(onPinned(onPin))
    // A view transition can hold rendering past a short retarget (reduced: 160 ms): the
    // frames drawn meanwhile are never shown, so draw the settled state once it ends.
    const onTransitionDone = () => this.kick(true)
    addEventListener(VT_DONE, onTransitionDone)
    this.offs.push(() => removeEventListener(VT_DONE, onTransitionDone))
    // Pause / play (the header's button): freeze or restart the clock in place.
    this.offs.push(
      onAmbientChange((paused) => {
        this.held = paused
        this.samples = []
        this.kick(true)
      }),
    )
    const onVisibility = () => {
      this.setPaused()
      // The contour drift (CSS) stops while the tab is hidden.
      this.root.toggleAttribute('data-tab-hidden', document.hidden)
    }
    document.addEventListener('visibilitychange', onVisibility)
    this.offs.push(() => document.removeEventListener('visibilitychange', onVisibility))
    const ro = new ResizeObserver(() => {
      this.gl?.resize()
      this.setOrigin(this.origin)
      this.kick(true)
    })
    ro.observe(canvas)
    this.offs.push(() => ro.disconnect())
    if (this.mode === 'css') {
      this.syncCss(now)
      document.documentElement.dataset.renderer = 'css'
    }
    // About's contour SVG: fetched when a link to About is hovered, focused or touched (or on About).
    const onIntent = (e: Event) => {
      const a = e.target instanceof Element ? e.target.closest<HTMLAnchorElement>('a[href]') : null
      if (a && /\/about\/?$/.test(new URL(a.href, location.href).pathname)) this.about.preload()
    }
    for (const type of ['pointerover', 'focusin', 'touchstart'] as const) {
      document.addEventListener(type, onIntent, { passive: true })
      this.offs.push(() => document.removeEventListener(type, onIntent))
    }
    this.kick(true)
  }

  destroy() {
    cancelAnimationFrame(this.raf)
    clearTimeout(this.contourTimer)
    for (const off of this.offs) off()
    this.gl?.destroy()
  }

  get renderer() {
    return this.mode
  }

  // ---------------------------------------------------------------- About's contours

  /** What the route asks for: the contours (1) or not (0). */
  private wantTopo: 0 | 1 = 0
  private contourTimer = 0

  /**
   * Eases About's morph in or out: the shader's `topo` (pools contract and fade into the ground)
   * and the contour layer's reveal (--contour-reveal: a radial mask from the centre, reduced an
   * opacity crossfade; src/styles/field.css) over the same time and curve. The layer renders
   * (data-contours) while the route asks for it or it is still fading out.
   */
  private toTopo(to: 0 | 1, dur: number, ease: EaseName) {
    const from = this.tracks.topo.value[0]
    this.wantTopo = to
    this.go('topo', [to], dur, ease)
    const layer = this.about.layer
    clearTimeout(this.contourTimer)
    if (to === 1) this.about.preload()
    if (to === 1 || from > 0) this.root.dataset.contours = to === 1 && dur <= 0 ? 'shown' : 'morph'
    // Commit the starting value (the layer may have just been displayed), then transition to `to`.
    layer.style.transition = 'none'
    layer.style.setProperty('--contour-reveal', String(dur > 0 ? from : to))
    void getComputedStyle(layer).getPropertyValue('--contour-reveal')
    if (dur > 0) {
      layer.style.transition = `--contour-reveal ${dur}s ${easeCss(ease)}`
      layer.style.setProperty('--contour-reveal', String(to))
    }
    const settle = () => (this.root.dataset.contours = this.wantTopo === 1 ? 'shown' : 'off')
    if (dur > 0) this.contourTimer = window.setTimeout(settle, dur * 1000)
    else settle()
  }

  /** At rest on About only the contour layer shows: the canvas draws nothing and asks for no frames. */
  private contoursAtRest() {
    const topo = this.tracks.topo
    return topo.value[0] >= 1 && topo.to[0] >= 1
  }

  // ---------------------------------------------------------------- input

  private onTable(s: TableState, p: TableState) {
    if (s.tier !== p.tier) this.setTier(s.tier)
    if (s.field.seq !== p.field.seq) this.applyField(s.field)
    if (s.hoverCard !== p.hoverCard) this.applyHover(s.hoverCard)
    if (s.breaker !== p.breaker) this.go('breaker', [s.breaker ? 1 : 0], this.dur(D.hoverIn), 'outSoft')
    if (s.sheetOpen !== p.sheetOpen) this.setPaused()
  }

  /** Tier-scaled duration: full as given, reduced one 160 ms crossfade. */
  private dur(full: number) {
    return this.tier === 'reduced' ? reducedCrossfade : full
  }

  private setTier(tier: MotionTier) {
    this.tier = tier
    this.go('motion', [this.animated() ? 1 : 0], D.crossfade, 'outSoft')
  }

  /** Brings every track up to date (the loop does not run in CSS mode or while idle). */
  private sampleAll(now: number) {
    let moving = false
    for (const track of Object.values(this.tracks)) moving = track.sample(now) || moving
    return moving
  }

  private applyField(t: FieldTarget) {
    const now = performance.now()
    const tr = this.tracks
    this.sampleAll(now)
    const P = swatch(t.identity)
    const iTo = t.spread ? F.intensityPage : F.intensityRest
    const topo = t.topo
    const topoDur = this.dur(D.topo)
    const spreadNow = tr.spread.value[0]
    const settled = tr.spread.remaining(now) === 0

    let kind = t.kind
    if (kind !== 'instant' && this.tier !== 'full') kind = 'crossfade'
    if (kind === 'bloom' && spreadNow > 0.01) kind = 'switch'

    switch (kind) {
      case 'instant':
        this.setOrigin(t.origin)
        this.jump('a', P)
        this.jump('b', P)
        this.jump('spread', [t.spread])
        this.jump('iA', [F.intensityRest])
        this.jump('iB', [F.intensityPage])
        this.jump('breath', [t.spread ? 0.5 : 1])
        this.toTopo(topo, 0, 'linear')
        this.jump('dip', [1])
        break

      case 'bloom':
        this.setOrigin(t.origin)
        this.jump('b', P)
        this.jump('iB', [F.intensityPage])
        this.go('spread', [1], D.bloom, 'bloom')
        this.go('breath', [0.5], D.bloom, 'bloom')
        this.toTopo(0, D.bloom, 'outSoft')
        break

      case 'unbloom':
        // Contract toward the slot; mid-bloom, keep the current centre so the disc does not jump.
        if (settled) this.setOrigin(t.origin)
        if (spreadNow > 0.99) {
          // A is hidden while bloomed: leave a half tint outside the contracting disc.
          this.jump('a', mixArr(tr.b.value, P, 0.5))
          this.jump('iA', [tr.iB.value[0]])
        }
        this.go('spread', [0], D.unbloom, 'bloom')
        this.go('a', P, D.toInk, 'outSoft', D.unbloom)
        this.go('iA', [iTo], D.toInk, 'outSoft', D.unbloom)
        this.go('breath', [1], D.toInk, 'outSoft', D.unbloom)
        this.toTopo(topo, topoDur, 'bloom')
        break

      case 'switch':
        this.go('b', P, D.crossfade, 'bloom')
        this.go('iB', [F.intensityPage], D.crossfade, 'bloom')
        this.jump('dip', [0])
        this.go('dip', [1], D.crossfade, 'linear')
        if (tr.spread.to[0] !== 1) this.go('spread', [1], D.bloom, 'bloom')
        this.go('breath', [0.5], D.crossfade, 'bloom')
        this.toTopo(0, D.crossfade, 'outSoft')
        break

      case 'crossfade': {
        // Reduced turns bloom / unbloom / switch into a 160 ms crossfade.
        const dur = this.dur(D.crossfade)
        if (settled && spreadNow > 0.99 && !t.spread) {
          // Flatten B into A (invisible), then fade A.
          this.jump('a', tr.b.value)
          this.jump('iA', tr.iB.value)
          this.jump('spread', [0])
          this.go('a', P, dur, 'bloom')
          this.go('iA', [iTo], dur, 'bloom')
        } else if (settled && spreadNow < 0.01 && t.spread) {
          // Raise A into B (invisible), then fade B.
          this.jump('b', this.displayedA(now))
          this.jump('iB', tr.iA.value)
          this.jump('spread', [1])
          this.go('b', P, dur, 'bloom')
          this.go('iB', [iTo], dur, 'bloom')
        } else if (settled && t.spread) {
          this.go('b', P, dur, 'bloom')
          this.go('iB', [iTo], dur, 'bloom')
        } else if (settled) {
          this.go('a', P, dur, 'bloom')
          this.go('iA', [iTo], dur, 'bloom')
        } else {
          this.go('a', P, dur, 'bloom')
          this.go('b', P, dur, 'bloom')
          this.go('iA', [F.intensityRest], dur, 'bloom')
          this.go('iB', [F.intensityPage], dur, 'bloom')
          this.go('spread', [t.spread], dur, 'bloom')
        }
        this.go('breath', [t.spread ? 0.5 : 1], dur, 'bloom')
        this.toTopo(topo, topoDur, 'bloom')
        break
      }
    }
  }

  private applyHover(id: string | null) {
    const identity = identityOf(id)
    if (id && identity) {
      const now = performance.now()
      this.sampleAll(now)
      const target = hoverSwatch(identity)
      if (this.tracks.hover.value[0] < 0.02 && this.tracks.hover.remaining(now) === 0) this.jump('h', target)
      else this.go('h', target, this.dur(D.hoverIn), 'outSoft')
      this.go('hover', [1], this.dur(D.hoverIn), 'outSoft')
      this.go('pull', table.slotOf(id) ?? [0.5, 1], this.dur(D.hoverIn), 'outSoft')
    } else {
      this.go('hover', [0], this.dur(D.hoverOut), 'outSoft')
    }
  }

  // ---------------------------------------------------------------- tracks

  private go(name: Name, to: number[], dur: number, ease: EaseName, delay = 0) {
    const now = performance.now()
    this.tracks[name].set(to, dur, ease, now, delay)
    if (this.mode === 'css') this.writeCss(name, to, dur, ease, delay)
    // About at rest: only the contours show, so other channels (hover, breaker, tier) ask for no frame.
    if (name !== 'topo' && this.contoursAtRest()) return
    // Dirty: at least one frame is drawn even if the track has already ended by
    // the next frame (a short reduced crossfade while a view transition holds rendering).
    this.kick(true)
  }

  private jump(name: Name, to: number[]) {
    this.go(name, to, 0, 'linear')
  }

  private writeCss(name: Name, to: number[], dur: number, ease: EaseName, delay: number) {
    const props = CSS[name]?.(to)
    if (!props) return
    for (const [prop, value] of props) this.css.write(prop, value, dur, easeCss(ease), delay)
  }

  /** Writes every channel to the CSS fallback: current value now, the rest as a transition. */
  private syncCss(now: number) {
    for (const name of Object.keys(this.tracks) as Name[]) {
      const track = this.tracks[name]
      const moving = track.sample(now)
      this.writeCss(name, track.value, 0, 'linear', 0)
      if (moving) {
        const delay = Math.max(0, (track.start - now) / 1000)
        const dur = (track.end - Math.max(now, track.start)) / 1000
        this.writeCss(name, track.to, dur, track.ease, delay)
      }
    }
    this.css.origin(...this.origin)
  }

  private setOrigin(origin: [number, number]) {
    this.origin = origin
    const w = innerWidth
    const h = innerHeight
    const aspect = w / h
    const [x, y] = origin
    this.maxD = Math.hypot(Math.max(x, 1 - x) * aspect, Math.max(y, 1 - y))
    if (this.mode === 'css') this.css.origin(x, y)
  }

  private displayedA(now: number) {
    const { a, h, hover } = this.tracks
    a.sample(now)
    h.sample(now)
    hover.sample(now)
    // Hover leans A's mid/glow most of the way to the card's (a full blend reads too loud).
    const k = hover.value[0] * 0.65
    return [
      ...a.value.slice(0, 3),
      ...mixArr(a.value.slice(3, 6), h.value.slice(0, 3), k),
      ...mixArr(a.value.slice(6, 9), h.value.slice(3, 6), k),
    ]
  }

  // ---------------------------------------------------------------- loop

  private setPaused() {
    const paused = document.hidden || table.get().sheetOpen
    if (paused === this.paused) return
    this.paused = paused
    if (paused) {
      cancelAnimationFrame(this.raf)
      this.raf = 0
    } else {
      this.samples = []
      this.warmUntil = performance.now() + 1000
      this.kick(true)
    }
  }

  /** Breath and drift may move at all (full tier, no data saver); `motion` eases toward this. */
  private animated() {
    return this.tier === 'full' && !this.saveData
  }

  /** The loop runs while something moves; the breathing field keeps it running unless paused. */
  private continuous() {
    return this.animated() && !this.held
  }

  private dirty = true
  private wasMoving = false

  private kick(dirty = false) {
    if (dirty) this.dirty = true
    if (this.mode !== 'gl' || this.paused || this.raf) return
    this.lastFrame = 0
    this.raf = requestAnimationFrame(this.tick)
  }

  private tick = (now: number) => {
    this.raf = 0
    if (this.mode !== 'gl' || this.paused) return
    let moving = this.sampleAll(now)
    // A track that has just settled: draw its final value once more (the last moving frame showed
    // a value from just before its end).
    if (this.wasMoving && !moving) this.dirty = true
    this.wasMoving = moving
    // About at rest: one static frame (redrawn only when dirty: a resize, a view transition's end),
    // and always the settled frame itself (topo exactly 1).
    const still = this.contoursAtRest()
    if (still) {
      moving = false
      if (this.frame.topo < 1) this.dirty = true
    }
    const continuous = !still && this.continuous()
    if (!moving && !continuous && !this.dirty) return
    this.raf = requestAnimationFrame(this.tick)

    const interval = this.lastFrame ? now - this.lastFrame : 0
    this.lastFrame = now
    if (continuous && interval) this.monitor(now, interval)
    // The monitor may have switched to the CSS field: no WebGL frame after that.
    if (this.mode !== 'gl') return
    if (now - this.lastDraw < 1000 / F.fps - 2) return
    const dt = this.lastDraw ? Math.min(now - this.lastDraw, 100) / 1000 : 0
    this.lastDraw = now
    if (continuous) this.time += dt
    this.dirty = false
    this.draw()
  }

  /** Average rAF interval over 60 frames above 24 ms, twice in a row: use the CSS field. */
  private monitor(now: number, interval: number) {
    if (now < this.warmUntil) return
    this.samples.push(Math.min(interval, 100))
    if (this.samples.length < F.frameWindow) return
    const avg = this.samples.reduce((s, v) => s + v, 0) / this.samples.length
    this.samples = []
    this.slowWindows = avg > F.maxFrameMs ? this.slowWindows + 1 : 0
    if (this.slowWindows >= 2) this.fallback()
  }

  private fallback() {
    if (this.mode === 'css') return
    this.mode = 'css'
    cancelAnimationFrame(this.raf)
    this.raf = 0
    this.syncCss(performance.now())
    this.root.dataset.mode = 'css'
    document.documentElement.dataset.renderer = 'css'
  }

  private draw() {
    if (this.mode !== 'gl' || !this.gl) return
    const t = this.tracks
    const f = this.frame
    const motion = t.motion.value[0]
    const hover = t.hover.value[0]
    const breaker = t.breaker.value[0] * F.breaker
    const A = this.displayedA(performance.now())
    for (let i = 0; i < 3; i++) {
      labToRgb(A.slice(i * 3, i * 3 + 3), f.a, i * 3)
      labToRgb(t.b.value.slice(i * 3, i * 3 + 3), f.b, i * 3)
    }
    f.time = this.time
    f.intensity[0] = t.iA.value[0] + hover * (F.intensityHover - F.intensityRest) + breaker
    f.intensity[1] = t.iB.value[0] + breaker
    f.spread = t.spread.value[0]
    f.origin = this.origin
    f.maxD = this.maxD
    f.pull = t.pull.value as [number, number]
    f.pullAmt = hover * 0.5 * motion
    // Drift: each pool's centre loops a slow Lissajous figure, 2.5% of the viewport (full tier;
    // the clock stops in reduced, where `motion` eases the offset back to 0, and while paused).
    const aspect = innerWidth / Math.max(1, innerHeight)
    const reach = F.poolDrift * motion
    F.poolDriftPeriods.forEach(([px, py], i) => {
      f.drift[i * 2] = reach * aspect * Math.sin((2 * Math.PI * this.time) / px + i * 2.1)
      f.drift[i * 2 + 1] = reach * Math.sin((2 * Math.PI * this.time) / py + i * 1.3)
    })
    // Breath: a 9 s sine in-out; pool scale 1.00-1.06, luminance ±4%.
    const amp = t.breath.value[0] * motion
    const b = (1 - Math.cos((2 * Math.PI * this.time) / D.breath)) / 2
    f.breath[0] = 1 + F.breathScale * b * amp
    f.breath[1] = 1 + F.breathLum * (2 * b - 1) * amp
    f.lum = 1 - F.switchDip * Math.sin(Math.PI * t.dip.value[0])
    f.fade = t.fade.value[0]
    f.topo = t.topo.value[0]
    this.gl!.draw(f)
    if (this.root.dataset.mode !== 'gl') {
      this.root.dataset.mode = 'gl'
      document.documentElement.dataset.renderer = 'gl'
    }
  }
}
