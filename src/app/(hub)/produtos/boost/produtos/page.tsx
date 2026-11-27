import Link from 'next/link'
import { redirect } from 'next/navigation'
import { requireBoostModule, canWriteBoost, staffRole } from '@/lib/boost/auth'
import { listActiveStoreMarketplaceProductIds } from '@/lib/boost/actions'
import { listProducts } from '@/lib/boost/queries'
import { ProductsReorderTable } from '@/components/boost/products-reorder-table'
import {
  ConfigBanner,
  ErrorBanner,
  Panel,
  btnPrimary,
} from '@/components/boost/ui'

export default async function BoostProductsPage() {
  const auth = await requireBoostModule()
  if (!auth.user) redirect('/login')
  if (auth.error && !auth.isBootstrap) {
    return <ErrorBanner message={auth.error} />
  }
  const write = canWriteBoost(staffRole(auth.staff, auth.isBootstrap))
  const [result, marketplace] = await Promise.all([
    listProducts(),
    write
      ? listActiveStoreMarketplaceProductIds()
      : Promise.resolve({
          ok: true as const,
          productIds: [] as string[],
        }),
  ])

  if (!result.ok && result.missingConfig) {
    return <ConfigBanner message={result.error} />
  }
  if (!result.ok) return <ErrorBanner message={result.error} />

  const listedOnPadel1 = marketplace.ok ? marketplace.productIds : []
  const marketplaceError = marketplace.ok ? null : marketplace.error

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="font-[family-name:var(--font-display)] text-xl font-bold">
            Produtos
          </h2>
          <p className="mt-1 text-xs text-slate-400">
            Coluna <span className="text-cyan-300">Padel1</span>: publicar /
            remover na lista do marketplace (não é em store.padel1.app).
          </p>
        </div>
        {write && (
          <Link href="/produtos/boost/produtos/novo" className={btnPrimary}>
            Novo produto
          </Link>
        )}
      </div>
      <Panel>
        <ProductsReorderTable
          products={result.data}
          canWrite={write}
          listedOnPadel1={listedOnPadel1}
          marketplaceError={marketplaceError}
        />
      </Panel>
    </div>
  )
}
