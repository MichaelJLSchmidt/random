/** The case study most recently drawn from a card (its hero then skips its own Glint). */
let drawn: string | null = null

export const markDrawn = (path: string) => {
  drawn = path
}

export function consumeDrawn(path: string) {
  const hit = drawn !== null && path.replace(/\/$/, '') === drawn
  drawn = null
  return hit
}
