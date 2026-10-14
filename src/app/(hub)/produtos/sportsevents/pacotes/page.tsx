import { redirect } from 'next/navigation'
import { requireSportsEventsModule } from '@/lib/sportsevents/auth'
import { EnterpriseShell } from '@/components/sportsevents/EnterpriseShell'

export default async function SePacotesPage() {
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
    <EnterpriseShell
      initialTab="events"
      initialEventsSubTab="packages"
      hideChromeNav
    />
  )
}
