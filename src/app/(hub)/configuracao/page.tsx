import { redirect } from 'next/navigation'
import {
  ConfigSectionNav,
  ProductStatusCard,
} from '@/components/config/config-ui'
import { getConfigOverview } from '@/lib/config/queries'
import { ErrorBanner, Panel, StatusPill } from '@/components/boost/ui'

export default async function ConfiguracaoPage() {
  const overview = await getConfigOverview()
  if (!overview.ok) {
    if (overview.error === 'Não autenticado') redirect('/login')
    return <ErrorBanner message={overview.error} />
  }

  const hrefs: Record<string, string> = {
    boost: '/configuracao/boost',
    padel1: '/configuracao/padel1',
    sportsevents: '/configuracao/sportsevents',
    hub: '/configuracao/hub',
  }

  return (
    <div className="mx-auto max-w-5xl space-y-5 animate-fade-up">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-600">
          PADEL HUB · Central
        </p>
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight">
          Configuração
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-zinc-500">
          Um sítio para ver o estado das integrações de Boost, Padel1,
          SportsEvents e do próprio hub. Segredos nunca são mostrados — só
          ligado / em falta.
        </p>
      </div>

      <ConfigSectionNav active="overview" />

      <Panel className="p-4">
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <span className="font-semibold text-zinc-800">
            Escrita Edge Boost (Stripe)
          </span>
          <StatusPill
            active={overview.managementConfigured}
            activeLabel="Management API pronta"
            inactiveLabel="Só checklist / intent"
          />
        </div>
        <p className="mt-2 text-xs text-zinc-500">
          Secrets Stripe continuam no Edge Boost. O hub actualiza-os via
          Management API se existir PAT; caso contrário regista intent +
          checklist. Estágios ficam em sportsevents.app.
        </p>
      </Panel>

      <div className="grid gap-4 sm:grid-cols-2">
        {overview.products.map((p) => (
          <ProductStatusCard
            key={p.product}
            status={p}
            href={hrefs[p.product]}
          />
        ))}
      </div>
    </div>
  )
}
