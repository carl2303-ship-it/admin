import { redirect } from 'next/navigation'
import {
  requirePadel1Module,
  canWritePadel1,
  staffRole,
} from '@/lib/padel1/auth'
import { getSettings } from '@/lib/padel1/queries'
import { SettingsPanel } from '@/components/padel1/settings-panel'
import { ConfigBanner, ErrorBanner } from '@/components/padel1/ui'

export default async function Padel1ConfiguracoesPage() {
  const auth = await requirePadel1Module()
  if (!auth.user) redirect('/login')
  if (auth.error && !auth.isBootstrap) {
    return <ErrorBanner message={auth.error} />
  }
  const write = canWritePadel1(staffRole(auth.staff, auth.isBootstrap))
  const result = await getSettings()
  if (!result.ok && result.missingConfig) {
    return <ConfigBanner message={result.error} />
  }
  if (!result.ok) return <ErrorBanner message={result.error} />

  return (
    <div className="space-y-3">
      <h2 className="font-[family-name:var(--font-display)] text-xl font-bold">
        Configurações HQ
      </h2>
      <p className="text-sm text-zinc-500">
        Stripe plataforma e planos de clube (
        <code>platform_stripe_config</code> / <code>platform_plans</code>).
        Secrets nunca são reexibidos — só presença + rotação.
      </p>
      <SettingsPanel
        stripe={result.data.stripe}
        plans={result.data.plans}
        canWrite={write}
      />
    </div>
  )
}
