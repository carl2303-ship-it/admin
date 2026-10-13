import { redirect } from 'next/navigation'
import {
  requirePadel1Module,
  canWritePadel1,
  staffRole,
} from '@/lib/padel1/auth'
import { listPlatformPacks } from '@/lib/padel1/queries'
import { PacksPanel } from '@/components/padel1/packs-panel'
import { ConfigBanner, ErrorBanner } from '@/components/padel1/ui'

export default async function Padel1PacksPage() {
  const auth = await requirePadel1Module()
  if (!auth.user) redirect('/login')
  if (auth.error && !auth.isBootstrap) {
    return <ErrorBanner message={auth.error} />
  }
  const write = canWritePadel1(staffRole(auth.staff, auth.isBootstrap))
  const result = await listPlatformPacks()
  if (!result.ok && result.missingConfig) {
    return <ConfigBanner message={result.error} />
  }
  if (!result.ok) return <ErrorBanner message={result.error} />

  return (
    <div className="space-y-3">
      <h2 className="font-[family-name:var(--font-display)] text-xl font-bold">
        Packs
      </h2>
      <PacksPanel packs={result.data} canWrite={write} />
    </div>
  )
}
