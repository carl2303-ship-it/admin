import { redirect } from 'next/navigation'
import {
  requireSportsEventsModule,
  canWriteSportsEvents,
  staffRole,
} from '@/lib/sportsevents/auth'
import { EnterpriseShell } from '@/components/sportsevents/EnterpriseShell'

export default async function SportsEventsCalendarPage() {
  const auth = await requireSportsEventsModule()
  if (!auth.user) redirect('/login')
  if (auth.error && !auth.isBootstrap) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-900">
        {auth.error}
      </div>
    )
  }

  const role = staffRole(auth.staff, auth.isBootstrap)

  return (
    <div className="space-y-3">
      <p className="text-sm text-zinc-500">
        Acesso: <span className="font-semibold text-zinc-800">{role}</span>
        {canWriteSportsEvents(role)
          ? ' · escrita SE (owner/ops/commerce)'
          : ' · só leitura'}
      </p>
      <EnterpriseShell initialTab="kpis" hideChromeNav />
    </div>
  )
}
