'use client'

import { useMemo, useState } from 'react'
import {
  buildBookingBreakdowns,
  buildEventBreakdowns,
  buildPartnerPayouts,
  eventsInPeriod,
  formatEur,
  orderedStageRows,
  periodRange,
  type PackageBookingLite,
  type PeriodMode,
  type TransferLogLite,
} from '@/lib/sportsevents/stage-analytics'
import type { BookingLite, StageEventLite } from '@/lib/sportsevents/stage-metrics'
import { formatPct } from '@/lib/sportsevents/stage-metrics'

type Props = {
  events: StageEventLite[]
  bookings: BookingLite[]
  packageBookings?: PackageBookingLite[]
  transferLogs?: TransferLogLite[]
  year: number
  monthIndex: number
  managerFilter?: string
  onEditEvent?: (event: StageEventLite) => void
  onSelectEvent?: (eventId: string) => void
}

const PERIOD_OPTIONS: { id: PeriodMode; label: string }[] = [
  { id: 'month', label: 'Mês' },
  { id: 'quarter', label: 'Trimestre' },
  { id: 'year', label: 'Ano' },
  { id: 'all', label: 'Tudo' },
]

export function StagesInsights({
  events,
  bookings,
  packageBookings = [],
  transferLogs = [],
  year,
  monthIndex,
  managerFilter = 'ALL',
  onEditEvent,
  onSelectEvent,
}: Props) {
  const [period, setPeriod] = useState<PeriodMode>('month')

  const scopedEvents = useMemo(() => {
    const base =
      managerFilter === 'ALL'
        ? events
        : events.filter((e) => e.assigned_manager === managerFilter)
    return eventsInPeriod(base, period, year, monthIndex)
  }, [events, managerFilter, period, year, monthIndex])

  const range = periodRange(period, year, monthIndex)
  const rows = useMemo(
    () => orderedStageRows(scopedEvents, bookings),
    [scopedEvents, bookings]
  )
  const eventBreak = useMemo(
    () => buildEventBreakdowns(scopedEvents, bookings),
    [scopedEvents, bookings]
  )
  const bookingBreak = useMemo(
    () => buildBookingBreakdowns(scopedEvents, bookings),
    [scopedEvents, bookings]
  )

  const pkgInPeriod = useMemo(() => {
    if (!range) return packageBookings
    return packageBookings.filter((b) => {
      const d = (b.paid_at || b.created_at || '').slice(0, 10)
      if (!d) return true
      return d >= range.startIso && d <= range.endIso
    })
  }, [packageBookings, range])

  const transferInPeriod = useMemo(() => {
    if (!range) return transferLogs
    return transferLogs.filter((t) => {
      const d = (t.created_at || '').slice(0, 10)
      if (!d) return true
      return d >= range.startIso && d <= range.endIso
    })
  }, [transferLogs, range])

  const payouts = useMemo(
    () => buildPartnerPayouts(transferInPeriod, pkgInPeriod),
    [transferInPeriod, pkgInPeriod]
  )

  const totals = useMemo(() => {
    return rows.reduce(
      (acc, r) => {
        acc.revenue += r.metrics.plannedRevenue
        acc.cost += r.metrics.totalCost
        acc.profit += r.metrics.plannedProfit
        acc.booked += r.metrics.bookedPax
        acc.capacity += r.metrics.maxPax
        acc.collected += r.metrics.bookedAmount
        return acc
      },
      { revenue: 0, cost: 0, profit: 0, booked: 0, capacity: 0, collected: 0 }
    )
  }, [rows])

  return (
    <div className="space-y-5">
      {/* truncated for test - WRONG */}
    </div>
  )
}
