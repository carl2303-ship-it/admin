import Link from 'next/link'
import { redirect } from 'next/navigation'
import { requireHubAccess } from '@/lib/auth/hub-auth'
import { fetchDashboardKpis } from '@/lib/products/kpis'
import { getMetrics } from '@/lib/padel1/queries'
import { getBoostAnalytics } from '@/lib/boost/queries'
import { KpiCard } from '@/components/dashboard/kpi-card'

export default async function MetricasHubPage() {
  const auth = await requireHubAccess('dashboard')
  if (!auth.user) redirect('/login')
  if (auth.error && !auth.isBootstrap) {
    return (
      <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-6 text-amber-100">
        {auth.error}
      </div>
    )
  }

  const [kpis, padel1, boost] = await Promise.all([
    fetchDashboardKpis(),
    getMetrics(),
    getBoostAnalytics({ period: 'month', compare: 'previous' }),
  ])

  return (
    <div className="space-y-10">
      <p className="max-w-3xl text-sm text-slate-400">
        Consolidação das métricas já existentes nos 3 produtos — sem números
        inventados. Detalhe completo em cada tab.
      </p>

      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <h2 className="text-xs font-bold uppercase tracking-[0.14em] text-amber-400">
            Boost Store
          </h2>
          <Link
            href="/metricas/boost"
            className="text-sm font-semibold text-cyan-400 hover:underline"
          >
            Analytics completo →
          </Link>
        </div>
        {boost.ok ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ['Receita (mês)', `€${boost.data.revenue.toFixed(2)}`],
              ['Vendas', String(boost.data.sales)],
              ['SaaS activas', String(boost.data.saas.active)],
              ['MRR SaaS', `€${boost.data.saas.mrr.toFixed(2)}`],
            ].map(([label, value]) => (
              <div
                key={label}
                className="rounded-2xl border border-slate-800 bg-slate-950 p-4"
              >
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  {label}
                </p>
                <p className="mt-1 font-[family-name:var(--font-display)] text-2xl font-bold">
                  {value}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-500">
            {boost.missingConfig
              ? 'Boost sem service role configurado.'
              : boost.error}
          </p>
        )}
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <h2 className="text-xs font-bold uppercase tracking-[0.14em] text-amber-400">
            Padel One
          </h2>
          <Link
            href="/metricas/padel1"
            className="text-sm font-semibold text-cyan-400 hover:underline"
          >
            Métricas HQ →
          </Link>
        </div>
        {padel1.ok ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ['Clubes activos', String(padel1.data.activeClubs)],
              ['Jogadores', String(padel1.data.totalPlayers)],
              ['Receita clubes', `€${Math.round(padel1.data.clubRevenue)}`],
              ['Expiram 30d', String(padel1.data.expiringSoon)],
            ].map(([label, value]) => (
              <div
                key={label}
                className="rounded-2xl border border-slate-800 bg-slate-950 p-4"
              >
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  {label}
                </p>
                <p className="mt-1 font-[family-name:var(--font-display)] text-2xl font-bold">
                  {value}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-500">
            {padel1.missingConfig
              ? 'Padel1 sem service role configurado.'
              : padel1.error}
          </p>
        )}
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <h2 className="text-xs font-bold uppercase tracking-[0.14em] text-amber-400">
            SportsEvents
          </h2>
          <div className="flex gap-3 text-sm font-semibold">
            <Link href="/metricas/se" className="text-cyan-400 hover:underline">
              KPIs SE →
            </Link>
            <Link
              href="/simulacoes/roi"
              className="text-amber-400 hover:underline"
            >
              ROI Torneios →
            </Link>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {kpis
            .filter((k) => k.product === 'sportsevents')
            .map((kpi) => (
              <KpiCard key={kpi.key} kpi={kpi} />
            ))}
        </div>
      </section>
    </div>
  )
}
