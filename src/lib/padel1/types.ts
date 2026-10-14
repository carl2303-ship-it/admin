export type ActionResult =
  | { ok: true; message?: string; data?: Record<string, unknown> }
  | { ok: false; error: string }

export type QueryResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; missingConfig?: boolean }

export type Padel1Club = {
  id: string
  owner_id: string | null
  name: string
  description: string | null
  city: string | null
  country: string | null
  address: string | null
  phone: string | null
  email: string | null
  website: string | null
  is_active: boolean
  is_managed: boolean
  status: string
  plan_type: string
  tour_license_active: boolean
  created_at: string
  logo_url: string | null
  photo_url_1: string | null
  photo_url_2: string | null
  contract_start: string | null
  contract_expires_at: string | null
}

export type Padel1ClubForm = {
  name: string
  description: string
  city: string
  address: string
  country: string
  phone: string
  email: string
  website: string
  logo_url: string
  photo_url_1: string
  photo_url_2: string
  plan_type: string
}

export type Padel1LicenseKey = {
  id: string
  license_key: string
  plan_name: string
  duration_months: number
  status: string
  custom_price: number | null
  created_at: string
  activated_at: string | null
  target_entity_id: string | null
}

export type Padel1PlatformModule = {
  code: string
  name: string
  description: string | null
  price_monthly: number | null
  price_annual: number | null
  target_types: string[]
  requires_modules: string[] | null
  player_app_mode: string | null
  landing_features: string[] | null
  sort_order: number | null
  is_active: boolean
}

export type Padel1PlatformPack = {
  code: string
  name: string
  tagline: string | null
  description: string | null
  price_monthly: number | null
  price_annual: number | null
  compare_price_monthly: number | null
  compare_price_annual: number | null
  module_codes: string[] | null
  landing_features: string[] | null
  is_popular: boolean
  sort_order: number | null
  is_active: boolean
}

export type Padel1ClientModule = {
  module_code: string
  enabled: boolean
  expires_at: string | null
}

export type Padel1PlayerTransaction = {
  id: string
  club_owner_id: string
  player_account_id: string | null
  player_name: string
  player_phone: string
  transaction_type: string
  amount: number
  notes: string | null
  transaction_date: string
  created_at: string
}

export type Padel1PlatformPayment = {
  id: string
  license_key_id: string | null
  stripe_session_id: string | null
  stripe_payment_intent: string | null
  amount: number
  currency: string
  target_type: string
  target_entity_id: string | null
  payer_email: string | null
  payer_name: string | null
  status: string
  created_at: string
}

export type Padel1SuperAdmin = {
  id: string
  user_id: string
  name: string
  created_at: string
}

export type Padel1CombinedUser = {
  id: string
  name: string
  phone: string
  email: string
  role: 'player' | 'manager' | 'organizer' | 'super_admin'
  rewardPoints: number
  createdAt: string
  userId: string | null
}

export type Padel1PlatformPlan = {
  id: string
  name: string
  target_type: 'club' | 'organizer'
  price_monthly: number | null
  price_annual: number | null
  is_active: boolean
  features: Record<string, unknown> | null
  created_at: string
}

export type Padel1StripeConfigStatus = {
  id: string
  hasPublishable: boolean
  hasSecret: boolean
  hasWebhook: boolean
  publishablePreview: string | null
  updated_at: string | null
}

export type Padel1DashboardKpis = {
  players: number
  activeClubs: number
  totalClubs: number
  txnVolume: number
  planCounts: { bronze: number; silver: number; gold: number }
  txnsByType: { type: string; total: number }[]
  monthlyPlayers: { month: string; count: number }[]
}

export type Padel1Metrics = {
  totalClubs: number
  activeClubs: number
  totalPlayers: number
  clubRevenue: number
  licenses: { total: number; active: number; used: number; expired: number }
  expiringSoon: number
  planCounts: { bronze: number; silver: number; gold: number }
  monthlyRevenue: { month: string; total: number }[]
  monthlyClubGrowth: { month: string; count: number }[]
}

export const PLAN_TYPES = ['bronze', 'silver', 'gold'] as const
export const MODULE_CODES = [
  'tournaments',
  'manager',
  'bar',
  'ai_full',
  'ai_light',
] as const

export const TXN_TYPE_LABELS: Record<string, string> = {
  booking: 'Reserva',
  open_game: 'Jogo Aberto',
  academy: 'Academia',
  bar: 'Bar',
  bar_tab: 'Conta Bar',
  tournament: 'Torneio',
  adjustment: 'Ajuste',
}
