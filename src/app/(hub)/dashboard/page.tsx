import { requireHubAccess } from '@/lib/auth/hub-auth'
import { fetchDashboardKpis } from '@/lib/products/kpis'
import { getLegacyDeepLinks } from '@/lib/products/deep-links'
import { KpiCard } from '@/components/dashboard/kpi-card'
import { ExternalLink } from 'lucide-react'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  const auth = await requireHubAccess('dashboard')
  if (!auth.user) redirect('/login')
  if (auth.error && !auth.isBootstrap) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-900">
        {auth.error}
      </div>
    )
  }

  const kpis = await fetchDashboardKpis()
  const links = getLegacyDeepLinks()

  return (
    <div className="mx-auto max-w-6xl space-y-10 animate-fade-up">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight text-zinc-900">
          Dashboard
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-zinc-500">
          Visão read-only dos três produtos. Valores em falta degradam com
          elegância quando env/service role não estão configurados.
        </p>
        {auth.isBootstrap && (
          <p className="mt-3 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900">
            Modo bootstrap: a tabela <code>hub_staff</code> está vazia. Insere o
            teu user como <strong>owner</strong> no Supabase do hub.
          </p>
        )}
      </div>

      <section>
        <h2 className="mb-4 text-xs font-bold uppercase tracking-[0.14em] text-zinc-400">
          KPIs
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {kpis.map((kpi) => (
            <KpiCard key={kpi.key} kpi={kpi} />
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-xs font-bold uppercase tracking-[0.14em] text-zinc-400">
          Atalhos legacy
        </h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {links.map((link) => (
            <a
              key={link.product}
              href={`/api/bridge/${link.product}`}
              className="group flex items-center justify-between rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm font-semibold text-zinc-800 shadow-sm transition hover:border-emerald-300 hover:shadow-md"
            >
              {link.label}
              <ExternalLink className="h-4 w-4 text-zinc-400 transition group-hover:text-emerald-600" />
            </a>
          ))}
        </div>
      </section>
    </div>
  )
}
