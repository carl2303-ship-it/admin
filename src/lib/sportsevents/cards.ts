export type CardBrochure = {
  label: string
  href: string
  blurb: string
}

export type DigitalCardRow = {
  id: string
  slug: string
  full_name: string
  title: string
  hub: string | null
  email: string | null
  phone: string | null
  phone_display: string | null
  address_line: string | null
  city: string | null
  postal_code: string | null
  country: string | null
  photo_url: string | null
  brochures: CardBrochure[]
  active: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

export type CardProfile = {
  slug: string
  firstName: string
  fullName: string
  title: string
  hub: string
  email: string
  phone: string
  phoneDisplay: string
  addressLine: string
  city: string
  postalCode: string
  country: string
  photoSrc: string
  vcfHref: string
  brochures: CardBrochure[]
}

/** Slugs that must never become card URLs (static app routes). */
export const RESERVED_CARD_SLUGS = new Set([
  'admin',
  'api',
  'brand',
  'cards',
  'construir',
  'contacto',
  'destinos',
  'eventos',
  'privacidade',
  'quem-somos',
  'termos',
  '_next',
  'favicon.ico',
])

export function normalizeSlug(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48)
}

export function isValidCardSlug(slug: string): boolean {
  return (
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) &&
    slug.length >= 2 &&
    slug.length <= 48 &&
    !RESERVED_CARD_SLUGS.has(slug)
  )
}

export function rowToProfile(row: DigitalCardRow): CardProfile {
  const brochures = Array.isArray(row.brochures) ? row.brochures : []
  return {
    slug: row.slug,
    firstName: row.full_name.trim().split(/\s+/)[0] || row.full_name,
    fullName: row.full_name,
    title: row.title || '',
    hub: row.hub || '',
    email: row.email || '',
    phone: row.phone || '',
    phoneDisplay: row.phone_display || row.phone || '',
    addressLine: row.address_line || '',
    city: row.city || '',
    postalCode: row.postal_code || '',
    country: row.country || '',
    photoSrc: row.photo_url || '',
    vcfHref: `/api/cards/${row.slug}/vcf`,
    brochures,
  }
}

function vcfEscape(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/\n/g, '\\n')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;')
}

export function buildVcf(row: DigitalCardRow, siteUrl: string): string {
  const nameParts = row.full_name.trim().split(/\s+/)
  const first = nameParts[0] || row.full_name
  const last = nameParts.slice(1).join(' ')
  const pageUrl = `${siteUrl.replace(/\/$/, '')}/${row.slug}`
  const lines = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `N:${vcfEscape(last)};${vcfEscape(first)};;;`,
    `FN:${vcfEscape(row.full_name)}`,
    'ORG:SportsEvents.app',
  ]
  if (row.title) lines.push(`TITLE:${vcfEscape(row.title)}`)
  if (row.phone) lines.push(`TEL;TYPE=CELL,VOICE:${row.phone.replace(/\s+/g, '')}`)
  if (row.email) lines.push(`EMAIL;TYPE=INTERNET:${row.email}`)
  lines.push(`URL:${pageUrl}`)
  if (row.address_line || row.city || row.postal_code || row.country) {
    lines.push(
      `ADR;TYPE=WORK:;;${vcfEscape(row.address_line || '')};${vcfEscape(row.city || '')};;${vcfEscape(row.postal_code || '')};${vcfEscape(row.country || '')}`
    )
  }
  lines.push('NOTE:SportsEvents.app - Iberian padel camps & stages')
  lines.push('END:VCARD')
  return `${lines.join('\r\n')}\r\n`
}

export function siteBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.URL ||
    'https://sportsevents.app'
  ).replace(/\/$/, '')
}

export type CardWritePayload = {
  slug: string
  full_name: string
  title: string
  hub?: string | null
  email?: string | null
  phone?: string | null
  phone_display?: string | null
  address_line?: string | null
  city?: string | null
  postal_code?: string | null
  country?: string | null
  photo_url?: string | null
  brochures?: CardBrochure[]
  active?: boolean
  sort_order?: number
}

export function sanitizeBrochures(raw: unknown): CardBrochure[] {
  if (!Array.isArray(raw)) return []
  return raw
    .map((item) => {
      if (!item || typeof item !== 'object') return null
      const o = item as Record<string, unknown>
      const label = String(o.label || '').trim()
      const href = String(o.href || '').trim()
      const blurb = String(o.blurb || '').trim()
      if (!label || !href) return null
      return { label, href, blurb }
    })
    .filter(Boolean) as CardBrochure[]
}
