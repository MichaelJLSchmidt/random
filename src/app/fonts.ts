import localFont from 'next/font/local'

// One variable sans (wght 100–900) for display and body; animate weight only.
export const sans = localFont({
  src: '../fonts/Geist-Variable.latin.woff2',
  variable: '--font-geist',
  weight: '100 900',
  display: 'swap',
  adjustFontFallback: 'Arial',
})

// Monospace for metadata.
export const mono = localFont({
  src: '../fonts/GeistMono-Variable.latin.woff2',
  variable: '--font-geist-mono',
  weight: '100 900',
  display: 'swap',
  adjustFontFallback: false,
})
