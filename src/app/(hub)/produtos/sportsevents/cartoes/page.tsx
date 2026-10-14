import { redirect } from 'next/navigation'
import { requireSportsEventsModule } from '@/lib/sportsevents/auth'
import { CartoesPanel } from '@/components/sportsevents/CartoesPanel'

export default async function SeCartoesPage() {
  const auth = await requireSportsEventsModule()
  if (!auth.user) redirect('/login')
  if (auth.error && !auth.isBootstrap) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
        {auth.error}
      </div>
    )
  }
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-800">
      <CartoesPanel />
    </div>
  )
}
