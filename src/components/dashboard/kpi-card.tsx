import type { KpiResult } from '@/lib/products/kpis'
import { cn } from '@/lib/utils'

const productTint: Record<KpiResult['product'], string> = {
  boost: 'border-sky-200 bg-sky-50',
  padel1: 'border-violet-200 bg-violet-50',
  sportsevents: 'border-amber-200 bg-amber-50',
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
        'rounded-2xl border p-5 transition-shadow hover:shadow-md',
        productTint[kpi.product]
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
          {kpi.label}
        </p>
        <span
          className={cn(
            'rounded-md px-2 py-0.5 text-[10px] font-bold uppercase',
            kpi.status === 'ok' && 'bg-emerald-100 text-emerald-700',
            kpi.status === 'degraded' && 'bg-amber-100 text-amber-800',
            kpi.status === 'missing_config' && 'bg-zinc-200 text-zinc-600'
          )}
        >
          {statusLabel[kpi.status]}
        </span>
      </div>
      <p className="mt-3 font-[family-name:var(--font-display)] text-3xl font-bold text-zinc-900">
        {kpi.value === null ? '—' : kpi.value.toLocaleString('pt-PT')}
      </p>
      {(kpi.hint || kpi.error) && (
        <p className="mt-2 text-xs leading-relaxed text-zinc-500">
          {kpi.hint || kpi.error}
        </p>
      )}
    </div>
  )
}
