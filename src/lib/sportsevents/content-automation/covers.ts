import type { ContentDestination } from '@/lib/sportsevents/content-automation/types'

/** Capas públicas estáveis (Unsplash) por hub — Instagram exige HTTPS público. */
const DESTINATION_COVERS: Record<ContentDestination, string[]> = {
  Marbella: [
    'https://images.unsplash.com/photo-1551958219-acbc608c6377?auto=format&fit=crop&w=1600&q=80',
    'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=1600&q=80',
  ],
  Algarve: [
    'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?auto=format&fit=crop&w=1600&q=80',
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1600&q=80',
  ],
  Barcelona: [
    'https://images.unsplash.com/photo-1583422409516-2895a77efded?auto=format&fit=crop&w=1600&q=80',
    'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?auto=format&fit=crop&w=1600&q=80',
  ],
}

export function coverImageForDestination(destination: ContentDestination): string {
  const list = DESTINATION_COVERS[destination]
  const idx = Math.floor(Math.random() * list.length)
  return list[idx] || list[0]
}

export function siteOrigin(): string {
  const url =
    process.env.NEXT_PUBLIC_SPORTSEVENTS_SITE_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.URL ||
    'https://sportsevents.app'
  return url.replace(/\/$/, '')
}
