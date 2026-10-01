import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ConfigSectionNav, IntegrationTable } from '@/components/config/config-ui'
import { ConfigIntentForm } from '@/components/config/config-intent-form'
import { ConfigIntentsTable } from '@/components/config/intents-table'
import { NetlifyEnvPanel } from '@/components/config/netlify-env-panel'
import { OpsChecklistBanner } from '@/components/config/ops-checklist'
import {
  listConfigIntents,
  requireConfigOwner,
} from '@/lib/config/queries'
import { getHubConfigStatus } from '@/lib/config/status'
import { getNetlifyEnvVisibility } from '@/lib/config/netlify-env'
import { ErrorBanner, Panel } from '@/components/boost/ui'

export default async function ConfigHubPage() {
  const gate = await requireConfigOwner()
  if (!gate.user) redirect('/login')
  if (!gate.allowed) return <ErrorBanner message={gate.error || 'Sem permissão'} />

  const status = getHubConfigStatus()
  const [intents, netlify] = await Promise.all([
    listConfigIntents('hub'),
    getNetlifyEnvVisibility({ product: 'hub' }),
  ])

  return (
    <div className="mx-auto max-w-5xl space-y-5 animate-fade-up">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-600">
          Configuração · Hub
        </p>
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight">
          Hub (staff / env)
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-zinc-500">
          Contas globais (<code>hub_staff</code>), Auth SE, PAT Management API e
          tokens Netlify para visibilidade de env.
        </p>
      </div>

      <ConfigSectionNav active="hub" />

      <OpsChecklistBanner />

      <IntegrationTable items={status.integrations} />

      <NetlifyEnvPanel
        visibility={netlify}
        title="Env Netlify · Hub / tokens"
      />

      <ConfigIntentForm
        product="hub"
        title="Intent de setup hub"
        description="Regista setup pendente (PAT, Netlify API, site URL) sem guardar valores."
      />

      <ConfigIntentsTable intents={intents} />

      <Panel className="p-5 text-sm text-zinc-600">
        <p className="font-semibold text-zinc-900">Atalhos</p>
        <ul className="mt-2 list-inside list-disc space-y-1 text-xs">
          <li>
            <Link
              href="/equipa"
              className="font-semibold text-sky-700 hover:underline"
            >
              /equipa
            </Link>{' '}
            — criar / editar hub_staff (owner)
          </li>
          <li>
            Migration intents:{' '}
            <code>supabase/migrations/20260930170000_create_hub_config_intents.sql</code>{' '}
            no project SportsEvents
          </li>
          <li>
            Write live Edge Boost: <code>SUPABASE_ACCESS_TOKEN</code> (PAT) no
            Netlify do admin
          </li>
          <li>
            Visibilidade Netlify API:{' '}
            <code>NETLIFY_AUTH_TOKEN</code> + <code>NETLIFY_ACCOUNT_ID</code>
          </li>
        </ul>
      </Panel>
    </div>
  )
}
