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

export type EbookFunnelAssetKind =
  | 'ebook_pdf'
  | 'cheat_sheet'
  | 'mental_cheat_sheet'
  | 'audio'
  | 'upsell_video'
  | 'cover'
  | 'other'

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

export const EBOOK_FUNNEL_ASSET_KINDS: {
  kind: EbookFunnelAssetKind
  label: string
  accept: string
}[] = [
  { kind: 'ebook_pdf', label: 'PDF do ebook', accept: 'application/pdf' },
  { kind: 'cheat_sheet', label: 'Cheat sheet', accept: 'application/pdf' },
  {
    kind: 'mental_cheat_sheet',
    label: 'Cheat sheet mental (upsell)',
    accept: 'application/pdf',
  },
  { kind: 'audio', label: 'Áudio pré-jogo', accept: 'audio/mpeg,audio/mp3' },
  {
    kind: 'upsell_video',
    label: 'Vídeo upsell (mp4)',
    accept: 'video/mp4,video/quicktime',
  },
  { kind: 'cover', label: 'Capa / imagem', accept: 'image/jpeg,image/png,image/webp' },
]
