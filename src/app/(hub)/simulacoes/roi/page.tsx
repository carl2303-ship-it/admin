import { redirect } from 'next/navigation'
import { requireHubAccess } from '@/lib/auth/hub-auth'
import RentabilidadeTorneios from '@/components/sportsevents/RentabilidadeTorneios'

/** Calculadora ROI / rentabilidade torneios (localStorage — mesma UI SE). */
export default async function SimulacoesRoiPage() {
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
        Rentabilidade de torneios e estágios itinerantes (calculadora local —
        mesma ferramenta que estava em SportsEvents).
      </p>
      <RentabilidadeTorneios />
    </div>
  )
}
