import type { KpiResult } from '@/lib/products/kpis'
import { cn } from '@/lib/utils'

const productTint: Record<KpiResult['product'], string> = {
  boost: 'border-cyan-500/25 bg-slate-950',
  padel1: 'border-amber-500/25 bg-slate-950',
  sportsevents: 'border-cyan-500/40 bg-slate-950',
}

const statusLabel: Record<KpiResult['status'], string> = {
  ok: 'OK',
  degraded: 'Degradado',
  missing_config: 'Sem config',
}

export function KpiCard({ kpi }: { kpi: KpiResult }) {
  return (
    <div
      className={cn(
        'rounded-2xl border p-5 transition hover:border-cyan-500/50',
        productTint[kpi.product]
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          {kpi.label}
        </p>
        <span
          className={cn(
            'rounded-md px-2 py-0.5 text-[10px] font-bold uppercase',
            kpi.status === 'ok' &&
              'border border-cyan-500/30 bg-cyan-500/15 text-cyan-300',
            kpi.status === 'degraded' &&
              'border border-amber-500/30 bg-amber-500/15 text-amber-300',
            kpi.status === 'missing_config' &&
              'border border-slate-700 bg-slate-900 text-slate-400'
          )}
        >
          {statusLabel[kpi.status]}
        </span>
      </div>
      <p className="mt-3 font-[family-name:var(--font-display)] text-3xl font-bold text-white">
        {kpi.value === null ? '—' : kpi.value.toLocaleString('pt-PT')}
      </p>
      {(kpi.hint || kpi.error) && (
        <p className="mt-2 text-xs leading-relaxed text-slate-500">
          {kpi.hint || kpi.error}
        </p>
      )}
    </div>
  )
}
