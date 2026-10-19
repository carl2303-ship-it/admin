import Link from 'next/link'
import { StatusPill, Panel } from '@/components/boost/ui'
import type { IntegrationStatus, ProductConfigStatus } from '@/lib/config/status'
import { cn } from '@/lib/utils'

export function ConfigSectionNav({
  active,
}: {
  active: 'overview' | 'boost' | 'padel1' | 'sportsevents' | 'hub'
}) {
  const tabs: { id: typeof active; href: string; label: string }[] = [
    { id: 'overview', href: '/configuracao', label: 'Visão geral' },
    { id: 'boost', href: '/configuracao/boost', label: 'Boost' },
    { id: 'padel1', href: '/configuracao/padel1', label: 'Padel1' },
    { id: 'sportsevents', href: '/configuracao/sportsevents', label: 'SportsEvents' },
    { id: 'hub', href: '/configuracao/hub', label: 'Hub' },
  ]

  return (
    <nav className="flex gap-1 overflow-x-auto pb-px">
      {tabs.map((tab) => (
        <Link
          key={tab.id}
          href={tab.href}
          className={cn(
            'shrink-0 border-b-2 px-3 py-3 text-sm font-semibold transition',
            active === tab.id
              ? 'border-cyan-400 text-cyan-400'
              : 'border-transparent text-slate-500 hover:text-amber-400'
          )}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  )
}

export function ProductStatusCard({
  status,
  href,
}: {
  status: ProductConfigStatus
  href: string
}) {
  return (
    <Link
      href={href}
      className="block rounded-2xl border border-slate-800 bg-slate-950 p-5 transition hover:border-cyan-500/40"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-cyan-400">
            {status.product}
          </p>
          <h2 className="mt-1 font-[family-name:var(--font-display)] text-xl font-bold text-white">
            {status.label}
          </h2>
        </div>
        <StatusPill
          active={status.connectedCount === status.totalCount}
          activeLabel={`${status.connectedCount}/${status.totalCount}`}
          inactiveLabel={`${status.connectedCount}/${status.totalCount}`}
        />
      </div>
      <ul className="mt-4 space-y-2">
        {status.integrations.slice(0, 4).map((i) => (
          <li
            key={i.id}
            className="flex items-center justify-between gap-2 text-xs text-slate-400"
          >
            <span className="truncate">{i.label}</span>
            <StatusPill
              active={i.connected}
              activeLabel="Ligado"
              inactiveLabel="Em falta"
            />
          </li>
        ))}
      </ul>
    </Link>
  )
}

export function IntegrationTable({ items }: { items: IntegrationStatus[] }) {
  return (
    <Panel>
      <div className="border-b border-slate-800 px-4 py-3 font-bold text-white">
        Integrações (só presença — valores mascarados)
      </div>
      <div className="divide-y divide-slate-800">
        {items.map((i) => (
          <div
            key={i.id}
            className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white">{i.label}</p>
              <p className="truncate text-xs text-slate-500">{i.detail}</p>
              {i.publicUrl && (
                <a
                  href={i.publicUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-1 inline-block text-xs font-semibold text-cyan-400 hover:underline"
                >
                  Abrir
                </a>
              )}
              {!i.connected && (
                <p className="mt-1 text-[11px] text-amber-400">{i.fixHint}</p>
              )}
            </div>
            <StatusPill
              active={i.connected}
              activeLabel="Ligado"
              inactiveLabel="Em falta"
            />
          </div>
        ))}
      </div>
    </Panel>
  )
}
