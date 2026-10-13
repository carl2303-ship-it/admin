import { redirect } from 'next/navigation'
import { requirePadel1Module } from '@/lib/padel1/auth'
import { RoiPanel } from '@/components/padel1/roi-panel'
import { ErrorBanner } from '@/components/padel1/ui'

export default async function Padel1RentabilidadePage() {
  const auth = await requirePadel1Module()
  if (!auth.user) redirect('/login')
  if (auth.error && !auth.isBootstrap) {
    return <ErrorBanner message={auth.error} />
  }

  return (
    <div className="space-y-3">
      <h2 className="font-[family-name:var(--font-display)] text-xl font-bold">
        Rentabilidade Torneios
      </h2>
      <p className="text-sm text-zinc-500">
        Simulador local (mesmo localStorage do HQ Manager). Sem dados
        Supabase.
      </p>
      <RoiPanel />
    </div>
  )
}
