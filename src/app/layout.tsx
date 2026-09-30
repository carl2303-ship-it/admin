import type { Metadata } from 'next'
import { Space_Grotesk, Manrope } from 'next/font/google'
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

export const metadata: Metadata = {
  title: 'PADEL HUB',
  description: 'Backoffice global — Boost, Padel One, SportsEvents',
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || 'https://admin.sportsevents.app'
  ),
}

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html
      lang="pt"
      className={`${display.variable} ${body.variable} h-full antialiased`}
    >
      <body className="min-h-full font-[family-name:var(--font-body)] text-zinc-900">
        {children}
      </body>
    </html>
  )
}
