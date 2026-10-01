import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ConfigSectionNav, IntegrationTable } from '@/components/config/config-ui'
import { BoostStripeSecretsForm } from '@/components/config/boost-stripe-form'
import { ConfigIntentsTable } from '@/components/config/intents-table'
import { StripeDashboardLinks } from '@/components/config/stripe-dashboard-links'
import { NetlifyEnvPanel } from '@/components/config/netlify-env-panel'
import {
  listConfigIntents,
  requireConfigOwner,
} from '@/lib/config/queries'
import { getBoostConfigStatus } from '@/lib/config/status'
import { listBoostEdgeSecretNames } from '@/lib/config/management-api'
import { getNetlifyEnvVisibility } from '@/lib/config/netlify-env'
import { ErrorBanner, Panel } from '@/components/boost/ui'

export default async function ConfigBoostPage() {
  const gate = await requireConfigOwner()
  if (!gate.user) redirect('/login')
  if (!gate.allowed) return <ErrorBanner message={gate.error || 'Sem permissão'} />

  const status = getBoostConfigStatus()
  const [edge, intents, netlify] = await Promise.all([
    listBoostEdgeSecretNames(),
    listConfigIntents('boost'),
    getNetlifyEnvVisibility({ product: 'boost' }),
  ])

  return (
    <div className="mx-auto max-w-5xl space-y-5 animate-fade-up">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-sky-600">
          Configuração · Boost
        </p>
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight">
          Boost Store
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-zinc-500">
          Estado das env do hub para Boost + rotação Stripe nas Edge Functions +
          atalhos Dashboard. Ops do dia-a-dia em{' '}
          <Link
            href="/produtos/boost/stripe"
            className="font-semibold text-sky-700 hover:underline"
          >
            /produtos/boost/stripe
          </Link>
          .
        </p>
      </div>

      <ConfigSectionNav active="boost" />

      <Panel className="p-5 text-sm text-zinc-600">
        <p className="font-semibold text-zinc-900">Modelo actual</p>
        <ul className="mt-2 list-inside list-disc space-y-1 text-xs">
          <li>
            <code>STRIPE_SECRET_KEY</code> / webhook vivem nos{' '}
            <strong>Edge secrets</strong> do Supabase Boost — não no Netlify do
            admin.
          </li>
          <li>
            O hub usa <code>BOOST_*</code> + JWT Edge para{' '}
            <em>invocar</em> <code>stripe-checkout</code> etc.
          </li>
          <li>
            Service role Boost ≠ Management API: sem PAT não há write live de
            secrets.
          </li>
        </ul>
      </Panel>

      <IntegrationTable items={status.integrations} />

      <StripeDashboardLinks product="boost" />

      <BoostStripeSecretsForm
        managementConfigured={edge.managementConfigured}
        stripeSecretPresent={
          edge.managementConfigured && !edge.error
            ? edge.stripeSecretPresent
            : null
        }
        stripeWebhookPresent={
          edge.managementConfigured && !edge.error
            ? edge.stripeWebhookPresent
            : null
        }
        edgeSecretsError={
          edge.managementConfigured ? edge.error : undefined
        }
      />

      <NetlifyEnvPanel
        visibility={netlify}
        title="Env Netlify · Boost (site admin)"
      />

      <ConfigIntentsTable intents={intents} />
    </div>
  )
}
