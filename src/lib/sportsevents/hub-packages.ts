import type { Locale } from '@/lib/sportsevents/locale'

export type HubId = 'algarve' | 'barcelona' | 'marbella'
export type PackageKey = 'weekend' | 'experience' | 'premium'

export type PackageItineraryStep = { day: string; detail: string }
export type PackageRoutineStep = { title: string; text: string }

export type PackagePrice = {
  bbDouble: number
  bbSingle: number
  hbDouble: number
  hbSingle: number
  fullDouble: number
  fullSingle: number
}

export type MealPlanKey = 'bb' | 'hb' | 'full'

export const MEAL_PLAN_LABELS: Record<
  MealPlanKey,
  { label: string; blurb: string }
> = {
  bb: {
    label: 'Alojamento + pequeno-almoço',
    blurb: 'Refeições livres',
  },
  hb: {
    label: 'Meia pensão',
    blurb: 'Pequeno-almoço + jantar',
  },
  full: {
    label: 'Pensão completa',
    blurb: 'Almoços e jantares incluídos',
  },
}

/** Preço 0 = opção indisponível. */
export function isPriceAvailable(value: number): boolean {
  return Number(value) > 0
}

export function mealPlanPrices(
  prices: PackagePrice,
  plan: MealPlanKey
): { double: number; single: number } {
  if (plan === 'bb') return { double: prices.bbDouble, single: prices.bbSingle }
  if (plan === 'hb') return { double: prices.hbDouble, single: prices.hbSingle }
  return { double: prices.fullDouble, single: prices.fullSingle }
}

export function isMealPlanAvailable(
  prices: PackagePrice,
  plan: MealPlanKey
): boolean {
  const { double, single } = mealPlanPrices(prices, plan)
  return isPriceAvailable(double) || isPriceAvailable(single)
}

export function availableMealPlans(prices: PackagePrice): MealPlanKey[] {
  return (['bb', 'hb', 'full'] as MealPlanKey[]).filter((p) =>
    isMealPlanAvailable(prices, p)
  )
}

/** Menor preço disponível (>0) para “desde X €”. */
export function lowestAvailablePrice(prices: PackagePrice): number | null {
  const vals = [
    prices.bbDouble,
    prices.bbSingle,
    prices.hbDouble,
    prices.hbSingle,
    prices.fullDouble,
    prices.fullSingle,
  ].filter(isPriceAvailable)
  if (vals.length === 0) return null
  return Math.min(...vals)
}

export type PackageLocaleFields = {
  name?: string
  duration?: string
  schedule?: string
  concept?: string
  airport_label?: string
  local_network?: string
  itinerary?: PackageItineraryStep[]
  inclusions?: string[]
  routine?: PackageRoutineStep[]
}

export type PackageTranslations = {
  en?: PackageLocaleFields
  es?: PackageLocaleFields
  fr?: PackageLocaleFields
  de?: PackageLocaleFields
}

export type HubPackageView = {
  id: string
  packageKey: PackageKey
  name: string
  duration: string
  schedule: string
  concept: string
  featured: boolean
  courtHours: number
  coachHours: number
  localMatchHours: number
  tournamentHours: number
  nights: number
  itinerary: PackageItineraryStep[]
  prices: PackagePrice
  airportLabel: string
  localNetwork: string
  inclusions: string[]
  routine: PackageRoutineStep[]
  published: boolean
  sortOrder: number
  destinationId: string
  destinationCode: string
  destinationName: string
  /** PT base + EN para edição no admin. */
  translations?: PackageTranslations
  /** Stripe Connect split (admin / checkout). */
  hotelPartnerId: string | null
  transferPartnerId: string | null
  splitHotelPercent: number
  splitTransferPercent: number
}

export type HubPackageRow = {
  id: string
  destination_id: string
  package_key: PackageKey
  name: string
  duration: string
  schedule: string
  concept: string
  featured: boolean
  court_hours: number
  coach_hours: number
  local_match_hours: number
  tournament_hours: number
  nights: number
  itinerary: PackageItineraryStep[] | null
  price_bb_double: number | string
  price_bb_single: number | string
  price_hb_double: number | string
  price_hb_single: number | string
  price_full_double: number | string
  price_full_single: number | string
  airport_label: string | null
  local_network: string | null
  inclusions: string[] | null
  routine: PackageRoutineStep[] | null
  translations?: PackageTranslations | null
  published: boolean
  sort_order: number
  hotel_partner_id?: string | null
  transfer_partner_id?: string | null
  split_hotel_percent?: number | string | null
  split_transfer_percent?: number | string | null
  destinations?: { id: string; code: string; name: string } | null
}

export const HUB_ID_TO_CODE: Record<HubId, string> = {
  algarve: 'ALG',
  barcelona: 'BCN',
  marbella: 'MAR',
}

export const HUB_CODE_TO_ID: Record<string, HubId> = {
  ALG: 'algarve',
  ALGARVE: 'algarve',
  BCN: 'barcelona',
  MAR: 'marbella',
  MRB: 'marbella',
}

export const HUB_LABELS: Record<HubId, string> = {
  algarve: 'Algarve',
  barcelona: 'Barcelona',
  marbella: 'Marbella',
}

export function formatEuro(value: number): string {
  return new Intl.NumberFormat('pt-PT', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(value)
}

function num(v: number | string | null | undefined): number {
  return Number(v || 0)
}

export function rowToView(
  row: HubPackageRow,
  locale: Locale = 'en'
): HubPackageView {
  const dest = row.destinations
  const localized =
    locale === 'pt'
      ? null
      : (row.translations?.[locale as keyof PackageTranslations] as
          | PackageLocaleFields
          | undefined) ||
        row.translations?.en
  const useLoc = Boolean(localized)

  return {
    id: row.id,
    packageKey: row.package_key,
    name: (useLoc && localized?.name) || row.name,
    duration: (useLoc && localized?.duration) || row.duration,
    schedule: (useLoc && localized?.schedule) || row.schedule,
    concept: (useLoc && localized?.concept) || row.concept,
    featured: row.featured,
    courtHours: row.court_hours,
    coachHours: row.coach_hours,
    localMatchHours: row.local_match_hours,
    tournamentHours: row.tournament_hours,
    nights: row.nights,
    itinerary:
      useLoc && Array.isArray(localized?.itinerary)
        ? localized!.itinerary!
        : Array.isArray(row.itinerary)
          ? row.itinerary
          : [],
    prices: {
      bbDouble: num(row.price_bb_double),
      bbSingle: num(row.price_bb_single),
      hbDouble: num(row.price_hb_double),
      hbSingle: num(row.price_hb_single),
      fullDouble: num(row.price_full_double),
      fullSingle: num(row.price_full_single),
    },
    airportLabel:
      (useLoc && localized?.airport_label) || row.airport_label || '',
    localNetwork:
      (useLoc && localized?.local_network) || row.local_network || '',
    inclusions:
      useLoc && Array.isArray(localized?.inclusions)
        ? localized!.inclusions!
        : Array.isArray(row.inclusions)
          ? row.inclusions
          : [],
    routine:
      useLoc && Array.isArray(localized?.routine)
        ? localized!.routine!
        : Array.isArray(row.routine)
          ? row.routine
          : [],
    published: row.published,
    sortOrder: row.sort_order,
    destinationId: row.destination_id,
    destinationCode: dest?.code || '',
    destinationName: dest?.name || '',
    translations: row.translations || {},
    hotelPartnerId: row.hotel_partner_id || null,
    transferPartnerId: row.transfer_partner_id || null,
    splitHotelPercent: Number(row.split_hotel_percent || 0),
    splitTransferPercent: Number(row.split_transfer_percent || 0),
  }
}

export type HubPackageWrite = {
  destination_id: string
  package_key: PackageKey
  name: string
  duration: string
  schedule: string
  concept: string
  featured: boolean
  court_hours: number
  coach_hours: number
  local_match_hours: number
  tournament_hours: number
  nights: number
  itinerary: PackageItineraryStep[]
  price_bb_double: number
  price_bb_single: number
  price_hb_double: number
  price_hb_single: number
  price_full_double: number
  price_full_single: number
  airport_label: string
  local_network: string
  inclusions: string[]
  routine: PackageRoutineStep[]
  translations?: PackageTranslations
  published: boolean
  sort_order: number
  hotel_partner_id: string | null
  transfer_partner_id: string | null
  split_hotel_percent: number
  split_transfer_percent: number
}

/** Prefill de ficha de evento a partir de um pacote catálogo. */
export function packageToEventPrefill(pkg: HubPackageView): {
  hub_package_id: string
  title: string
  destination_id: string
  short_description: string
  description: string
  program: string
  includes: string
  highlights: string
  welcome_pack: string
  sale_price_per_person: number
  deposit_amount: number
  nights: number
} {
  const program = pkg.itinerary
    .map((s) => `${s.day} — ${s.detail}`)
    .join('\n')

  const includes = [
    ...pkg.inclusions,
    pkg.airportLabel ? `Transfers: ${pkg.airportLabel}` : '',
    pkg.localNetwork ? `Jogos locais: ${pkg.localNetwork}` : '',
  ]
    .filter(Boolean)
    .join('\n')

  const highlights = [
    pkg.duration,
    pkg.schedule,
    `${pkg.courtHours}h de campo`,
    `${pkg.coachHours}h treino`,
    `${pkg.localMatchHours}h vs. locais`,
    pkg.tournamentHours ? `${pkg.tournamentHours}h torneio` : '',
  ]
    .filter(Boolean)
    .join(' · ')

  const welcome =
    pkg.inclusions.find((l) => /welcome|boas-vindas|t-shirt/i.test(l)) ||
    'Welcome Pack Premium incluído'

  const price =
    lowestAvailablePrice(pkg.prices) ||
    pkg.prices.bbDouble ||
    pkg.prices.hbDouble ||
    pkg.prices.fullDouble ||
    0

  return {
    hub_package_id: pkg.id,
    title: pkg.name,
    destination_id: pkg.destinationId,
    short_description: pkg.concept,
    description: [
      pkg.concept,
      '',
      `Duração: ${pkg.duration}${pkg.schedule ? ` (${pkg.schedule})` : ''}.`,
      `Programa: ${pkg.courtHours}h campo · ${pkg.coachHours}h treino · ${pkg.localMatchHours}h jogo local${
        pkg.tournamentHours ? ` · ${pkg.tournamentHours}h torneio` : ''
      }.`,
    ].join('\n'),
    program,
    includes,
    highlights,
    welcome_pack: welcome,
    sale_price_per_person: price,
    deposit_amount: Math.max(150, Math.round(price * 0.15)),
    nights: pkg.nights,
  }
}

/** Calcula end_date a partir de start_date + noites. */
export function endDateFromNights(startDate: string, nights: number): string {
  if (!startDate || !nights) return ''
  const d = new Date(`${startDate}T12:00:00`)
  if (Number.isNaN(d.getTime())) return ''
  d.setDate(d.getDate() + nights)
  return d.toISOString().slice(0, 10)
}
