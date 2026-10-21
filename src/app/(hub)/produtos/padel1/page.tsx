import Link from 'next/link'
import { redirect } from 'next/navigation'
import {
  requirePadel1Module,
  canWritePadel1,
  staffRole,
} from '@/lib/padel1/auth'
import { getDashboardKpis, padel1ModuleCounts } from '@/lib/padel1/queries'
import {
  ConfigBanner,
  ErrorBanner,
  Panel,
} from '@/components/padel1/ui'
import { Building2, Layers, Package, Users } from 'lucide-react'

const LINKS = [
  {
    href: '/produtos/padel1/clubes',
    label: 'Clubes',
    key: 'clubs' as const,
    icon: Building2,
  },
  {
    href: '/produtos/padel1/modulos',
    label: 'Módulos',
    key: 'modules' as const,
    icon: Layers,
  },
  {
    href: '/produtos/padel1/packs',
    label: 'Packs',
    key: 'packs' as const,
    icon: Package,
  },
  {
    href: '/produtos/padel1/utilizadores',
    label: 'Jogadores',
    key: 'players' as const,
    icon: Users,
  },
]

export default async function Padel1OverviewPage() {
  const auth = await requirePadel1Module()
  if (!auth.user) redirect('/login')
  if (auth.error && !auth.isBootstrap) {
    return <ErrorBanner message={auth.error} />
  }

  const role = staffRole(auth.staff, auth.isBootstrap)
  const counts = await padel1ModuleCounts()
  const kpis = await getDashboardKpis()

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-400">
        Acesso:{' '}
        <span className="font-semibold text-slate-200">{role}</span>
        {canWritePadel1(role)
          ? ' · escrita HQ (owner/platform)'
          : ' · só leitura'}
      </p>

      {!counts.ok && counts.missingConfig && (
        <ConfigBanner message={counts.error} />
      )}
      {!counts.ok && !counts.missingConfig && (
        <ErrorBanner message={counts.error} />
      )}

      {kpis.ok && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: 'Jogadores', value: kpis.data.players },
            { label: 'Clubes activos', value: kpis.data.activeClubs },
            { label: 'Total clubes', value: kpis.data.totalClubs },
            {
              label: 'Volume txns',
              value: `€${Math.round(kpis.data.txnVolume)}`,
            },
          ].map((k) => (
            <Panel key={k.label} className="p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                {k.label}
              </p>
              <p className="mt-1 font-[family-name:var(--font-display)] text-2xl font-bold">
                {k.value}
              </p>
            </Panel>
          ))}
        </div>
      )}

      {counts.ok && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {LINKS.map((item) => {
            const Icon = item.icon
            return (
              <Link key={item.href} href={item.href}>
                <Panel className="p-4 transition hover:border-cyan-500/40">
                  <div className="flex items-center justify-between">
                    <Icon className="h-5 w-5 text-cyan-400" />
                    <span className="font-[family-name:var(--font-display)] text-2xl font-bold">
                      {counts.data[item.key]}
                    </span>
                  </div>
                  <p className="mt-2 text-sm font-semibold text-slate-300">
                    {item.label}
                  </p>
                </Panel>
              </Link>
            )
          })}
        </div>
      )}

      {kpis.ok && (
        <div className="grid gap-3 lg:grid-cols-2">
          <Panel className="p-4">
            <p className="text-sm font-semibold text-white">Clubes por plano</p>
            <ul className="mt-2 space-y-1 text-sm text-slate-400">
              <li>Bronze: {kpis.data.planCounts.bronze}</li>
              <li>Silver: {kpis.data.planCounts.silver}</li>
              <li>Gold: {kpis.data.planCounts.gold}</li>
            </ul>
          </Panel>
          <Panel className="p-4">
            <p className="text-sm font-semibold text-white">
              Volume por tipo (txn)
            </p>
            <ul className="mt-2 max-h-40 space-y-1 overflow-y-auto text-sm text-slate-400">
              {kpis.data.txnsByType.length === 0 && <li>—</li>}
              {kpis.data.txnsByType.map((t) => (
                <li key={t.type}>
                  {t.type}: €{t.total}
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      )}
    </div>
  )
}
