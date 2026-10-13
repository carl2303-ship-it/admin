import { redirect } from 'next/navigation'
import {
  requirePadel1Module,
  canWritePadel1,
  staffRole,
} from '@/lib/padel1/auth'
import { listClubs } from '@/lib/padel1/queries'
import { ClubsPanel } from '@/components/padel1/clubs-panel'
import { ConfigBanner, ErrorBanner } from '@/components/padel1/ui'

export default async function Padel1ClubesPage() {
  const auth = await requirePadel1Module()
  if (!auth.user) redirect('/login')
  if (auth.error && !auth.isBootstrap) {
    return <ErrorBanner message={auth.error} />
  }
  const write = canWritePadel1(staffRole(auth.staff, auth.isBootstrap))
  const result = await listClubs()
  if (!result.ok && result.missingConfig) {
    return <ConfigBanner message={result.error} />
  }
  if (!result.ok) return <ErrorBanner message={result.error} />

  return (
    <div className="space-y-3">
      <h2 className="font-[family-name:var(--font-display)] text-xl font-bold">
        Clubes
      </h2>
      <p className="text-sm text-zinc-500">
        CRUD, plano, suspensão, owner (Edge), licenças, checkout Stripe e
        toggles de módulos — paridade com HQClubManagement.
      </p>
      <ClubsPanel clubs={result.data} canWrite={write} />
    </div>
  )
}
