import type { Metadata, Viewport } from 'next'
import { DisplaySettings } from '@/components/display-settings'
import { DrawHandler } from '@/components/draw-handler'
import { Interactions } from '@/components/interactions'
import { LiveRegion } from '@/components/live-region'
import { MotionProvider } from '@/components/motion-provider'
import { PageMotion } from '@/components/page-motion'
import { RouteFocus } from '@/components/route-focus'
import { ScrollMotion } from '@/components/scroll-motion'
import { SiteFooter } from '@/components/site-footer'
import { SiteHeader } from '@/components/site-header'
import { site } from '@/lib/content'
import { prefsScript } from '@/motion/preferences'
import { motionCss } from '@/motion/tokens'
import { mono, sans } from './fonts'
import './globals.css'

export const metadata: Metadata = {
  title: { default: site.name, template: `%s · ${site.name}` },
  description: site.description,
  robots: { index: false, follow: false },
}

export const viewport: Viewport = {
  themeColor: '#09090b',
  colorScheme: 'dark',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${sans.variable} ${mono.variable}`}
      data-motion="full"
      data-foil="on"
      suppressHydrationWarning
    >
      <head>
        {/* Applies the motion tier and foil preference before first paint. */}
        <script dangerouslySetInnerHTML={{ __html: prefsScript }} />
        <style dangerouslySetInnerHTML={{ __html: motionCss() }} />
      </head>
      <body>
        {/* First focusable element; only shown while the first-visit intro runs. */}
        <button type="button" className="intro-skip" data-intro-skip="">
          {site.introSkip}
        </button>
        <a className="skip-link" href="#main">
          {site.skipLink}
        </a>
        <MotionProvider>
          <SiteHeader />
          <main id="main" tabIndex={-1}>
            {children}
          </main>
          <SiteFooter>
            <DisplaySettings labels={site.settings} />
          </SiteFooter>
        </MotionProvider>
        <LiveRegion />
        <RouteFocus />
        <PageMotion />
        <ScrollMotion />
        <DrawHandler />
        <Interactions />
      </body>
    </html>
  )
}
