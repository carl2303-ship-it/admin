import { requireHubAccess } from '@/lib/auth/hub-auth'
import { getDeepLink } from '@/lib/products/deep-links'
import { PRODUCT_GAPS } from '@/lib/products/bridge'
import { ProductLaunchCard } from '@/components/shell/product-launch-card'
import { redirect } from 'next/navigation'

export default async function SportsEventsProductPage() {
  const auth = await requireHubAccess('sportsevents')
  if (!auth.user) redirect('/login')
  if (auth.error && !auth.isBootstrap) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
        {auth.error}
      </div>
    )
  }

  const link = getDeepLink('sportsevents')

  return (
    <div className="mx-auto max-w-3xl space-y-6 animate-fade-up">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold">
          SportsEvents ERP
        </h1>
        <p className="mt-2 text-sm text-zinc-500">
          Calendário, CRM, parceiros e blog. Incorporação UI = Fase 4.
        </p>
      </div>
      <ProductLaunchCard
        link={link}
        bridgeHref="/api/bridge/sportsevents"
        bridgeNote={PRODUCT_GAPS.sportsevents}
      />
    </div>
  )
}
