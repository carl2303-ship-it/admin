import type { MetadataRoute } from 'next'

const ICON_V = '20261105'

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/',
    name: 'PADEL HUB',
    short_name: 'PADEL HUB',
    description: 'Backoffice global — Boost, Padel One, SportsEvents',
    start_url: '/dashboard',
    scope: '/',
    display: 'standalone',
    orientation: 'any',
    background_color: '#000000',
    theme_color: '#000000',
    lang: 'pt',
    dir: 'ltr',
    categories: ['business', 'productivity', 'sports'],
    icons: [
      {
        src: `/brand/icon-192.png?v=${ICON_V}`,
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: `/brand/icon-512.png?v=${ICON_V}`,
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: `/brand/icon-512.png?v=${ICON_V}`,
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  }
}
