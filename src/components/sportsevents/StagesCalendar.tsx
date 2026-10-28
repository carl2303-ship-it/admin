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
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-white font-[family-name:var(--font-display)] tracking-tight">
            Calendário de Estágios
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Ocupação, vagas e rentabilidade por edição datada
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => shiftMonth(-1)}
            className="p-2 rounded-lg border border-slate-700 bg-slate-950 text-slate-300 hover:border-cyan-500/40 hover:text-cyan-300"
            aria-label="Mês anterior"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="min-w-[10rem] text-center text-sm font-semibold text-white capitalize">
            {monthLabel}
          </span>
          <button
            type="button"
            onClick={() => shiftMonth(1)}
            className="p-2 rounded-lg border border-slate-700 bg-slate-950 text-slate-300 hover:border-cyan-500/40 hover:text-cyan-300"
            aria-label="Mês seguinte"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() =>
              setCursor({ year: today.getFullYear(), month: today.getMonth() })
            }
            className="ml-1 px-3 py-2 rounded-lg border border-slate-700 bg-slate-950 text-[11px] font-semibold text-slate-300 hover:text-white"
          >
            Hoje
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-2">
        <MetricChip label="Estágios" value={String(monthAgg.stages)} />
        <MetricChip
          label="Clientes / Vagas"
          value={`${monthAgg.bookedPax} / ${monthAgg.capacity}`}
          hint={`${monthAgg.spotsLeft} livres`}
        />
        <MetricChip
          label="Ocupação"
          value={formatPct(monthAgg.occupancyPct)}
          tone={occupancyTone(monthAgg.occupancyPct)}
        />
        <MetricChip label="Preço médio" value={formatEur(monthAgg.avgPrice)} />
        <MetricChip label="Receita planeada" value={formatEur(monthAgg.plannedRevenue)} />
        <MetricChip label="Custo planeado" value={formatEur(monthAgg.plannedCost)} />
        <MetricChip
          label="Lucro planeado"
          value={formatEur(monthAgg.plannedProfit)}
          tone={monthAgg.plannedProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}
        />
        <MetricChip
          label="Cobrado (pago)"
          value={formatEur(monthAgg.bookedAmount)}
          tone="text-cyan-400"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-4">
        <div className="hub-table-wrap rounded-2xl border border-slate-800 bg-slate-900">
          <div className="min-w-[36rem]">
          <div className="grid grid-cols-7 border-b border-slate-800 bg-slate-950/80">
            {WEEKDAYS.map((d) => (
              <div
                key={d}
                className="px-2 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-500 text-center"
              >
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 auto-rows-[minmax(5.5rem,1fr)]">
            {cells.map((cell, idx) => {
              if (!cell.iso || !cell.date) {
                return (
                  <div
                    key={`empty-${idx}`}
                    className="border-b border-r border-slate-800/60 bg-slate-950/40 min-h-[5.5rem]"
                  />
                )
              }
              const dayEvents = filtered.filter((e) =>
                eventCoversDate(e, cell.iso!)
              )
              const isToday = cell.iso === todayIso
              return (
                <div
                  key={cell.iso}
                  className={`border-b border-r border-slate-800/60 p-1.5 min-h-[5.5rem] ${
                    isToday ? 'bg-cyan-500/5' : 'bg-slate-900/40'
                  }`}
                >
                  <div
                    className={`text-[11px] font-semibold mb-1 ${
                      isToday ? 'text-cyan-300' : 'text-slate-500'
                    }`}
                  >
                    {cell.date.getDate()}
                  </div>
                  <div className="space-y-1">
                    {dayEvents.slice(0, 3).map((e) => {
                      const m = computeStageMetrics(e, bookings)
                      const active = selectedId === e.id
                      return (
                        <button
                          key={`${cell.iso}-${e.id}`}
                          type="button"
                          onClick={() => setSelectedId(e.id)}
                          className={`w-full text-left rounded-md px-1.5 py-1 border transition-colors ${
                            active
                              ? 'border-cyan-400/60 bg-cyan-500/15'
                              : 'border-transparent bg-slate-950/80 hover:border-slate-600'
                          }`}
                        >
                          <div className="text-[10px] font-bold text-white truncate leading-tight">
                            {e.title}
                          </div>
                          <div className="text-[9px] text-slate-400 flex justify-between gap-1 mt-0.5">
                            <span>
                              {m.bookedPax}/{m.maxPax}
                            </span>
                            <span className={occupancyTone(m.occupancyPct)}>
                              {formatPct(m.occupancyPct)}
                            </span>
                          </div>
                        </button>
                      )
                    })}
                    {dayEvents.length > 3 && (
                      <div className="text-[9px] text-slate-500 px-1">
                        +{dayEvents.length - 3} mais
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
          </div>
        </div>

        <aside className="bg-slate-900 border border-slate-800 rounded-2xl p-4 h-fit xl:sticky xl:top-4">
          {!selected || !selectedMetrics ? (
            <div className="text-xs text-slate-500 py-8 text-center leading-relaxed">
              Seleciona um estágio no calendário para ver clientes, vagas, preço,
              custo e lucro.
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <div
                  className={`inline-flex text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${statusTone(selected.status)}`}
                >
                  {selected.status || '—'}
                </div>
                <h3 className="text-sm font-bold text-white mt-2 leading-snug">
                  {selected.title}
                </h3>
                <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                  <MapPin className="w-3 h-3 shrink-0" />
                  {selected.destinations?.name || 'Destino N/D'}
                  {selected.sports?.name ? ` · ${selected.sports.name}` : ''}
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  {selected.start_date} → {selected.end_date}
                </div>
              </div>

              <div className="rounded-xl bg-slate-950 border border-slate-800 p-3 space-y-2">
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  <Users className="w-3.5 h-3.5" /> Ocupação
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Clientes</span>
                  <span className="font-bold text-white">
                    {selectedMetrics.bookedPax}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Vagas</span>
                  <span className="font-bold text-white">
                    {selectedMetrics.maxPax}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Livres</span>
                  <span className="font-bold text-cyan-300">
                    {selectedMetrics.spotsLeft}
                  </span>
                </div>
                {selectedMetrics.pendingPax > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Pendentes</span>
                    <span className="font-bold text-amber-300">
                      {selectedMetrics.pendingPax}
                    </span>
                  </div>
                )}
                <div className="pt-1">
                  <div className="flex justify-between text-[10px] mb-1">
                    <span className="text-slate-500">Taxa de ocupação</span>
                    <span className={occupancyTone(selectedMetrics.occupancyPct)}>
                      {formatPct(selectedMetrics.occupancyPct)}
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-cyan-400 rounded-full transition-all"
                      style={{
                        width: `${Math.min(100, selectedMetrics.occupancyPct)}%`,
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="rounded-xl bg-slate-950 border border-slate-800 p-3 space-y-2">
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  <Wallet className="w-3.5 h-3.5" /> Financeiro
                </div>
                <DetailRow
                  label="Preço / pessoa"
                  value={formatEur(selectedMetrics.pricePerPerson)}
                />
                <DetailRow
                  label="Receita planeada"
                  value={formatEur(selectedMetrics.plannedRevenue)}
                />
                <DetailRow
                  label="Custo total"
                  value={formatEur(selectedMetrics.totalCost)}
                />
                <DetailRow
                  label="Lucro planeado"
                  value={formatEur(selectedMetrics.plannedProfit)}
                  tone={
                    selectedMetrics.plannedProfit >= 0
                      ? 'text-emerald-400'
                      : 'text-rose-400'
                  }
                  icon={<TrendingUp className="w-3 h-3" />}
                />
                <DetailRow
                  label="Margem"
                  value={formatPct(selectedMetrics.marginPct)}
                />
                <div className="border-t border-slate-800 pt-2 mt-1 space-y-2">
                  <DetailRow
                    label="Já cobrado (pago)"
                    value={formatEur(selectedMetrics.bookedAmount)}
                    tone="text-cyan-400"
                    icon={<CircleDollarSign className="w-3 h-3" />}
                  />
                  {selectedMetrics.pendingAmount > 0 && (
                    <DetailRow
                      label="Pendente checkout"
                      value={formatEur(selectedMetrics.pendingAmount)}
                      tone="text-amber-400"
                    />
                  )}
                  <DetailRow
                    label="Lucro estimado (ocupado)"
                    value={formatEur(selectedMetrics.bookedProfitEstimate)}
                    tone={
                      selectedMetrics.bookedProfitEstimate >= 0
                        ? 'text-emerald-400'
                        : 'text-rose-400'
                    }
                  />
                </div>
              </div>

              {onEditEvent && (
                <button
                  type="button"
                  onClick={() => onEditEvent(selected)}
                  className="w-full text-[11px] font-semibold rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-slate-300 hover:border-cyan-500/40 hover:text-cyan-400"
                >
                  Abrir ficha do estágio
                </button>
              )}
            </div>
          )}
        </aside>
      </div>

      <StagesInsights
        events={events}
        bookings={bookings}
        packageBookings={packageBookings}
        transferLogs={transferLogs}
        year={cursor.year}
        monthIndex={cursor.month}
        managerFilter={managerFilter}
        onEditEvent={onEditEvent}
        onSelectEvent={setSelectedId}
      />
    </div>
  )
}

function MetricChip({
  label,
  value,
  hint,
  tone = 'text-white',
}: {
  label: string
  value: string
  hint?: string
  tone?: string
}) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5">
      <div className="text-[9px] font-bold uppercase tracking-wider text-slate-500">
        {label}
      </div>
      <div className={`text-sm font-black mt-0.5 tabular-nums ${tone}`}>{value}</div>
      {hint && <div className="text-[10px] text-slate-500 mt-0.5">{hint}</div>}
    </div>
  )
}

function DetailRow({
  label,
  value,
  tone = 'text-white',
  icon,
}: {
  label: string
  value: string
  tone?: string
  icon?: React.ReactNode
}) {
  return (
    <div className="flex justify-between items-center text-sm gap-2">
      <span className="text-slate-400 text-[11px] flex items-center gap-1">
        {icon}
        {label}
      </span>
      <span className={`font-bold tabular-nums text-[12px] ${tone}`}>{value}</span>
    </div>
  )
}
