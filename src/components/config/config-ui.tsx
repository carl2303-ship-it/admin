import Link from 'next/link'
import { StatusPill, Panel } from '@/components/boost/ui'
import type { OwnerHealthItem } from '@/lib/config/owner-health'
import { cn } from '@/lib/utils'

export function ConfigSectionNav({
  active,
}: {
  active: 'overview' | 'boost' | 'padel1' | 'sportsevents'
}) {
  const tabs: { id: typeof active; href: string; label: string }[] = [
    { id: 'overview', href: '/configuracao', label: 'Visão geral' },
    { id: 'boost', href: '/configuracao/boost', label: 'Loja' },
    { id: 'padel1', href: '/configuracao/padel1', label: 'Padel1' },
    { id: 'sportsevents', href: '/configuracao/sportsevents', label: 'SportsEvents' },
  ]

  return (
    <nav className="hub-scroll-x pb-px">
      {tabs.map((tab) => (
        <Link
          key={tab.id}
          href={tab.href}
          className={cn(
            'inline-flex min-h-11 shrink-0 items-center border-b-2 px-3 text-sm font-semibold transition',
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

export function OwnerHealthCard({ item }: { item: OwnerHealthItem }) {
  return (
    <Link
      href={item.href}
      className="block rounded-2xl border border-slate-800 bg-slate-950 p-5 transition hover:border-cyan-500/40"
    >
      <div className="flex items-start justify-between gap-3">
        <h2 className="font-[family-name:var(--font-display)] text-xl font-bold text-white">
          {item.label}
        </h2>
        <StatusPill
          active={item.ok}
          activeLabel="OK"
          inactiveLabel="Problema"
        />
      </div>
      <p className="mt-3 text-sm text-slate-400">{item.message}</p>
      <p className="mt-3 text-xs font-semibold text-cyan-400">
        {item.ok ? 'Ver Stripe →' : 'Corrigir / Stripe →'}
      </p>
    </Link>
  )
}

/** Lista simples Ligado / Em falta — só para itens que o dono pode mudar (Stripe). */
export function SimpleStatusRow({
  label,
  ok,
  detail,
}: {
  label: string
  ok: boolean
  detail?: string
}) {
  return (
    <div className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-white">{label}</p>
        {detail ? <p className="text-xs text-slate-500">{detail}</p> : null}
      </div>
      <StatusPill
        active={ok}
        activeLabel="OK"
        inactiveLabel="Em falta"
      />
    </div>
  )
}

export function SimpleStatusPanel({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <Panel>
      <div className="border-b border-slate-800 px-4 py-3 font-bold text-white">
        {title}
      </div>
      <div className="divide-y divide-slate-800">{children}</div>
    </Panel>
  )
}
