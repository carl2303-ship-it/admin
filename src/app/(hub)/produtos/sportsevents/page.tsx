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
      <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-6 text-sm text-amber-100">
        {auth.error}
      </div>
    )
  }

  const role = staffRole(auth.staff, auth.isBootstrap)

  return (
    <div className="space-y-3">
      <p className="text-sm text-slate-400">
        Acesso: <span className="font-semibold text-slate-200">{role}</span>
        {canWriteSportsEvents(role)
          ? ' · escrita SE (owner/ops/commerce)'
          : ' · só leitura'}
      </p>
      <EnterpriseShell initialTab="kpis" hideChromeNav />
    </div>
  )
}
