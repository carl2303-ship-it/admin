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
import { getPadel1ConfigStatus } from '@/lib/config/status'
import { getNetlifyEnvVisibility } from '@/lib/config/netlify-env'
import { getSettings } from '@/lib/padel1/queries'
import { SettingsPanel } from '@/components/padel1/settings-panel'
import {
  canWritePadel1,
  staffRole,
} from '@/lib/padel1/auth'
import { ErrorBanner, Panel } from '@/components/boost/ui'

export default async function ConfigPadel1Page() {
  const gate = await requireConfigOwner()
  if (!gate.user) redirect('/login')
  if (!gate.allowed) return <ErrorBanner message={gate.error || 'Sem permissão'} />

  const status = getPadel1ConfigStatus()
  const write = canWritePadel1(staffRole(gate.staff, gate.isBootstrap))
  const [intents, netlify, settings] = await Promise.all([
    listConfigIntents('padel1'),
    getNetlifyEnvVisibility({ product: 'padel1' }),
    getSettings(),
  ])

  return (
    <div className="w-full space-y-5 animate-fade-up">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-cyan-400">
          Configuração · Padel1
        </p>
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight">
          Padel One
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-slate-400">
          Stripe plataforma, planos, env Netlify e intents — tudo nesta tab.
        </p>
      </div>

      <ConfigSectionNav active="padel1" />

      {settings.ok ? (
        <div className="space-y-3">
          <h2 className="font-[family-name:var(--font-display)] text-lg font-bold">
            Stripe HQ · planos
          </h2>
          <SettingsPanel
            stripe={settings.data.stripe}
            plans={settings.data.plans}
            canWrite={write}
          />
        </div>
      ) : (
        <Panel className="p-4 text-sm text-slate-400">
          {settings.error || 'Sem settings Padel1'}
        </Panel>
      )}

      <IntegrationTable items={status.integrations} />

      <StripeDashboardLinks product="padel1" />

      <NetlifyEnvPanel
        visibility={netlify}
        title="Env Netlify · Padel1 (site admin)"
      />

      <ConfigIntentForm
        product="padel1"
        title="Intent de config Padel1"
        description="Regista o que precisa de ser actualizado no Netlify admin ou no projecto padel1 (sem colar o valor do secret)."
      />

      <ConfigIntentsTable intents={intents} />
    </div>
  )
}
