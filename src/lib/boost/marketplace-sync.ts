/**
 * Sync Store → Padel1 marketplace_listings (source=store).
 * Field contract: docs/marketplace-mvp-plan.md (Project).
 * Schema owned by Player worker — columns below match the plan.
 */

export type MarketplaceCategory =
  | 'raquetes'
  | 'acessorios'
  | 'nutricao'
  | 'outros'

export type MarketplaceListingStatus = 'active' | 'inactive' | 'sold'

/** Row we upsert for official Store products. */
export type StoreMarketplaceListingPayload = {
  source: 'store'
  store_product_id: string
  title: string
  description: string | null
  /** EUR (plan: Preço EUR). */
  price: number
  category: MarketplaceCategory
  condition: 'novo'
  /** Up to 4 public image URLs. */
  photos: string[]
  /** Official store seller marker. */
  seller_type: 'store'
  status: MarketplaceListingStatus
  updated_at: string
}

export function stripHtml(html: string | null | undefined): string {
  if (!html) return ''
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/\s+/g, ' ')
    .trim()
}

export function collectProductPhotos(
  imageUrl: string | null | undefined,
  additional: unknown
): string[] {
  const urls: string[] = []
  const push = (u: unknown) => {
    const s = String(u || '').trim()
    if (s && !urls.includes(s)) urls.push(s)
  }
  push(imageUrl)
  if (Array.isArray(additional)) {
    for (const u of additional) push(u)
  } else if (typeof additional === 'string' && additional.trim()) {
    try {
      const parsed = JSON.parse(additional)
      if (Array.isArray(parsed)) {
        for (const u of parsed) push(u)
      } else {
        for (const line of additional.split('\n')) push(line)
      }
    } catch {
      for (const line of additional.split('\n')) push(line)
    }
  }
  return urls.slice(0, 4)
}

/** Map Boost category name/slug → marketplace enum. */
export function mapStoreCategoryToMarketplace(
  nameOrSlug: string | null | undefined
): MarketplaceCategory {
  const s = String(nameOrSlug || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
  if (!s) return 'outros'
  if (/raquet|racket|pala/.test(s)) return 'raquetes'
  if (/nutri|suplement|proteina|barra|gel|bebida/.test(s)) return 'nutricao'
  if (
    /acessor|grip|overgrip|bola|ball|bag|saco|mochila|roupa|apparel|calcado|shoe|meia|towel|toalha|cordao|wrist/.test(
      s
    )
  ) {
    return 'acessorios'
  }
  if (/ebook|digital|curso|tour|saas|licenc/.test(s)) return 'outros'
  return 'acessorios'
}

export function buildStoreListingPayload(input: {
  productId: string
  name: string
  price: number
  shortDescription?: string | null
  description?: string | null
  imageUrl?: string | null
  additionalImages?: unknown
  categoryName?: string | null
  categorySlug?: string | null
  status?: MarketplaceListingStatus
}): StoreMarketplaceListingPayload {
  const short = stripHtml(input.shortDescription)
  const long = stripHtml(input.description)
  const description = short || long || null
  return {
    source: 'store',
    store_product_id: input.productId,
    title: String(input.name || '').trim() || 'Produto Store',
    description,
    price: Number(input.price) || 0,
    category: mapStoreCategoryToMarketplace(
      input.categorySlug || input.categoryName
    ),
    condition: 'novo',
    photos: collectProductPhotos(input.imageUrl, input.additionalImages),
    seller_type: 'store',
    status: input.status ?? 'active',
    updated_at: new Date().toISOString(),
  }
}
