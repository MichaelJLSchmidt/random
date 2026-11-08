import type { Metadata, Viewport } from 'next'
import { BackgroundField } from '@/components/background/background-field'
import { fieldInitialCss } from '@/components/background/field-css'
import { DisplaySettings } from '@/components/display-settings'
import { Hand } from '@/components/hand/hand'
import { Header } from '@/components/header'
import { LiveRegion } from '@/components/live-region'
import { Reveals } from '@/components/reveals'
import { RouteFocus } from '@/components/route-focus'
import { SiteFooter } from '@/components/site-footer'
import { identityCss, palette } from '@/design/palette'
import { Eggs } from '@/eggs/eggs'
import { images, site } from '@/lib/content'
import { absoluteUrl } from '@/lib/site'
import { prefsScript } from '@/motion/preferences'
import { pathFields } from '@/motion/table-store'
import { motionCss } from '@/motion/tokens'
import { display, mono, text } from './fonts'
import './globals.css'

/** Default Open Graph image (about-og, 1280 px JPEG), only when the deploy passes SITE_URL. */
const og = images['about-og']
const ogUrl = absoluteUrl('/images/about-og-1280.jpg')
const homeUrl = absoluteUrl('/')

export const metadata: Metadata = {
  title: { default: site.name, template: `%s · ${site.name}` },
  description: site.description,
  robots: { index: false, follow: false },
  ...(homeUrl && ogUrl
    ? {
        metadataBase: new URL(homeUrl),
        openGraph: {
          type: 'website',
          siteName: site.name,
          title: site.name,
          description: site.description,
          images: [{ url: ogUrl, width: 1280, height: Math.round((1280 * og.height) / og.width), alt: og.alt }],
        },
      }
    : {}),
}

export const viewport: Viewport = {
  themeColor: palette.ink.field,
  colorScheme: 'dark',
  viewportFit: 'cover',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${text.variable} ${mono.variable}`}
      data-motion="full"
      suppressHydrationWarning
    >
      <head>
        {/* Motion tier, first-visit flag and reveal arming, before first paint. */}
        <script dangerouslySetInnerHTML={{ __html: prefsScript(pathFields()) }} />
        <style dangerouslySetInnerHTML={{ __html: identityCss() + fieldInitialCss() + motionCss() }} />
      </head>
      <body>
        {/* First focusable element; only shown while the first-visit intro runs. */}
        <button type="button" className="intro-skip" data-intro-skip="">
          {site.introSkip}
        </button>
        <a className="skip-link" href="#main">
          {site.skipLink}
        </a>
        {/* Persistent: never remount on navigation. */}
        <BackgroundField />
        <Header />
        <main id="main" tabIndex={-1}>
          {children}
        </main>
        <SiteFooter>
          <DisplaySettings labels={site.settings} />
        </SiteFooter>
        <Hand />
        <LiveRegion />
        <RouteFocus />
        <Reveals />
        <Eggs />
      </body>
    </html>
  )
}
