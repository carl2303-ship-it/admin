import { redirect } from 'next/navigation'
import {
  ConfigSectionNav,
  OwnerHealthCard,
} from '@/components/config/config-ui'
import { AllStripeDashboardShortcuts } from '@/components/config/stripe-dashboard-links'
import { getOwnerHealthItems } from '@/lib/config/owner-health'
import { requireConfigOwner } from '@/lib/config/queries'
import { ErrorBanner } from '@/components/boost/ui'

export default async function ConfiguracaoPage() {
  const gate = await requireConfigOwner()
  if (!gate.user) redirect('/login')
  if (!gate.allowed) {
    return <ErrorBanner message={gate.error || 'Sem permissão'} />
  }

  const health = getOwnerHealthItems()
  const allOk = health.every((h) => h.ok)

  return (
    <div className="w-full space-y-5 animate-fade-up">
      <p className="max-w-2xl text-sm text-slate-400">
        Só o essencial: está tudo OK, ou há um problema? As únicas coisas que
        podes precisar de mudar aqui são as <strong className="text-slate-200">chaves Stripe</strong>.
      </p>

      <ConfigSectionNav active="overview" />

      <div
        className={
          allOk
            ? 'rounded-2xl border border-cyan-500/30 bg-cyan-500/10 px-4 py-3 text-sm text-cyan-100'
            : 'rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100'
        }
      >
        {allOk
          ? 'Tudo OK nas três áreas.'
          : 'Há pelo menos um problema — abre a secção marcada e actualiza Stripe se for o caso.'}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {health.map((item) => (
          <OwnerHealthCard key={item.id} item={item} />
        ))}
      </div>

      <AllStripeDashboardShortcuts />
    </div>
  )
}
