/*
 * Watches the view transitions React starts (it calls
 * document.startViewTransition for every navigation inside a transition), so
 * focus and announcements can wait for the morph to finish.
 */
let current: ViewTransition | null = null

if (typeof document !== 'undefined' && 'startViewTransition' in document) {
  const original = document.startViewTransition.bind(document)
  document.startViewTransition = ((arg?: never) => {
    const transition = original(arg)
    current = transition
    transition.finished.finally(() => {
      if (current === transition) current = null
    })
    return transition
  }) as typeof document.startViewTransition
}

/** Runs `fn` after the running view transition (if any) has finished, on the next frame. */
export function afterTransition(fn: () => void) {
  const transition = current
  if (transition) transition.finished.finally(() => requestAnimationFrame(fn))
  else requestAnimationFrame(fn)
}
