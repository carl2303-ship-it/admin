import Link from 'next/link'
import type { OpsSection } from '@/lib/products/ops-feed'
import { cn } from '@/lib/utils'

const productTint = {
  boost: 'border-cyan-500/25',
  padel1: 'border-amber-500/30',
  sportsevents: 'border-cyan-500/40',
} as const

export function OpsSectionCard({ section }: { section: OpsSection }) {
  return (
    <section
      className={cn(
        'rounded-2xl border bg-slate-950 p-4',
        productTint[section.product]
      )}
    >
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h3 className="text-sm font-bold text-white">{section.label}</h3>
          <p className="text-[11px] uppercase tracking-wider text-slate-500">
            {section.product}
            {section.count !== null ? ` · ${section.count}` : ''}
          </p>
        </div>
        <Link
          href={section.href}
          className="text-xs font-semibold text-cyan-400 hover:underline"
        >
          Abrir módulo →
        </Link>
      </div>

      {section.status === 'missing_config' && (
        <p className="text-sm text-slate-500">{section.error}</p>
      )}
      {section.status === 'degraded' && (
        <p className="text-sm text-amber-300/90">{section.error}</p>
      )}
      {section.status === 'ok' && section.items.length === 0 && (
        <p className="text-sm text-slate-500">Nada pendente.</p>
      )}

      {section.items.length > 0 && (
        <ul className="divide-y divide-slate-800">
          {section.items.map((item) => (
            <li key={item.id}>
              <Link
                href={item.href}
                className="flex items-start justify-between gap-3 py-2.5 transition hover:bg-slate-900/80"
              >
                <div className="min-w-0">
                  <p
                    className={cn(
                      'truncate text-sm font-semibold',
                      item.tone === 'hot' && 'text-amber-300',
                      item.tone === 'warn' && 'text-amber-200',
                      (!item.tone || item.tone === 'default') && 'text-slate-100'
                    )}
                  >
                    {item.title}
                  </p>
                  {item.subtitle ? (
                    <p className="truncate text-xs text-slate-500">
                      {item.subtitle}
                    </p>
                  ) : null}
                </div>
                {item.meta ? (
                  <span className="shrink-0 text-[10px] text-slate-600">
                    {item.meta}
                  </span>
                ) : null}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
