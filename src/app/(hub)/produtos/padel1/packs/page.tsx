import { redirect } from 'next/navigation'
import {
  requirePadel1Module,
  canWritePadel1,
  staffRole,
} from '@/lib/padel1/auth'
import { listPlatformModules, listPlatformPacks } from '@/lib/padel1/queries'
import { PacksPanel } from '@/components/padel1/packs-panel'
import { ConfigBanner, ErrorBanner } from '@/components/padel1/ui'

export default async function Padel1PacksPage() {
  const auth = await requirePadel1Module()
  if (!auth.user) redirect('/login')
  if (auth.error && !auth.isBootstrap) {
    return <ErrorBanner message={auth.error} />
  }
  const write = canWritePadel1(staffRole(auth.staff, auth.isBootstrap))
  const [packsResult, modulesResult] = await Promise.all([
    listPlatformPacks(),
    listPlatformModules(),
  ])
  if (!packsResult.ok && packsResult.missingConfig) {
    return <ConfigBanner message={packsResult.error} />
  }
  if (!packsResult.ok) return <ErrorBanner message={packsResult.error} />
  if (!modulesResult.ok && !modulesResult.missingConfig) {
    return <ErrorBanner message={modulesResult.error} />
  }

  return (
    <div className="space-y-3">
      <h2 className="font-[family-name:var(--font-display)] text-xl font-bold">
        Packs
      </h2>
      <p className="text-sm text-slate-400">
        Catálogo comercial da landing (preços, features, módulos ligados). Packs{' '}
        <code className="text-cyan-300">light</code> /{' '}
        <code className="text-cyan-300">total</code> também alimentam os botões
        Pack Light / Total nos clubes.
      </p>
      <PacksPanel
        packs={packsResult.data}
        modules={modulesResult.ok ? modulesResult.data : []}
        canWrite={write}
      />
    </div>
  )
}
