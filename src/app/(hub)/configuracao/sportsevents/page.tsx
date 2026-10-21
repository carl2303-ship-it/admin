import { redirect } from 'next/navigation'
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
import { DefinicoesPanel } from '@/components/sportsevents/DefinicoesPanel'
import { ErrorBanner } from '@/components/boost/ui'

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
    <div className="w-full space-y-5 animate-fade-up">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-amber-400">
          Configuração · SportsEvents
        </p>
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight">
          SportsEvents
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-slate-400">
          Definições SE (staff + app_settings), Stripe Connect, env e intents —
          tudo nesta tab.
        </p>
      </div>

      <ConfigSectionNav active="sportsevents" />

      <div className="overflow-hidden rounded-2xl border border-slate-800">
        <DefinicoesPanel />
      </div>

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
    </div>
  )
}
