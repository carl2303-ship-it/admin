import { redirect } from 'next/navigation'
import { ConfigSectionNav } from '@/components/config/config-ui'
import { StripeDashboardLinks } from '@/components/config/stripe-dashboard-links'
import { requireConfigOwner } from '@/lib/config/queries'
import { DefinicoesPanel } from '@/components/sportsevents/DefinicoesPanel'
import { ErrorBanner } from '@/components/boost/ui'

export default async function ConfigSportsEventsPage() {
  const gate = await requireConfigOwner()
  if (!gate.user) redirect('/login')
  if (!gate.allowed) return <ErrorBanner message={gate.error || 'Sem permissão'} />

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
          Chaves Stripe do site. Staff da equipa fica em Equipa — aqui só o que
          podes precisar de mudar nos pagamentos.
        </p>
      </div>

      <ConfigSectionNav active="sportsevents" />

      <StripeDashboardLinks product="sportsevents" />

      <div className="overflow-hidden rounded-2xl border border-slate-800">
        <DefinicoesPanel mode="stripe" />
      </div>
    </div>
  )
}
