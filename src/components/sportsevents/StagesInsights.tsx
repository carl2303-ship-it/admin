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
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-white">
            Lista & métricas detalhadas
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Estágios por data de início
            {range ? ` · ${range.label}` : ' · todos os períodos'}
          </p>
        </div>
        <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
          {PERIOD_OPTIONS.map((o) => (
            <button
              key={o.id}
              type="button"
              onClick={() => setPeriod(o.id)}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all ${
                period === o.id
                  ? 'bg-slate-800 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-2">
        <MiniKpi label="Estágios" value={String(rows.length)} />
        <MiniKpi
          label="Ocupação"
          value={`${totals.booked}/${totals.capacity}`}
          hint={formatPct(
            totals.capacity > 0 ? (totals.booked / totals.capacity) * 100 : 0
          )}
        />
        <MiniKpi label="Receita planeada" value={formatEur(totals.revenue)} />
        <MiniKpi label="Custo" value={formatEur(totals.cost)} />
        <MiniKpi
          label="Lucro"
          value={formatEur(totals.profit)}
          tone={totals.profit >= 0 ? 'text-emerald-400' : 'text-rose-400'}
        />
        <MiniKpi
          label="Cobrado"
          value={formatEur(totals.collected)}
          tone="text-cyan-400"
        />
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-800 flex justify-between items-center">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Estágios por data de início
          </h4>
          <span className="text-[10px] text-slate-500">{rows.length} registos</span>
        </div>
        {rows.length === 0 ? (
          <p className="p-6 text-xs text-slate-500 text-center">
            Sem estágios neste período.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[720px]">
              <thead className="bg-slate-950 text-slate-500 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="p-3 font-semibold">Início</th>
                  <th className="p-3 font-semibold">Estágio</th>
                  <th className="p-3 font-semibold">Hub</th>
                  <th className="p-3 font-semibold">Desporto</th>
                  <th className="p-3 font-semibold">Tipo</th>
                  <th className="p-3 font-semibold">Clientes</th>
                  <th className="p-3 font-semibold">Receita</th>
                  <th className="p-3 font-semibold">Custo</th>
                  <th className="p-3 font-semibold">Lucro</th>
                  <th className="p-3 font-semibold">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {rows.map(({ event: e, metrics: m }) => (
                  <tr
                    key={e.id}
                    className="hover:bg-slate-800/40 cursor-pointer"
                    onClick={() => onSelectEvent?.(e.id)}
                  >
                    <td className="p-3 text-slate-300 whitespace-nowrap">
                      {e.start_date}
                      <div className="text-[10px] text-slate-600">
                        → {e.end_date}
                      </div>
                    </td>
                    <td className="p-3">
                      <button
                        type="button"
                        className="font-bold text-white text-left hover:text-cyan-300"
                        onClick={(ev) => {
                          ev.stopPropagation()
                          onEditEvent?.(e)
                        }}
                      >
                        {e.title}
                      </button>
                    </td>
                    <td className="p-3 text-slate-300">
                      {e.destinations?.name || '—'}
                    </td>
                    <td className="p-3 text-slate-400">
                      {e.sports?.name || '—'}
                    </td>
                    <td className="p-3 text-slate-400">
                      {e.hub_packages?.package_key || 'custom'}
                    </td>
                    <td className="p-3 tabular-nums text-slate-200">
                      {m.bookedPax}/{m.maxPax}
                      <span className="text-slate-500">
                        {' '}
                        ({formatPct(m.occupancyPct)})
                      </span>
                    </td>
                    <td className="p-3 tabular-nums text-slate-200">
                      {formatEur(m.plannedRevenue)}
                    </td>
                    <td className="p-3 tabular-nums text-slate-400">
                      {formatEur(m.totalCost)}
                    </td>
                    <td
                      className={`p-3 tabular-nums font-bold ${
                        m.plannedProfit >= 0
                          ? 'text-emerald-400'
                          : 'text-rose-400'
                      }`}
                    >
                      {formatEur(m.plannedProfit)}
                    </td>
                    <td className="p-3">
                      <span className="text-[10px] uppercase font-bold text-slate-500">
                        {e.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <BreakdownCard title="Por hub" rows={eventBreak.byHub} />
        <BreakdownCard title="Por desporto" rows={eventBreak.bySport} />
        <BreakdownCard title="Por tipo de pacote" rows={eventBreak.byPackage} />
        <BreakdownCard title="Por estado operacional" rows={eventBreak.byStatus} />
        <BreakdownCard title="Por gestor" rows={eventBreak.byManager} />
        <BreakdownCard title="Por mês de início" rows={eventBreak.byMonth} />
        <BreakdownCard
          title="Por país (clientes)"
          rows={bookingBreak.byCountry}
          emptyHint="Sem reservas com país — o checkout passa a pedir país."
        />
        <BreakdownCard
          title="Por faixa etária"
          rows={bookingBreak.byAge}
          emptyHint="Sem dados de idade nas reservas ainda."
        />
        <BreakdownCard
          title="Por género do grupo"
          rows={bookingBreak.byGender}
          emptyHint="Sem dados de género nas reservas ainda."
        />
        <BreakdownCard title="Por tipo de pagamento" rows={bookingBreak.byPayType} />
      </div>

      {bookingBreak.paidBookings > 0 && (
        <p className="text-[11px] text-slate-500">
          Cobertura demográfica nas reservas pagas:{' '}
          <span className="text-cyan-400 font-semibold">
            {bookingBreak.demoCoverage}/{bookingBreak.paidBookings} (
            {formatPct(bookingBreak.demoPct)})
          </span>
        </p>
      )}

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-800">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Pagamentos a parceiros (Stripe Connect)
          </h4>
          <p className="text-[11px] text-slate-500 mt-1">
            Splits de pacotes: hotel, transfer e plataforma · transfers
            individuais
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 p-4 border-b border-slate-800">
          <MiniKpi label="Bruto pacotes" value={formatEur(payouts.totals.gross)} />
          <MiniKpi
            label="Hotéis"
            value={formatEur(payouts.totals.hotel)}
            tone="text-amber-300"
          />
          <MiniKpi
            label="Transfers"
            value={formatEur(payouts.totals.transfer)}
            tone="text-violet-300"
          />
          <MiniKpi
            label="Plataforma"
            value={formatEur(payouts.totals.platform)}
            tone="text-cyan-300"
          />
        </div>

        {payouts.rows.length === 0 ? (
          <p className="p-6 text-xs text-slate-500 text-center">
            Ainda sem transfers Connect neste período. Quando houver checkouts
            de pacotes com split, aparecem aqui por parceiro.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[640px]">
              <thead className="bg-slate-950 text-slate-500 uppercase text-[10px]">
                <tr>
                  <th className="p-3">Parceiro</th>
                  <th className="p-3">Papel</th>
                  <th className="p-3">Tipo</th>
                  <th className="p-3">País</th>
                  <th className="p-3">Pago</th>
                  <th className="p-3">OK</th>
                  <th className="p-3">Falhou</th>
                  <th className="p-3">Pendente</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {payouts.rows.map((r) => (
                  <tr key={`${r.partnerId}-${r.role}`}>
                    <td className="p-3 font-semibold text-white">{r.name}</td>
                    <td className="p-3 text-slate-400 uppercase text-[10px]">
                      {r.role}
                    </td>
                    <td className="p-3 text-slate-400">{r.type}</td>
                    <td className="p-3 text-slate-400">{r.country}</td>
                    <td className="p-3 font-bold text-emerald-400 tabular-nums">
                      {formatEur(r.amount)}
                    </td>
                    <td className="p-3 text-slate-300">{r.succeeded}</td>
                    <td className="p-3 text-rose-400">{r.failed}</td>
                    <td className="p-3 text-amber-400">{r.pending}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

function MiniKpi({
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
    <div className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5">
      <div className="text-[9px] font-bold uppercase tracking-wider text-slate-500">
        {label}
      </div>
      <div className={`text-sm font-black mt-0.5 tabular-nums ${tone}`}>{value}</div>
      {hint && <div className="text-[10px] text-slate-500">{hint}</div>}
    </div>
  )
}

function BreakdownCard({
  title,
  rows,
  emptyHint,
}: {
  title: string
  rows: {
    key: string
    label: string
    count: number
    pax: number
    revenue: number
  }[]
  emptyHint?: string
}) {
  const max = Math.max(1, ...rows.map((r) => r.revenue || r.pax || r.count))
  const meaningful = rows.filter((r) => r.key !== 'ND' || rows.length === 1)

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
      <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-3">
        {title}
      </h4>
      {meaningful.length === 0 ||
      (meaningful.every((r) => r.key === 'ND') && emptyHint) ? (
        <p className="text-[11px] text-slate-600 leading-relaxed">
          {emptyHint || 'Sem dados.'}
        </p>
      ) : (
        <div className="space-y-2.5">
          {meaningful.slice(0, 8).map((r) => {
            const bar = ((r.revenue || r.pax || r.count) / max) * 100
            return (
              <div key={r.key}>
                <div className="flex justify-between gap-2 text-[11px] mb-1">
                  <span className="text-slate-300 font-semibold truncate">
                    {r.label}
                  </span>
                  <span className="text-slate-500 tabular-nums shrink-0">
                    {r.count} · {r.pax} pax · {formatEur(r.revenue)}
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-slate-950 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-cyan-500/70"
                    style={{ width: `${Math.max(4, bar)}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
