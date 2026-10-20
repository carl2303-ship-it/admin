import { redirect } from 'next/navigation'
import { requireSportsEventsModule } from '@/lib/sportsevents/auth'
import { EnterpriseShell } from '@/components/sportsevents/EnterpriseShell'
import { PartnersDbBanner } from '@/components/sportsevents/PartnersDbBanner'
import { getPartnersDbCounts } from '@/lib/sportsevents/partners-counts'

export default async function SeParceirosPage() {
  const auth = await requireSportsEventsModule()
  if (!auth.user) redirect('/login')
  if (auth.error && !auth.isBootstrap) {
    return (
      <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-6 text-amber-100">
        {auth.error}
      </div>
    )
  }

  // Só lê a DB SE — sem seed inventado.
  const counts = await getPartnersDbCounts()

  return (
    <div className="space-y-4">
      <PartnersDbBanner counts={counts} />
      <EnterpriseShell
        initialTab="partners"
        hideChromeNav
        partnersListMode="ALL"
      />
    </div>
  )
}
