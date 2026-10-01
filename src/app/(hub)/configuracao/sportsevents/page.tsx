import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ConfigSectionNav, IntegrationTable } from '@/components/config/config-ui'
import { ConfigIntentForm } from '@/components/config/config-intent-form'
import { ConfigIntentsTable } from '@/components/config/intents-table'
import { StripeDashboardLinks } from '@/components/config/stripe-dashboard-links'
import { NetlifyEnvPanel } from '@/components/config/netlify-env-panel'
import {
  listConfigIntents,
  requireConfigOwner,
} from '@/lib/config/queries'
import { getSportsEventsConfigStatus } from '@/lib/config/status'
import { getNetlifyEnvVisibility } from '@/lib/config/netlify-env'
import { ErrorBanner, Panel } from '@/components/boost/ui'

export default async function ConfigSportsEventsPage() {
  const gate = await requireConfigOwner()
  if (!gate.user) redirect('/login')
  if (!gate.allowed) return <ErrorBanner message={gate.error || 'Sem permissão'} />

  const status = getSportsEventsConfigStatus()
  const [intents, netlify] = await Promise.all([
    listConfigIntents('sportsevents'),
    getNetlifyEnvVisibility({ product: 'sportsevents' }),
  ])

  return (
    <div className="mx-auto max-w-5xl space-y-5 animate-fade-up">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-amber-700">
          Configuração · SportsEvents
        </p>
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight">
          SportsEvents
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-zinc-500">
          Auth e dados SE partilham o Supabase com o hub. Aqui vês o pacote Auth,
          intents para Stripe Connect / Meta / AI do site público, e env do
          admin. Estágios = ERP SE, não módulo Boost.
        </p>
      </div>

      <ConfigSectionNav active="sportsevents" />

      <IntegrationTable items={status.integrations} />

      <StripeDashboardLinks product="sportsevents" />

      <NetlifyEnvPanel
        visibility={netlify}
        title="Env Netlify · SE Auth (site admin)"
      />

      <ConfigIntentForm
        product="sportsevents"
        title="Intent de config SportsEvents"
        description="Para mudanças no Netlify admin (Auth) ou no Netlify sportsevents.app (Stripe/Meta/AI). O valor do secret não é guardado."
      />

      <ConfigIntentsTable intents={intents} />

      <Panel className="p-5 text-sm text-zinc-600">
        <p className="font-semibold text-zinc-900">Onde configurar o resto</p>
        <ul className="mt-2 list-inside list-disc space-y-1 text-xs">
          <li>
            ERP / definições legacy:{' '}
            <a
              href="https://sportsevents.app/admin"
              target="_blank"
              rel="noreferrer"
              className="font-semibold text-sky-700 hover:underline"
            >
              sportsevents.app/admin
            </a>
          </li>
          <li>
            Deep-link no hub:{' '}
            <Link
              href="/produtos/sportsevents"
              className="font-semibold text-sky-700 hover:underline"
            >
              /produtos/sportsevents
            </Link>
          </li>
          <li>
            Estágios e calendário: sportsevents.app (fora do Boost / hub
            estágios).
          </li>
          <li>
            Migration intents:{' '}
            <code>20260930170000_create_hub_config_intents.sql</code> no project
            SE.
          </li>
        </ul>
      </Panel>
    </div>
  )
}
