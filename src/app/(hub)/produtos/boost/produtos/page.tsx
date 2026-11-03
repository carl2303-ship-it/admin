import Link from 'next/link'
import { redirect } from 'next/navigation'
import { requireBoostModule, canWriteBoost, staffRole } from '@/lib/boost/auth'
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
  const result = await listProducts()

  if (!result.ok && result.missingConfig) {
    return <ConfigBanner message={result.error} />
  }
  if (!result.ok) return <ErrorBanner message={result.error} />

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-[family-name:var(--font-display)] text-xl font-bold">
          Produtos
        </h2>
        {write && (
          <Link href="/produtos/boost/produtos/novo" className={btnPrimary}>
            Novo produto
          </Link>
        )}
      </div>
      <Panel>
        <ProductsReorderTable products={result.data} canWrite={write} />
      </Panel>
    </div>
  )
}
