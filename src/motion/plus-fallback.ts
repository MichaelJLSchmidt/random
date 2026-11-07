/*
 * Stand-in for the parts of motion-plus this site uses, for installs without
 * MOTION_TOKEN (next.config.ts aliases the module here and the type check maps
 * it in tsconfig.fallback.json). Same call shapes, simpler behaviour.
 */
type TypewriterOptions = { speed?: 'slow' | 'normal' | 'fast' | number; cursorBlinkRepeat?: number }

/** Types `text` into `target` one character at a time (no cursor). */
export function typewriter(target: Element, text: string, options: TypewriterOptions = {}) {
  const step =
    typeof options.speed === 'number'
      ? options.speed
      : options.speed === 'fast'
        ? 30
        : options.speed === 'slow'
          ? 130
          : 75
  let i = 0
  let timer = 0
  const finished = new Promise<void>((resolve) => {
    const tick = () => {
      target.textContent = text.slice(0, ++i)
      if (i < text.length) timer = window.setTimeout(tick, step)
      else resolve()
    }
    tick()
  })
  return {
    finished,
    stop: () => clearTimeout(timer),
  }
}
