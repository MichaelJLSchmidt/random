import localFont from 'next/font/local'

// Mona Sans: one variable sans for display and body. The file carries only the
// weight axis (200–900), so the width is fixed at 100%; only weight animates.
// Unmodified Latin subset from @fontsource-variable/mona-sans (OFL, RFN "Mona").
export const sans = localFont({
  src: '../fonts/MonaSans-wght.latin.woff2',
  variable: '--font-mona',
  weight: '200 900',
  style: 'normal',
  display: 'swap',
  adjustFontFallback: 'Arial',
  declarations: [{ prop: 'font-stretch', value: '100%' }],
})

// Geist Mono for metadata.
export const mono = localFont({
  src: '../fonts/GeistMono-Variable.latin.woff2',
  variable: '--font-geist-mono',
  weight: '100 900',
  display: 'swap',
  adjustFontFallback: false,
})
