import type { Metadata, Viewport } from 'next'
import { Space_Grotesk, Manrope } from 'next/font/google'
import { RegisterServiceWorker } from '@/components/pwa/register-sw'
import './globals.css'

const display = Space_Grotesk({
  variable: '--font-display',
  subsets: ['latin'],
  weight: ['500', '600', '700'],
})

const body = Manrope({
  variable: '--font-body',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
})

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL || 'https://admin.sportsevents.app'

/** Cache-bust Netlify/CDN + favicon agressivo dos browsers */
const ICON_V = '20261105'

export const metadata: Metadata = {
  title: 'PADEL HUB',
  description: 'Backoffice global — Boost, Padel One, SportsEvents',
  applicationName: 'PADEL HUB',
  metadataBase: new URL(siteUrl),
  manifest: `/manifest.webmanifest?v=${ICON_V}`,
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'PADEL HUB',
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: `/favicon.ico?v=${ICON_V}`, sizes: 'any' },
      {
        url: `/brand/icon-192.png?v=${ICON_V}`,
        sizes: '192x192',
        type: 'image/png',
      },
      {
        url: `/brand/icon-512.png?v=${ICON_V}`,
        sizes: '512x512',
        type: 'image/png',
      },
    ],
    apple: [
      {
        url: `/brand/apple-touch-icon.png?v=${ICON_V}`,
        sizes: '180x180',
        type: 'image/png',
      },
    ],
    shortcut: [`/brand/icon-192.png?v=${ICON_V}`],
  },
  other: {
    'mobile-web-app-capable': 'yes',
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: '#000000' },
    { media: '(prefers-color-scheme: light)', color: '#000000' },
  ],
  colorScheme: 'dark',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html
      lang="pt"
      className={`${display.variable} ${body.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-black font-[family-name:var(--font-body)] text-slate-100">
        {children}
        <RegisterServiceWorker />
      </body>
    </html>
  )
}
