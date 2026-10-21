import { redirect } from 'next/navigation'
import { requireHubAccess } from '@/lib/auth/hub-auth'
import { SimuladorPanel } from '@/components/sportsevents/SimuladorPanel'

/** Simulador financeiro de camps (ex-SportsEvents `/admin/simulador`). */
export default async function SimulacoesPage() {
  const auth = await requireHubAccess('dashboard')
  if (!auth.user) redirect('/login')
  if (auth.error && !auth.isBootstrap) {
    return (
      <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-6 text-amber-100">
        {auth.error}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-400">
        Simulador financeiro de camps (SportsEvents). Propostas gravadas em{' '}
        <code>simulator_proposals</code>.
      </p>
      <div className="overflow-hidden rounded-2xl border border-slate-800">
        <SimuladorPanel />
      </div>
    </div>
  )
}
