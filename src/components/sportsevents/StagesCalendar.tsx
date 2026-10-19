'use client'

import { useMemo, useState } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  MapPin,
  Users,
  Wallet,
  TrendingUp,
  CircleDollarSign,
} from 'lucide-react'
import {
  aggregateMonth,
  computeStageMetrics,
  eventCoversDate,
  formatEur,
  formatPct,
  type BookingLite,
  type StageEventLite,
  type StageMetrics,
} from '@/lib/sportsevents/stage-metrics'
import { StagesInsights } from '@/components/sportsevents/StagesInsights'
import type {
  PackageBookingLite,
  TransferLogLite,
} from '@/lib/sportsevents/stage-analytics'

const WEEKDAYS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']

function toIso(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function buildGrid(year: number, monthIndex: number) {
  const first = new Date(year, monthIndex, 1)
  // Monday-first: JS getDay() Sun=0 → shift
  const startPad = (first.getDay() + 6) % 7
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate()
  const cells: Array<{ date: Date | null; iso: string | null }> = []
  for (let i = 0; i < startPad; i++) cells.push({ date: null, iso: null })
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, monthIndex, day)
    cells.push({ date, iso: toIso(date) })
  }
  while (cells.length % 7 !== 0) cells.push({ date: null, iso: null })
  return cells
}

function statusTone(status?: string | null) {
  const s = (status || '').toUpperCase()
  if (s === 'CONFIRMADO' || s === 'CONFIRMED' || s === 'OPERACIONAL')
    return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
  if (s === 'PLANEAMENTO' || s === 'DRAFT')
    return 'bg-slate-700/60 text-slate-300 border-slate-600'
  if (s === 'CANCELADO') return 'bg-rose-500/20 text-rose-300 border-rose-500/30'
  return 'bg-cyan-500/15 text-cyan-300 border-cyan-500/25'
}

function occupancyTone(pct: number) {
  if (pct >= 90) return 'text-emerald-400'
  if (pct >= 50) return 'text-amber-400'
  return 'text-slate-400'
}

type Props = {
  events: StageEventLite[]
  bookings: BookingLite[]
  packageBookings?: PackageBookingLite[]
  transferLogs?: TransferLogLite[]
  managerFilter?: string
  onEditEvent?: (event: StageEventLite) => void
}

export function StagesCalendar({
  events,
  bookings,
  packageBookings = [],
  transferLogs = [],
  managerFilter = 'ALL',
  onEditEvent,
}: Props) {
  const today = new Date()
  const [cursor, setCursor] = useState({
    year: today.getFullYear(),
    month: today.getMonth(),
  })
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const filtered = useMemo(() => {
    if (managerFilter === 'ALL') return events
    return events.filter((e) => e.assigned_manager === managerFilter)
  }, [events, managerFilter])

  const cells = useMemo(
    () => buildGrid(cursor.year, cursor.month),
    [cursor.year, cursor.month]
  )

  const monthAgg = useMemo(
    () => aggregateMonth(filtered, bookings, cursor.year, cursor.month),
    [filtered, bookings, cursor.year, cursor.month]
  )

  const selected = filtered.find((e) => e.id === selectedId) || null
  const selectedMetrics: StageMetrics | null = selected
    ? computeStageMetrics(selected, bookings)
    : null

  const monthLabel = new Date(cursor.year, cursor.month, 1).toLocaleDateString(
    'pt-PT',
    { month: 'long', year: 'numeric' }
  )

  const todayIso = toIso(today)

  function shiftMonth(delta: number) {
    setCursor((prev) => {
      const d = new Date(prev.year, prev.month + delta, 1)
      return { year: d.getFullYear(), month: d.getMonth() }
    })
  }

  return (
    <div className="space-y-5">
      {/* content truncated in tool - use LOAD_FROM_BATCH0 */}
    </div>
  )
}
