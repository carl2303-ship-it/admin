import { redirect } from 'next/navigation'
import { ConfigSectionNav } from '@/components/config/config-ui'
import { BoostStripeSecretsForm } from '@/components/config/boost-stripe-form'
import { StripeDashboardLinks } from '@/components/config/stripe-dashboard-links'
import { requireConfigOwner } from '@/lib/config/queries'
import { listBoostEdgeSecretNames } from '@/lib/config/management-api'
import { ErrorBanner } from '@/components/boost/ui'

export default async function ConfigBoostPage() {
  const gate = await requireConfigOwner()
  if (!gate.user) redirect('/login')
  if (!gate.allowed) return <ErrorBanner message={gate.error || 'Sem permissão'} />

  const edge = await listBoostEdgeSecretNames()

  return (
    <div className="w-full space-y-5 animate-fade-up">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-cyan-400">
          Configuração · Loja
        </p>
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight">
          Loja
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-slate-400">
          Conta Stripe da loja (checkout e ebooks). Actualiza só se mudares de
          conta ou rodares chaves.
        </p>
      </div>

      <ConfigSectionNav active="boost" />

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
    </div>
  )
}
