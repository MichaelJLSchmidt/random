# Feedback round 1

One session (the only one running) applies the first round of design feedback: G1–G5 (general),
H1–H5 (home), D1–D8 (detail pages), A1–A5 (About) and the housekeeping. Everything not named
there stays as it is.

## Branch

`claude/nifty-goldberg-lf1bxb`, merged into `main` once verification passes; `main` is pushed and
deployed once.

## Plan

Small commits in this order: housekeeping, general, home, detail, About, docs, smoke.

**Housekeeping.** CLAUDE.md loses the parallel-session rule; `docs/backlog.md` lists the three
follow-ups; no logo lab exists in the repository, so nothing to leave alone. Contracts,
art direction, schema, content modules and the build-time count checks follow each change.

**General**

- G1: `shader.ts` gets a per-pool drift uniform; `field-engine.ts` computes a slow Lissajous
  offset per pool (2.5% of the viewport, loops of 97–151 s, tokens `field.drift*`), scaled by the
  `motion` track, so calm and reduced keep the pools still.
- G2: `CalmSwitch` (`button[role=switch]`) in the header. Its thumb, track and checked look come
  from CSS on `html[data-motion]` (correct before hydration); React reads the same attribute on
  mount (`useMotionTier`) for `aria-checked` and `disabled`. Reduced: on, disabled, hint
  ("Set by your system"). Thumb on the hover spring (critically damped); instant in reduced.
  The footer's DisplaySettings goes.
- G3: header links: About only (+ the switch); the sheet's link list goes.
- G4: one `HomeSlot` link at the top left: wordmark (`.slot-mark`, any content: text today, the
  SVG logo later) or back arrow + "Back". The morph is generic (the mark box compresses with
  `scaleX` and fades toward the left edge; the arrow's shaft draws with `scaleX` from the left;
  the label rises from a mask), 420 ms outQuint, from tokens. Reduced: 160 ms crossfade. The header
  is live in every view transition (no snapshot), so the CSS transitions show during the morphs.
- G5: `SiteFooter` renders nothing on home (client gate on the pathname).

**Home**

- H1: `.home` is `100dvh` (min-height, so a too-small viewport may scroll), the footer is gone,
  the layout clears the hand at 1024×768, 1280×720, 1440×900, 1920×1080 and 390×844.
- H2: `HandCounter` and `hand.labels.counter` removed; New hand: M (desktop), long press on the
  empty table on touch (`pointerdown` on `main`/`body` outside cards, links, buttons and text).
- H3: `home.onTheTableNow` → `home.bring` ("What I bring to the table", three items).
- H4: `at.firstLoad` becomes the ordered timeline from the brief (name, label, role + intro,
  divider, items, hint, then the four cards 330 ms each, 140 ms apart), all in `tokens.ts`.
  The divider uses the link underline's draw (left to right, outQuint). Calm × 0.6, reduced 160 ms.
- H5: `IdleHint` egg on home: 30 s without click / tap / key, once per session; Caveat (OFL,
  self-hosted latin subset with umlauts) note "(a selection of my projects)" reveals left to
  right with a clip, then a curly SVG arrow draws toward the cards. Fades on the next click, tap
  or key. Calm: shorter; reduced: a fade. `aria-hidden`; registered in `src/eggs/registry.ts`.

**Detail**

- D1: `data-reveal-step` on the summary, the top label + counter and each meta pair; the engine
  starts the detail sequence from `at.detail` tokens; new `pair` reveal kind (rule, label, value).
  Only pairs in the first viewport at sequence start join; the rest reveal on scroll.
- D2: `Spread` → `OffsetImage` (`figure.offset-image[data-side]`): from 1024 anchored to the
  content column on one side, toward the viewport edge on the other, max 1200 px × 72svh, 3:2,
  cover; sides alternate per page; caption beside it from 1680, below otherwise; edge to edge at
  4:3 below 1024. Case hero frame capped at 1200 px.
- D3: the mini card goes; a return with the hero out of view deals the card into its slot
  (short rise + fade, no travel from off screen) instead of a shared-element morph.
- D4: every case chapter 01–08 opens with its outlined numeral; more space between chapters.
- D5: `ClosingContact` removed.
- D6: decision cards deal face up; `deal.stage` 180 svh.
- D7: workshop cards on a subgrid, so fields line up when a title wraps.
- D8: "Career framework" artefact draws `CareerMatrix` (Management's levels and dimensions);
  "Intake one-pager" becomes a deliberate text card.

**About**

- A1: chapter "Projects" after "What's on the table": title, year, client, role; not
  interactive; rows reveal with drawn rules; count line and closing line kept.
- A2: chapter "Contact" last ("Let's talk.", body, email with drawn underline, LinkedIn and
  location rows, note); photo credits and terrain attribution as small print in the footer on
  About.
- A3: `/more-projects` and `/contact` routes and every link to them removed; Coffee card →
  `/about#contact`.
- A4: offset images on About; `about-mountain` and `about-tcg2` removed (manifest, registry,
  files, credits).
- A5: the old portfolio's password-page field reproduced in the one background canvas: region
  heightmap (RGBA8 WebP, probe check, raw fallback), cover crop on its focus with zoom 1.06,
  line `#8A8C80` at 0.28 / index 0.42, 1 px / 1.5 px, every fifth an index line, interval from
  the 95th-percentile gradient and the minimum spacing (3.25 px desktop, 3 px mobile), DPR cap
  1.5 / 1.25, ground `#1B1C18`. The gradient's colour bands narrow into the lines over 1.6 s, and
  back on leaving. At rest one static frame, no loop. Reduced or no WebGL2: the region poster,
  160 ms crossfade. `public/topo` and `scripts/topo` deleted.

## Verification plan

Production build (with count checks), `scripts/smoke.mjs` per tier at 1440×900 and 390×844
(updated for the removed routes, the removed counter and the new intro order), screenshots of
home at six sizes and of a case study and About at three sizes, an independent review subagent
against the numbered items, then merge, push `main` once and confirm the Pages deploy.
