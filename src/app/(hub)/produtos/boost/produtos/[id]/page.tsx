import { redirect, notFound } from 'next/navigation'
import { requireBoostModule, canWriteBoost, staffRole } from '@/lib/boost/auth'
import { getProduct, listBrands, listCategories } from '@/lib/boost/queries'
import { ProductForm } from '@/components/boost/product-form'
import { ConfigBanner, ErrorBanner, Panel } from '@/components/boost/ui'

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const auth = await requireBoostModule()
  if (!auth.user) redirect('/login')
  if (auth.error && !auth.isBootstrap) {
    return <ErrorBanner message={auth.error} />
  }
  if (!canWriteBoost(staffRole(auth.staff, auth.isBootstrap))) {
    return <ErrorBanner message="Sem permissão de escrita (owner/commerce)." />
  }

  const [product, categories, brands] = await Promise.all([
    getProduct(id),
    listCategories(),
    listBrands(),
  ])

  if (!product.ok) {
    return product.missingConfig ? (
      <ConfigBanner message={product.error} />
    ) : (
      <ErrorBanner message={product.error} />
    )
  }
  if (!product.data) notFound()
  if (!categories.ok) return <ErrorBanner message={categories.error} />
  if (!brands.ok) return <ErrorBanner message={brands.error} />

  return (
    <Panel className="p-5">
      <h2 className="mb-4 font-[family-name:var(--font-display)] text-xl font-bold">
        Editar produto
      </h2>
      <ProductForm
        product={product.data}
        categories={categories.data}
        brands={brands.data}
      />
    </Panel>
  )
}
