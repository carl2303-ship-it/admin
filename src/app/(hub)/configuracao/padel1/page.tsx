import { redirect } from 'next/navigation'
import { ConfigSectionNav } from '@/components/config/config-ui'
import { StripeDashboardLinks } from '@/components/config/stripe-dashboard-links'
import { requireConfigOwner } from '@/lib/config/queries'
import { getSettings } from '@/lib/padel1/queries'
import { SettingsPanel } from '@/components/padel1/settings-panel'
import { canWritePadel1, staffRole } from '@/lib/padel1/auth'
import { ErrorBanner, Panel } from '@/components/boost/ui'

export default async function ConfigPadel1Page() {
  const gate = await requireConfigOwner()
  if (!gate.user) redirect('/login')
  if (!gate.allowed) return <ErrorBanner message={gate.error || 'Sem permissão'} />

  const write = canWritePadel1(staffRole(gate.staff, gate.isBootstrap))
  const settings = await getSettings()

  return (
    <div className="w-full space-y-5 animate-fade-up">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-cyan-400">
          Configuração · Padel1
        </p>
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight">
          Padel1
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-slate-400">
          Chaves Stripe da plataforma e planos. Só mudas isto se a conta Stripe
          ou os preços mudarem.
        </p>
      </div>

      <ConfigSectionNav active="padel1" />

      <StripeDashboardLinks product="padel1" />

      {settings.ok ? (
        <SettingsPanel
          stripe={settings.data.stripe}
          plans={settings.data.plans}
          canWrite={write}
        />
      ) : (
        <Panel className="p-4 text-sm text-slate-400">
          {settings.error || 'Não foi possível carregar as definições Stripe.'}
        </Panel>
      )}
    </div>
  )
}
