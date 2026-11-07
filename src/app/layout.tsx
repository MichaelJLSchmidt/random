import type { Metadata, Viewport } from 'next'
import { motionCss } from '@/motion/tokens'
import { prefsScript } from '@/motion/preferences'
import { mono, sans } from './fonts'
import './globals.css'

export const metadata: Metadata = {
  title: 'Portfolio',
}

export const viewport: Viewport = {
  themeColor: '#09090b',
  colorScheme: 'dark',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable}`} data-motion="full" data-foil="on" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: prefsScript }} />
        <style dangerouslySetInnerHTML={{ __html: motionCss() }} />
      </head>
      <body>{children}</body>
    </html>
  )
}
