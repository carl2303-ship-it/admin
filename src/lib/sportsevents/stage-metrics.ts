export type BookingLite = {
  event_id: string
  participants: number | null
  amount: number | null
  status: string | null
  payment_type?: string | null
  customer_country?: string | null
  age_band?: string | null
  gender_mix?: string | null
}

export type StageEventLite = {
  id: string
  title?: string | null
  start_date?: string | null
  end_date?: string | null
  group_size?: number | null
  max_participants?: number | null
  total_revenue?: number | null
  total_cost?: number | null
  sale_price_per_person?: number | null
  deposit_amount?: number | null
  currency?: string | null
  status?: string | null
  published?: boolean | null
  assigned_manager?: string | null
  destinations?: {
    name?: string | null
    code?: string | null
    country?: string | null
  } | null
  sports?: { name?: string | null } | null
  hub_packages?: {
    name?: string | null
    package_key?: string | null
  } | null
}

export type StageMetrics = {
  eventId: string
  maxPax: number
  bookedPax: number
  pendingPax: number
  spotsLeft: number
  occupancyPct: number
  pricePerPerson: number
  plannedRevenue: number
  bookedAmount: number
  pendingAmount: number
  totalCost: number
  plannedProfit: number
  bookedProfitEstimate: number
  marginPct: number
  currency: string
}

const PAID = new Set(['PAID', 'CONFIRMADO', 'CONFIRMED'])
const PENDING = new Set(['PENDING', 'PENDENTE'])

export function eventCapacity(event: StageEventLite): number {
  return Math.max(1, Number(event.max_participants || event.group_size || 0) || 1)
}

export function eventProfit(event: StageEventLite): number {
  return Number(event.total_revenue || 0) - Number(event.total_cost || 0)
}

export function computeStageMetrics(
  event: StageEventLite,
  bookings: BookingLite[]
): StageMetrics {
  const related = bookings.filter((b) => b.event_id === event.id)
  const paid = related.filter((b) => PAID.has(String(b.status || '').toUpperCase()))
  const pending = related.filter((b) =>
    PENDING.has(String(b.status || '').toUpperCase())
  )

  const maxPax = eventCapacity(event)
  const bookedPax = paid.reduce((acc, b) => acc + Number(b.participants || 0), 0)
  const pendingPax = pending.reduce((acc, b) => acc + Number(b.participants || 0), 0)
  const spotsLeft = Math.max(0, maxPax - bookedPax)
  const occupancyPct = maxPax > 0 ? Math.min(100, (bookedPax / maxPax) * 100) : 0

  const pricePerPerson = Number(event.sale_price_per_person || 0)
  const plannedRevenue =
    Number(event.total_revenue || 0) || pricePerPerson * maxPax
  const totalCost = Number(event.total_cost || 0)
  const plannedProfit = plannedRevenue - totalCost
  const bookedAmount = paid.reduce((acc, b) => acc + Number(b.amount || 0), 0)
  const pendingAmount = pending.reduce((acc, b) => acc + Number(b.amount || 0), 0)

  const costPerPax = maxPax > 0 ? totalCost / maxPax : 0
  const bookedProfitEstimate = bookedPax * pricePerPerson - bookedPax * costPerPax
  const marginPct = plannedRevenue > 0 ? (plannedProfit / plannedRevenue) * 100 : 0

  return {
    eventId: event.id,
    maxPax,
    bookedPax,
    pendingPax,
    spotsLeft,
    occupancyPct,
    pricePerPerson,
    plannedRevenue,
    bookedAmount,
    pendingAmount,
    totalCost,
    plannedProfit,
    bookedProfitEstimate,
    marginPct,
    currency: event.currency || 'EUR',
  }
}

export function formatEur(value: number): string {
  return `${Number(value || 0).toLocaleString('pt-PT', {
    maximumFractionDigits: 0,
  })} €`
}

export function formatPct(value: number): string {
  return `${Number(value || 0).toLocaleString('pt-PT', {
    maximumFractionDigits: 0,
  })}%`
}

/** Estágio overlapa o dia (YYYY-MM-DD). */
export function eventCoversDate(event: StageEventLite, dateIso: string): boolean {
  const start = event.start_date || ''
  const end = event.end_date || start
  if (!start) return false
  return dateIso >= start && dateIso <= end
}

export function monthBounds(year: number, monthIndex: number) {
  const start = new Date(year, monthIndex, 1)
  const end = new Date(year, monthIndex + 1, 0)
  const toIso = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  return { startIso: toIso(start), endIso: toIso(end), daysInMonth: end.getDate() }
}

export function eventsInMonth(
  events: StageEventLite[],
  year: number,
  monthIndex: number
): StageEventLite[] {
  const { startIso, endIso } = monthBounds(year, monthIndex)
  return events.filter((e) => {
    const s = e.start_date || ''
    const en = e.end_date || s
    if (!s) return false
    return s <= endIso && en >= startIso
  })
}

export type MonthAggregate = {
  stages: number
  capacity: number
  bookedPax: number
  spotsLeft: number
  occupancyPct: number
  plannedRevenue: number
  plannedCost: number
  plannedProfit: number
  bookedAmount: number
  avgPrice: number
}

export function aggregateMonth(
  events: StageEventLite[],
  bookings: BookingLite[],
  year: number,
  monthIndex: number
): MonthAggregate {
  const monthEvents = eventsInMonth(events, year, monthIndex)
  const metrics = monthEvents.map((e) => computeStageMetrics(e, bookings))

  const capacity = metrics.reduce((a, m) => a + m.maxPax, 0)
  const bookedPax = metrics.reduce((a, m) => a + m.bookedPax, 0)
  const plannedRevenue = metrics.reduce((a, m) => a + m.plannedRevenue, 0)
  const plannedCost = metrics.reduce((a, m) => a + m.totalCost, 0)
  const bookedAmount = metrics.reduce((a, m) => a + m.bookedAmount, 0)
  const priceSum = monthEvents.reduce(
    (a, e) => a + Number(e.sale_price_per_person || 0),
    0
  )

  return {
    stages: monthEvents.length,
    capacity,
    bookedPax,
    spotsLeft: Math.max(0, capacity - bookedPax),
    occupancyPct: capacity > 0 ? (bookedPax / capacity) * 100 : 0,
    plannedRevenue,
    plannedCost,
    plannedProfit: plannedRevenue - plannedCost,
    bookedAmount,
    avgPrice: monthEvents.length > 0 ? priceSum / monthEvents.length : 0,
  }
}
