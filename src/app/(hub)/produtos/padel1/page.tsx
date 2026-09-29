import { requireHubAccess } from '@/lib/auth/hub-auth'
import { getDeepLink } from '@/lib/products/deep-links'
import { PRODUCT_GAPS } from '@/lib/products/bridge'
import { ProductLaunchCard } from '@/components/shell/product-launch-card'
import { redirect } from 'next/navigation'

export default async function Padel1ProductPage() {
  const auth = await requireHubAccess('padel1')
  if (!auth.user) redirect('/login')
  if (auth.error && !auth.isBootstrap) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
        {auth.error}
      </div>
    )
  }

  const link = getDeepLink('padel1')

  return (
    <div className="mx-auto max-w-3xl space-y-6 animate-fade-up">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold">
          Padel One HQ
        </h1>
        <p className="mt-2 text-sm text-zinc-500">
          Super-admin da plataforma. Manager de clube e Tour ficam nas apps
          cliente.
        </p>
      </div>
      <ProductLaunchCard
        link={link}
        bridgeHref="/api/bridge/padel1"
        bridgeNote={PRODUCT_GAPS.padel1}
      />
    </div>
  )
}
