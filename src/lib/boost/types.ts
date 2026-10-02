export type BoostProduct = {
  id: string
  name: string
  slug: string
  price: number
  compare_at_price: number | null
  stock: number | null
  image_url: string | null
  additional_images: string[] | null
  video_url: string | null
  short_description: string | null
  description: string | null
  active: boolean
  is_featured: boolean
  is_digital: boolean
  download_url: string | null
  learn_more_url: string | null
  /** Slug do ebook_funnels quando o produto é a ficha loja de um funil */
  funnel_slug?: string | null
  category_id: string | null
  brand_id: string | null
  colors: unknown
  sizes: unknown
  created_at: string
  updated_at: string | null
  category?: { name: string } | null
  brand?: { name: string } | null
}

export type BoostOrder = {
  id: string
  customer_name: string | null
  customer_email: string | null
  status: string
  total: number | null
  created_at: string
  shipping_address: string | null
  notes: string | null
}

export type BoostOrderItem = {
  id: string
  order_id: string
  product_id?: string | null
  product_name: string | null
  quantity: number
  price?: number
  product_price?: number
  subtotal?: number
}

export type BoostCategory = {
  id: string
  name: string
  slug: string
  description: string | null
  display_order: number
  active: boolean
}

export type BoostBrand = {
  id: string
  name: string
  slug: string
  description: string | null
  logo_url: string | null
  website_url: string | null
  display_order: number
  active: boolean
}

export type BoostDiscount = {
  id: string
  code: string
  description: string | null
  type: string
  value: number
  min_purchase: number | null
  max_uses: number | null
  used_count: number
  applies_to: string
  category: string | null
  product_ids: string[] | null
  valid_from: string | null
  valid_until: string | null
  active: boolean
}

export type BoostOrganization = {
  id: string
  name: string
  slug: string
  owner_email: string | null
  plan_type: string
  status: string
  language: string | null
  currency: string | null
  max_tournaments: number | null
  source: string
  primary_color: string | null
  accent_color: string | null
  contract_start: string | null
  subscription_expires_at: string | null
  tour_user_id: string | null
  stripe_subscription_id: string | null
  cancel_at_period_end: boolean | null
  /** Último envio de link de renovação (manual ou cron). Opcional até migration Boost. */
  renewal_payment_link_sent_at?: string | null
  created_at: string
}

export const PLAN_PRICES: Record<string, number> = {
  bronze: 9.9,
  silver: 19.9,
  gold: 29.9,
  platinum: 39.9,
}

export const PLAN_MAX_TOURNAMENTS: Record<string, number> = {
  bronze: 4,
  silver: 10,
  gold: 15,
  platinum: 999,
}

export const PLAN_LABELS: Record<string, string> = {
  bronze: 'Bronze',
  silver: 'Silver',
  gold: 'Gold',
  platinum: 'Platinum',
}

export const ORDER_STATUSES = [
  'pending',
  'paid',
  'shipped',
  'delivered',
  'cancelled',
] as const

export type BoostBlogPost = {
  id: string
  title: string
  slug: string
  author: string | null
  category: string | null
  image_url: string | null
  excerpt: string | null
  content: string | null
  published: boolean
  featured: boolean | null
  created_at: string
  updated_at: string | null
}

export type BoostNewsletterSubscriber = {
  id: string
  email: string
  active: boolean | null
  subscribed_at: string | null
  created_at?: string | null
}

export type BoostEbookLead = {
  id: string
  name: string | null
  email: string
  phone: string | null
  download_count: number | null
  newsletter_opt_in: boolean | null
  created_at: string
}

export type BoostEbookPurchase = {
  id: string
  customer_name: string | null
  customer_email: string | null
  product_type: string | null
  amount: number | null
  status: string | null
  stripe_session_id: string | null
  created_at: string
}

export type EbookFunnelStatus = 'draft' | 'active' | 'archived'

/** Kinds genéricos do funnel builder (+ legados PADEL IQ ainda aceites na DB). */
export type EbookFunnelAssetKind =
  | 'ebook_pdf'
  | 'upsell'
  | 'downsell'
  | 'thankyou_bonus'
  | 'cover'
  | 'landing_image'
  | 'other'
  // legado (DB / emails / thank-you)
  | 'cheat_sheet'
  | 'mental_cheat_sheet'
  | 'audio'
  | 'upsell_video'

export type EbookFunnelLandingBody = {
  benefits?: string[]
  body_markdown?: string
  tone?: string
  language?: string
  images?: string[]
  generated_at?: string
  source_description?: string
}

export type BoostEbookFunnel = {
  id: string
  title: string
  slug: string
  ebook_price_cents: number
  upsell_price_cents: number
  ebook_product_type: string
  upsell_product_type: string
  stripe_ebook_name: string
  stripe_upsell_name: string
  languages: string[]
  headline: string
  subheadline: string
  cta_label: string
  landing_body: EbookFunnelLandingBody | null
  status: EbookFunnelStatus
  created_at: string
  updated_at: string
}

export type BoostEbookFunnelAsset = {
  id: string
  funnel_id: string
  language: string
  kind: EbookFunnelAssetKind
  storage_path: string
  public_url: string
  file_name: string | null
  created_at: string
  updated_at: string
}

export const EBOOK_FUNNEL_LANGUAGES = ['pt', 'en', 'es', 'it', 'fr'] as const

/** Slots de upload no hub (kinds genéricos). */
export const EBOOK_FUNNEL_ASSET_KINDS: {
  kind: EbookFunnelAssetKind
  label: string
  accept: string
  multiple?: boolean
  hint?: string
}[] = [
  {
    kind: 'ebook_pdf',
    label: 'PDF ebook (produto digital principal)',
    accept: 'application/pdf',
  },
  {
    kind: 'upsell',
    label: 'Upsell (ficheiro / vídeo / oferta)',
    accept:
      'application/pdf,video/mp4,video/quicktime,image/jpeg,image/png,image/webp',
  },
  {
    kind: 'downsell',
    label: 'Downsell (opcional)',
    accept:
      'application/pdf,video/mp4,video/quicktime,image/jpeg,image/png,image/webp',
  },
  {
    kind: 'thankyou_bonus',
    label: 'Materiais thank-you / bónus',
    accept:
      'application/pdf,audio/mpeg,audio/mp3,image/jpeg,image/png,image/webp',
  },
  {
    kind: 'cover',
    label: 'Capa / imagem hero',
    accept: 'image/jpeg,image/png,image/webp',
  },
  {
    kind: 'landing_image',
    label: 'Imagens da landing (galeria)',
    accept: 'image/jpeg,image/png,image/webp',
    hint: 'Imagem principal da galeria. Para várias fotos, usa «Gerar landing com AI» (ficam em landing_body.images).',
  },
]

/** Mapeia kinds legados → canónicos (leitura / labels). */
export const EBOOK_FUNNEL_KIND_ALIASES: Record<string, EbookFunnelAssetKind> = {
  cheat_sheet: 'thankyou_bonus',
  mental_cheat_sheet: 'thankyou_bonus',
  audio: 'thankyou_bonus',
  upsell_video: 'upsell',
}

export function canonicalFunnelAssetKind(
  kind: string
): EbookFunnelAssetKind | string {
  return EBOOK_FUNNEL_KIND_ALIASES[kind] || kind
}
