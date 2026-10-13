import { redirect } from 'next/navigation'
import { requirePadel1Module } from '@/lib/padel1/auth'
import { getMetrics } from '@/lib/padel1/queries'
import {
  ConfigBanner,
  ErrorBanner,
  Panel,
} from '@/components/padel1/ui'

export default async function Padel1MetricasPage() {
  const auth = await requirePadel1Module()
  if (!auth.user) redirect('/login')
  if (auth.error && !auth.isBootstrap) {
    return <ErrorBanner message={auth.error} />
  }
  const result = await getMetrics()
  if (!result.ok && result.missingConfig) {
    return <ConfigBanner message={result.error} />
  }
  if (!result.ok) return <ErrorBanner message={result.error} />
  const m = result.data

  return (
    <div className="space-y-4">
      <h2 className="font-[family-name:var(--font-display)] text-xl font-bold">
        Métricas
      </h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Total clubes', value: m.totalClubs },
          { label: 'Clubes activos', value: m.activeClubs },
          { label: 'Jogadores', value: m.totalPlayers },
          {
            label: 'Receita clubes',
            value: `€${Math.round(m.clubRevenue)}`,
          },
          { label: 'Licenças total', value: m.licenses.total },
          { label: 'Licenças activas', value: m.licenses.active },
          { label: 'Licenças usadas', value: m.licenses.used },
          { label: 'Expiram em 30d', value: m.expiringSoon },
        ].map((k) => (
          <Panel key={k.label} className="p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-zinc-500">
              {k.label}
            </p>
            <p className="mt-1 font-[family-name:var(--font-display)] text-2xl font-bold">
              {k.value}
            </p>
          </Panel>
        ))}
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        <Panel className="p-4">
          <p className="text-sm font-semibold">Planos</p>
          <ul className="mt-2 space-y-1 text-sm text-zinc-600">
            <li>Bronze: {m.planCounts.bronze}</li>
            <li>Silver: {m.planCounts.silver}</li>
            <li>Gold: {m.planCounts.gold}</li>
          </ul>
        </Panel>
        <Panel className="p-4">
          <p className="text-sm font-semibold">Receita mensal (plataforma)</p>
          <ul className="mt-2 max-h-48 space-y-1 overflow-y-auto text-sm text-zinc-600">
            {m.monthlyRevenue.length === 0 && <li>—</li>}
            {m.monthlyRevenue.map((r) => (
              <li key={r.month}>
                {r.month}: €{r.total}
              </li>
            ))}
          </ul>
        </Panel>
        <Panel className="p-4">
          <p className="text-sm font-semibold">Crescimento clubes / mês</p>
          <ul className="mt-2 max-h-48 space-y-1 overflow-y-auto text-sm text-zinc-600">
            {m.monthlyClubGrowth.length === 0 && <li>—</li>}
            {m.monthlyClubGrowth.map((r) => (
              <li key={r.month}>
                {r.month}: +{r.count}
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </div>
  )
}
