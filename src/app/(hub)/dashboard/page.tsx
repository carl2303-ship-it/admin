import { requireHubAccess } from '@/lib/auth/hub-auth'
import { fetchDashboardKpis } from '@/lib/products/kpis'
import { getLegacyDeepLinks } from '@/lib/products/deep-links'
import { KpiCard } from '@/components/dashboard/kpi-card'
import { ExternalLink } from 'lucide-react'
import { redirect } from 'next/navigation'
import { ProductChrome } from '@/components/shell/product-chrome'

export default async function DashboardPage() {
  const auth = await requireHubAccess('dashboard')
  if (!auth.user) redirect('/login')
  if (auth.error && !auth.isBootstrap) {
    return (
      <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-6 text-amber-100">
        {auth.error}
      </div>
    )
  }

  const kpis = await fetchDashboardKpis()
  const links = getLegacyDeepLinks()

  return (
    <ProductChrome eyebrow="PADEL HUB" title="Dashboard">
      <div className="space-y-10 animate-fade-up">
        <div>
          <p className="max-w-2xl text-sm text-slate-400">
            Visão read-only dos três produtos. Valores em falta degradam com
            elegância quando env/service role não estão configurados.
          </p>
          {auth.isBootstrap && (
            <p className="mt-3 rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-4 py-3 text-sm text-cyan-100">
              Modo bootstrap: a tabela <code>hub_staff</code> está vazia. Insere
              o teu user como <strong>owner</strong> no Supabase SportsEvents.
            </p>
          )}
        </div>

        <section>
          <h2 className="mb-4 text-xs font-bold uppercase tracking-[0.14em] text-amber-400">
            KPIs
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {kpis.map((kpi) => (
              <KpiCard key={kpi.key} kpi={kpi} />
            ))}
          </div>
        </section>

        <section>
          <h2 className="mb-4 text-xs font-bold uppercase tracking-[0.14em] text-amber-400">
            Atalhos legacy
          </h2>
          <div className="grid gap-3 sm:grid-cols-3">
            {links.map((link) => (
              <a
                key={link.product}
                href={`/api/bridge/${link.product}`}
                className="group flex items-center justify-between border border-slate-800 bg-slate-950 px-4 py-3 text-sm font-semibold text-slate-200 transition hover:border-cyan-500/40"
              >
                {link.label}
                <ExternalLink className="h-4 w-4 text-slate-500 transition group-hover:text-cyan-400" />
              </a>
            ))}
          </div>
        </section>
      </div>
    </ProductChrome>
  )
}
