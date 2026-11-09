'use client'

import { useCallback, useLayoutEffect, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import { type Look, ACCENT_IDENTITIES, cap, stageStyle } from '../colours'
import type { Concept } from '../model'
import { Mark } from './mark'
import { go, hrefFor, useLabSettings } from './logo-lab'
import { type Player, usePlayer } from './player'
import { Button } from './controls'
import { ScoreSummary } from './scorecard'
import type { Identity } from '@/design/palette'

const LINEUP_SIZES = [16, 24, 32, 48]

/** Every concept side by side at favicon sizes, on the ink field and on white. */
function Lineup({ concepts, identity }: { concepts: Concept[]; identity: Identity }) {
  const grounds: { key: string; label: string; look: Look }[] = [
    { key: 'ink', label: 'Ink field', look: { identity, surface: 'field', colour: 'neutral', container: 'none' } },
    { key: 'white', label: 'White', look: { identity, surface: 'white', colour: 'dark', container: 'none' } },
  ]
  return (
    <section className="lab-section" aria-labelledby="lineup-title">
      <h2 id="lineup-title" className="lab-h2 t-h3">
        Small sizes
      </h2>
      <p className="lab-hint">
        Favicon variants at 16–32 px, the master at 48 px. Vector, at CSS pixels: the detail view has the pixel-true
        raster.
      </p>
      <div className="lab-scroll">
        <table className="lab-lineup">
          <thead>
            <tr>
              <td />
              {grounds.map((g) => (
                <th key={g.key} scope="colgroup" colSpan={LINEUP_SIZES.length} className="t-label">
                  {g.label}
                </th>
              ))}
            </tr>
            <tr>
              <th scope="col" className="t-label">
                Concept
              </th>
              {grounds.map((g) =>
                LINEUP_SIZES.map((s) => (
                  <th key={`${g.key}-${s}`} scope="col" className="t-label">
                    {s}
                  </th>
                )),
              )}
            </tr>
          </thead>
          <tbody>
            {concepts.map((c) => (
              <tr key={c.n}>
                <th scope="row">
                  <a className="link" href={hrefFor(c.n)} onClick={(e) => (e.preventDefault(), go(c.n))}>
                    {c.n} · {c.name}
                  </a>
                </th>
                {grounds.map((g) =>
                  LINEUP_SIZES.map((s) => (
                    <td key={`${g.key}-${s}`} style={stageStyle(g.look)} className="lab-lineup-cell">
                      <Mark concept={c} variant={s <= 32 ? 'favicon' : 'master'} size={s} />
                    </td>
                  )),
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function Tile({
  concept,
  look,
  register,
}: {
  concept: Concept
  look: Look
  register: (n: number, p: Player | null) => void
}) {
  const { tier, speed } = useLabSettings()
  const player = usePlayer(concept, { tier, speed })
  const stage = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    register(concept.n, player)
    return () => register(concept.n, null)
  }, [concept.n, player, register])

  // The reveal plays once on entry: built at its start pose now, played when the tile is in view.
  useLayoutEffect(() => {
    const out = player.reveal(false, true)
    if (!out.ran || !out.run || !stage.current) return
    const r = out.run
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          r.play()
          io.disconnect()
        }
      },
      { threshold: 0.4 },
    )
    io.observe(stage.current)
    return () => {
      io.disconnect()
      r.cancel()
    }
    // Once per mount (and again after a tier change).
  }, [tier]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <article className="lab-tile" onFocus={player.hoverIn} onBlur={player.hoverOut}>
      <div
        ref={stage}
        className="lab-tile-stage lab-stage-bg"
        style={stageStyle(look)}
        onPointerEnter={player.hoverIn}
        onPointerLeave={player.hoverOut}
      >
        <Mark ref={player.ref} concept={concept} className="lab-tile-mark" />
      </div>
      <div className="lab-tile-text">
        <h3 className="lab-tile-title t-h3">
          <a href={hrefFor(concept.n)} className="lab-tile-link" onClick={(e) => (e.preventDefault(), go(concept.n))}>
            <span className="lab-num">{concept.n}</span> {concept.name}
          </a>
        </h3>
        <p className="lab-tile-idea">{concept.idea}</p>
        <div className="lab-tile-actions">
          <Button onClick={() => player.reveal()}>Replay</Button>
        </div>
      </div>
    </article>
  )
}

export function Overview({ concepts }: { concepts: Concept[] }) {
  const [identity, setIdentity] = useState<Identity>('ink')
  const players = useRef(new Map<number, Player>())
  const register = useCallback((n: number, p: Player | null) => {
    if (p) players.current.set(n, p)
    else players.current.delete(n)
  }, [])
  const look: Look = { identity, surface: 'field', colour: 'neutral', container: 'none' }

  const changeIdentity = (next: Identity) => {
    const list = [...players.current.values()]
    const before = list.map((p) => p.snapshot())
    flushSync(() => setIdentity(next))
    list.forEach((p, i) => p.recolour(before[i]))
  }
  const nextIdentity = () => {
    const i = ACCENT_IDENTITIES.indexOf(identity as (typeof ACCENT_IDENTITIES)[number])
    changeIdentity(ACCENT_IDENTITIES[(i + 1) % ACCENT_IDENTITIES.length])
  }

  return (
    <>
      <Lineup concepts={concepts} identity={identity} />
      <section className="lab-section" aria-labelledby="concepts-title">
        <div className="lab-section-head">
          <h2 id="concepts-title" className="lab-h2 t-h3">
            Concepts
          </h2>
          <div className="lab-row">
            <span className="t-label" aria-live="polite">
              Identity: {cap(identity)}
            </span>
            <Button onClick={nextIdentity}>Next identity</Button>
            {identity !== 'ink' && <Button onClick={() => changeIdentity('ink')}>Back to ink</Button>}
          </div>
        </div>
        <p className="lab-hint">
          Each tile plays its reveal once as it comes into view. Hover or focus a tile for its micro-interaction; open
          it for sizes, colours, the lockup, downloads and the scorecard.
        </p>
        <div className="lab-tiles">
          {concepts.map((c) => (
            <Tile key={c.n} concept={c} look={look} register={register} />
          ))}
        </div>
      </section>
      <ScoreSummary concepts={concepts} />
    </>
  )
}
