import type { ProductId } from './kpis'

export type LegacyDeepLink = {
  product: ProductId
  label: string
  url: string
  description: string
}

export function getLegacyDeepLinks(): LegacyDeepLink[] {
  return [
    {
      product: 'boost',
      label: 'Boost Store Admin',
      url:
        process.env.NEXT_PUBLIC_BOOST_ADMIN_URL ||
        'https://admin.sportsevents.app',
      description: 'HTML monolítico — login Auth Boost próprio',
    },
    {
      product: 'padel1',
      label: 'Padel One HQ',
      url:
        process.env.NEXT_PUBLIC_PADEL1_HQ_URL ||
        'https://manager.padel1.app/#super-admin',
      description: 'Requer super_admins no Supabase padel1',
    },
    {
      product: 'sportsevents',
      label: 'Equipa (PADEL HUB)',
      // Nunca deep-link a sportsevents.app/admin (Staff legado).
      url: `${(
        process.env.NEXT_PUBLIC_SITE_URL || 'https://admin.sportsevents.app'
      ).replace(/\/$/, '')}/equipa`,
      description: 'Staff do hub = /equipa (hub_staff). Sem admin legado.',
    },
  ]
}

export function getDeepLink(product: ProductId): LegacyDeepLink {
  const found = getLegacyDeepLinks().find((l) => l.product === product)
  if (!found) {
    throw new Error(`Unknown product: ${product}`)
  }
  return found
}
