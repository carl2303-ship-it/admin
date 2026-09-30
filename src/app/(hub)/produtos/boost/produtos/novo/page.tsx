import { redirect } from 'next/navigation'
import { requireBoostModule, canWriteBoost, staffRole } from '@/lib/boost/auth'
import { listBrands, listCategories } from '@/lib/boost/queries'
import { ProductForm } from '@/components/boost/product-form'
import { ConfigBanner, ErrorBanner, Panel } from '@/components/boost/ui'

export default async function NewProductPage() {
  const auth = await requireBoostModule()
  if (!auth.user) redirect('/login')
  if (auth.error && !auth.isBootstrap) {
    return <ErrorBanner message={auth.error} />
  }
  if (!canWriteBoost(staffRole(auth.staff, auth.isBootstrap))) {
    return <ErrorBanner message="Sem permissão de escrita (owner/commerce)." />
  }

  const [categories, brands] = await Promise.all([
    listCategories(),
    listBrands(),
  ])
  if (!categories.ok) {
    return categories.missingConfig ? (
      <ConfigBanner message={categories.error} />
    ) : (
      <ErrorBanner message={categories.error} />
    )
  }
  if (!brands.ok) return <ErrorBanner message={brands.error} />

  return (
    <Panel className="p-5">
      <h2 className="mb-4 font-[family-name:var(--font-display)] text-xl font-bold">
        Novo produto
      </h2>
      <ProductForm categories={categories.data} brands={brands.data} />
    </Panel>
  )
}
