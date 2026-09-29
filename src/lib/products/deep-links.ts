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
        'https://boostpadel.store/admin.html',
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
      label: 'SportsEvents ERP',
      url:
        process.env.NEXT_PUBLIC_SPORTSEVENTS_ADMIN_URL ||
        'https://sportsevents.app/admin',
      description: 'Requer staff_members no Supabase SE',
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
