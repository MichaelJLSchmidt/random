import type { Motif as MotifName } from '@/lib/content'

/** Decorative line art for a card window. Greyscale strokes; the foil sits on top. */
export function Motif({ name }: { name: MotifName }) {
  return (
    <svg viewBox="0 0 100 80" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
      {name === 'rings' && Array.from({ length: 11 }, (_, i) => <circle key={i} cx="72" cy="58" r={6 + i * 7} />)}
      {name === 'grid' &&
        Array.from({ length: 9 }, (_, row) =>
          Array.from({ length: 12 }, (_, col) => (
            <rect
              key={`${row}-${col}`}
              x={col * 8.6 + 1}
              y={row * 8.6 + 1}
              width="5.2"
              height="5.2"
              rx="1"
              opacity={(row + col) % 5 === 0 ? 1 : 0.35}
            />
          )),
        )}
      {name === 'waves' &&
        Array.from({ length: 10 }, (_, i) => (
          <path key={i} d={`M-5 ${10 + i * 7} q 13 -9 26 0 t 26 0 t 26 0 t 26 0 t 26 0`} />
        ))}
    </svg>
  )
}

/** Card back: nested frames around a small mark. Decorative. */
export function BackPattern() {
  return (
    <svg viewBox="0 0 63 88" aria-hidden="true" focusable="false">
      {Array.from({ length: 6 }, (_, i) => (
        <rect key={i} x={4 + i * 3.2} y={4 + i * 3.2} width={55 - i * 6.4} height={80 - i * 6.4} rx={4 - i * 0.4} />
      ))}
      <rect x="25.5" y="35" width="12" height="18" rx="1.6" className="mark" />
    </svg>
  )
}
