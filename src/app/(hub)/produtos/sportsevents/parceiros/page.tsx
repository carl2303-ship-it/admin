import { redirect } from 'next/navigation'
import { requireSportsEventsModule } from '@/lib/sportsevents/auth'
import { ensureEuropeanPadelClubs } from '@/lib/sportsevents/ensure-european-clubs'
import { EnterpriseShell } from '@/components/sportsevents/EnterpriseShell'
import { PartnersSeedBanner } from '@/components/sportsevents/PartnersSeedBanner'

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

  // Seed no servidor (service role) — não depende do browser / não engole erros.
  const seed = await ensureEuropeanPadelClubs()

  return (
    <div className="space-y-4">
      <PartnersSeedBanner seed={seed} />
      <EnterpriseShell
        initialTab="partners"
        hideChromeNav
        partnersListMode="ALL"
        skipClientEnsure
      />
    </div>
  )
}
