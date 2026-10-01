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
import { getPadel1ConfigStatus } from '@/lib/config/status'
import { getNetlifyEnvVisibility } from '@/lib/config/netlify-env'
import { ErrorBanner, Panel } from '@/components/boost/ui'

export default async function ConfigPadel1Page() {
  const gate = await requireConfigOwner()
  if (!gate.user) redirect('/login')
  if (!gate.allowed) return <ErrorBanner message={gate.error || 'Sem permissão'} />

  const status = getPadel1ConfigStatus()
  const [intents, netlify] = await Promise.all([
    listConfigIntents('padel1'),
    getNetlifyEnvVisibility({ product: 'padel1' }),
  ])

  return (
    <div className="mx-auto max-w-5xl space-y-5 animate-fade-up">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-violet-600">
          Configuração · Padel1
        </p>
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight">
          Padel One
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-zinc-500">
          Mais do que status: env Netlify do admin, atalhos Stripe HQ e intents
          para rotação sem perder o contexto no hub. Escrita live Stripe
          plataforma = Fase 3.
        </p>
      </div>

      <ConfigSectionNav active="padel1" />

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

      <Panel className="p-5 text-sm text-zinc-600">
        <p className="font-semibold text-zinc-900">Atalhos no hub</p>
        <ul className="mt-2 list-inside list-disc space-y-1 text-xs">
          <li>
            Produto / KPIs:{' '}
            <Link
              href="/produtos/padel1"
              className="font-semibold text-sky-700 hover:underline"
            >
              /produtos/padel1
            </Link>
          </li>
          <li>
            HQ de emergência: deep-link{' '}
            <code>NEXT_PUBLIC_PADEL1_HQ_URL</code> (acima)
          </li>
          <li>
            Estágios: <strong>não</strong> fazem parte do Boost — ERP SE em
            sportsevents.app
          </li>
        </ul>
      </Panel>
    </div>
  )
}
