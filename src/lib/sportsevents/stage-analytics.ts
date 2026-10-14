import {
  computeStageMetrics,
  eventsInMonth,
  formatEur,
  monthBounds,
  type BookingLite,
  type StageEventLite,
} from '@/lib/sportsevents/stage-metrics'

export type PeriodMode = 'month' | 'quarter' | 'year' | 'all'

export type PackageBookingLite = {
  id: string
  status: string | null
  padel_service_amount_cents?: number | null
  hotel_amount_cents?: number | null
  transfer_amount_cents?: number | null
  total_amount_cents?: number | null
  paid_at?: string | null
  created_at?: string | null
  hotel_partner_id?: string | null
  transfer_partner_id?: string | null
  hub_package_id?: string | null
  hotel?: { name?: string | null; type?: string | null } | null
  transfer?: { name?: string | null; type?: string | null } | null
  hub_packages?: {
    name?: string | null
    package_key?: string | null
    destination_id?: string | null
  } | null
}

export type TransferLogLite = {
  id: string
  role: string | null
  amount_cents: number | null
  status: string | null
  created_at?: string | null
  error_message?: string | null
  partner_id?: string | null
  partners?: {
    name?: string | null
    type?: string | null
    country_code?: string | null
  } | null
}

export type BreakdownRow = {
  key: string
  label: string
  count: number
  pax: number
  revenue: number
  profit: number
}

export type PartnerPayoutRow = {
  partnerId: string
  name: string
  role: string
  type: string
  country: string
  amount: number
  succeeded: number
  failed: number
  pending: number
}

const HUB_LABELS: Record<string, string> = {
  ALG: 'Algarve',
  ALGARVE: 'Algarve',
  BCN: 'Barcelona',
  MAR: 'Marbella',
  MRB: 'Marbella',
}

const PACKAGE_LABELS: Record<string, string> = {
  weekend: 'Weekend',
  experience: 'Experience',
  premium: 'Premium',
}

const AGE_LABELS: Record<string, string> = {
  U18: '< 18',
  '18-25': '18–25',
  '26-35': '26–35',
  '36-45': '36–45',
  '46-55': '46–55',
  '55+': '55+',
}

const GENDER_LABELS: Record<string, string> = {
  MALE: 'Masculino',
  FEMALE: 'Feminino',
  MIXED: 'Misto',
  OTHER: 'Outro',
}

const COUNTRY_LABELS: Record<string, string> = {
  PT: 'Portugal',
  ES: 'Espanha',
  FR: 'França',
  GB: 'Reino Unido',
  UK: 'Reino Unido',
  DE: 'Alemanha',
  IT: 'Itália',
  BE: 'Bélgica',
  CH: 'Suíça',
  NL: 'Países Baixos',
  IE: 'Irlanda',
  US: 'EUA',
  BR: 'Brasil',
}

export function hubLabel(code?: string | null, name?: string | null) {
  if (code && HUB_LABELS[code.toUpperCase()]) return HUB_LABELS[code.toUpperCase()]
  return name || code || 'Sem hub'
}

export function periodRange(
  mode: PeriodMode,
  year: number,
  monthIndex: number
): { startIso: string; endIso: string; label: string } | null {
  if (mode === 'all') return null
  if (mode === 'month') {
    const { startIso, endIso } = monthBounds(year, monthIndex)
    const label = new Date(year, monthIndex, 1).toLocaleDateString('pt-PT', {
      month: 'long',
      year: 'numeric',
    })
    return { startIso, endIso, label }
  }
  if (mode === 'quarter') {
    const q = Math.floor(monthIndex / 3)
    const start = new Date(year, q * 3, 1)
    const end = new Date(year, q * 3 + 3, 0)
    const toIso = (d: Date) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    return {
      startIso: toIso(start),
      endIso: toIso(end),
      label: `T${q + 1} ${year}`,
    }
  }
  return {
    startIso: `${year}-01-01`,
    endIso: `${year}-12-31`,
    label: String(year),
  }
}

export function eventsInPeriod(
  events: StageEventLite[],
  mode: PeriodMode,
  year: number,
  monthIndex: number
): StageEventLite[] {
  if (mode === 'month') return eventsInMonth(events, year, monthIndex)
  const range = periodRange(mode, year, monthIndex)
  if (!range) return [...events]
  return events.filter((e) => {
    const s = e.start_date || ''
    const en = e.end_date || s
    if (!s) return false
    return s <= range.endIso && en >= range.startIso
  })
}

function bump(
  map: Map<string, BreakdownRow>,
  key: string,
  label: string,
  pax: number,
  revenue: number,
  profit: number
) {
  const prev = map.get(key) || {
    key,
    label,
    count: 0,
    pax: 0,
    revenue: 0,
    profit: 0,
  }
  prev.count += 1
  prev.pax += pax
  prev.revenue += revenue
  prev.profit += profit
  map.set(key, prev)
}

function sortRows(rows: BreakdownRow[]): BreakdownRow[] {
  return [...rows].sort(
    (a, b) => b.revenue - a.revenue || b.pax - a.pax || b.count - a.count
  )
}

export function buildEventBreakdowns(
  events: StageEventLite[],
  bookings: BookingLite[]
) {
  const byHub = new Map<string, BreakdownRow>()
  const bySport = new Map<string, BreakdownRow>()
  const byPackage = new Map<string, BreakdownRow>()
  const byStatus = new Map<string, BreakdownRow>()
  const byManager = new Map<string, BreakdownRow>()
  const byMonth = new Map<string, BreakdownRow>()

  for (const e of events) {
    const m = computeStageMetrics(e, bookings)
    const hubCode = e.destinations?.code || ''
    bump(
      byHub,
      hubCode || 'NA',
      hubLabel(hubCode, e.destinations?.name),
      m.bookedPax,
      m.plannedRevenue,
      m.plannedProfit
    )
    const sport = e.sports?.name || 'Sem desporto'
    bump(bySport, sport, sport, m.bookedPax, m.plannedRevenue, m.plannedProfit)
    const pkgKey = e.hub_packages?.package_key || 'custom'
    bump(
      byPackage,
      pkgKey,
      PACKAGE_LABELS[pkgKey] || e.hub_packages?.name || 'Edição custom',
      m.bookedPax,
      m.plannedRevenue,
      m.plannedProfit
    )
    const st = (e.status || 'N/D').toUpperCase()
    bump(byStatus, st, st, m.bookedPax, m.plannedRevenue, m.plannedProfit)
    const mgr =
      e.assigned_manager === 'FILHO'
        ? 'Comercial ES'
        : e.assigned_manager === 'PAI'
          ? 'Operações ALG'
          : e.assigned_manager || 'N/D'
    bump(byManager, mgr, mgr, m.bookedPax, m.plannedRevenue, m.plannedProfit)
    if (e.start_date) {
      const ym = e.start_date.slice(0, 7)
      const [y, mo] = ym.split('-').map(Number)
      const label = new Date(y, mo - 1, 1).toLocaleDateString('pt-PT', {
        month: 'short',
        year: 'numeric',
      })
      bump(byMonth, ym, label, m.bookedPax, m.plannedRevenue, m.plannedProfit)
    }
  }

  return {
    byHub: sortRows([...byHub.values()]),
    bySport: sortRows([...bySport.values()]),
    byPackage: sortRows([...byPackage.values()]),
    byStatus: sortRows([...byStatus.values()]),
    byManager: sortRows([...byManager.values()]),
    byMonth: sortRows([...byMonth.values()]).sort((a, b) =>
      a.key.localeCompare(b.key)
    ),
  }
}

export function buildBookingBreakdowns(
  events: StageEventLite[],
  bookings: BookingLite[]
) {
  const eventIds = new Set(events.map((e) => e.id))
  const related = bookings.filter((b) => eventIds.has(b.event_id))
  const paid = related.filter((b) =>
    ['PAID', 'CONFIRMADO', 'CONFIRMED'].includes(
      String(b.status || '').toUpperCase()
    )
  )

  const byCountry = new Map<string, BreakdownRow>()
  const byAge = new Map<string, BreakdownRow>()
  const byGender = new Map<string, BreakdownRow>()
  const byPayType = new Map<string, BreakdownRow>()

  let demoCoverage = 0

  for (const b of paid) {
    const pax = Number(b.participants || 0)
    const rev = Number(b.amount || 0)
    const country = (b.customer_country || '').toUpperCase() || 'ND'
    bump(
      byCountry,
      country,
      COUNTRY_LABELS[country] || (country === 'ND' ? 'Sem país' : country),
      pax,
      rev,
      0
    )

    const age = b.age_band || 'ND'
    bump(
      byAge,
      age,
      AGE_LABELS[age] || (age === 'ND' ? 'Sem idade' : age),
      pax,
      rev,
      0
    )

    const gender = (b.gender_mix || 'ND').toUpperCase()
    bump(
      byGender,
      gender,
      GENDER_LABELS[gender] || (gender === 'ND' ? 'Sem género' : gender),
      pax,
      rev,
      0
    )

    const pay = (b.payment_type || 'N/D').toUpperCase()
    bump(
      byPayType,
      pay,
      pay === 'DEPOSIT' ? 'Depósito' : pay === 'FULL' ? 'Completo' : pay,
      pax,
      rev,
      0
    )

    if (b.customer_country || b.age_band || b.gender_mix) demoCoverage += 1
  }

  return {
    byCountry: sortRows([...byCountry.values()]),
    byAge: sortRows([...byAge.values()]),
    byGender: sortRows([...byGender.values()]),
    byPayType: sortRows([...byPayType.values()]),
    paidBookings: paid.length,
    demoCoverage,
    demoPct: paid.length > 0 ? (demoCoverage / paid.length) * 100 : 0,
  }
}

export function buildPartnerPayouts(
  transfers: TransferLogLite[],
  packageBookings: PackageBookingLite[]
): {
  rows: PartnerPayoutRow[]
  totals: {
    hotel: number
    transfer: number
    platform: number
    gross: number
    succeeded: number
    failed: number
  }
} {
  const map = new Map<string, PartnerPayoutRow>()

  for (const t of transfers) {
    const partnerId = t.partner_id || 'unknown'
    const key = `${partnerId}:${t.role || 'other'}`
    const prev = map.get(key) || {
      partnerId,
      name: t.partners?.name || 'Parceiro',
      role: t.role || 'other',
      type: t.partners?.type || '—',
      country: t.partners?.country_code || '—',
      amount: 0,
      succeeded: 0,
      failed: 0,
      pending: 0,
    }
    const cents = Number(t.amount_cents || 0) / 100
    const st = (t.status || '').toLowerCase()
    if (st === 'succeeded') {
      prev.amount += cents
      prev.succeeded += 1
    } else if (st === 'failed') {
      prev.failed += 1
    } else {
      prev.pending += 1
    }
    map.set(key, prev)
  }

  let hotel = 0
  let transfer = 0
  let platform = 0
  let gross = 0
  for (const b of packageBookings) {
    const st = (b.status || '').toLowerCase()
    if (st !== 'paid' && st !== 'partial_transfer') continue
    hotel += Number(b.hotel_amount_cents || 0) / 100
    transfer += Number(b.transfer_amount_cents || 0) / 100
    platform += Number(b.padel_service_amount_cents || 0) / 100
    gross += Number(b.total_amount_cents || 0) / 100
  }

  const rows = [...map.values()].sort((a, b) => b.amount - a.amount)
  return {
    rows,
    totals: {
      hotel,
      transfer,
      platform,
      gross,
      succeeded: rows.reduce((a, r) => a + r.succeeded, 0),
      failed: rows.reduce((a, r) => a + r.failed, 0),
    },
  }
}

export function orderedStageRows(
  events: StageEventLite[],
  bookings: BookingLite[]
) {
  return [...events]
    .sort((a, b) =>
      String(a.start_date || '').localeCompare(String(b.start_date || ''))
    )
    .map((e) => ({
      event: e,
      metrics: computeStageMetrics(e, bookings),
    }))
}

export { formatEur, PACKAGE_LABELS, AGE_LABELS, GENDER_LABELS, COUNTRY_LABELS }
