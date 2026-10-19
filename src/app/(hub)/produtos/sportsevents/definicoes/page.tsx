import { redirect } from 'next/navigation'
import { requireSportsEventsModule } from '@/lib/sportsevents/auth'
import { DefinicoesPanel } from '@/components/sportsevents/DefinicoesPanel'
import Link from 'next/link'

export default async function SeDefinicoesPage() {
  const auth = await requireSportsEventsModule()
  if (!auth.user) redirect('/login')
  if (auth.error && !auth.isBootstrap) {
    return (
      <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-6 text-amber-100">
        {auth.error}
      </div>
    )
  }
  return (
    <div className="space-y-3">
      <p className="text-sm text-slate-400">
        Staff do hub (roles globais):{' '}
        <Link href="/equipa" className="font-semibold text-amber-700 hover:underline">
          /equipa
        </Link>
        . Abaixo: <code className="text-xs">staff_members</code> +{' '}
        <code className="text-xs">app_settings</code> do site SE (paridade
        definições legado).
      </p>
      <div className="overflow-hidden rounded-2xl border border-slate-800">
        <DefinicoesPanel />
      </div>
    </div>
  )
}
