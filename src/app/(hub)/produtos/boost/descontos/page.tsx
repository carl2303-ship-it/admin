import { redirect } from 'next/navigation'
import { requireBoostModule, canWriteBoost, staffRole } from '@/lib/boost/auth'
import { listDiscounts, listProducts } from '@/lib/boost/queries'
import { deleteDiscount } from '@/lib/boost/actions'
import { ActionButton } from '@/components/boost/action-buttons'
import { DiscountForm } from '@/components/boost/discount-form'
import {
  ConfigBanner,
  ErrorBanner,
  Panel,
  StatusPill,
  TableShell,
  Th,
  Td,
} from '@/components/boost/ui'

function appliesLabel(d: {
  applies_to: string
  category: string | null
  product_ids: string[] | null
}) {
  if (d.applies_to === 'all') return 'Todo o site'
  if (d.applies_to === 'category') return `Categoria: ${d.category || '—'}`
  const n = Array.isArray(d.product_ids) ? d.product_ids.length : 0
  return `Produtos específicos (${n})`
}

export default async function BoostDiscountsPage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string }>
}) {
  const { edit } = await searchParams
  const auth = await requireBoostModule()
  if (!auth.user) redirect('/login')
  if (auth.error && !auth.isBootstrap) {
    return <ErrorBanner message={auth.error} />
  }
  const write = canWriteBoost(staffRole(auth.staff, auth.isBootstrap))
  const [result, productsResult] = await Promise.all([
    listDiscounts(),
    listProducts(),
  ])

  if (!result.ok && result.missingConfig) {
    return <ConfigBanner message={result.error} />
  }
  if (!result.ok) return <ErrorBanner message={result.error} />

  const products = productsResult.ok
    ? productsResult.data.map((p) => ({
        id: p.id,
        name: p.name,
        active: p.active,
      }))
    : []

  const editing = edit
    ? result.data.find((d) => d.id === edit) || null
    : null

  return (
    <div className="space-y-4">
      <h2 className="font-[family-name:var(--font-display)] text-xl font-bold">
        Descontos
      </h2>
      {write && <DiscountForm discount={editing} products={products} />}
      <Panel>
        <TableShell>
          <thead>
            <tr>
              <Th>Código</Th>
              <Th>Valor</Th>
              <Th>Âmbito</Th>
              <Th>Usos</Th>
              <Th>Estado</Th>
              <Th>Acções</Th>
            </tr>
          </thead>
          <tbody>
            {result.data.map((d) => (
              <tr key={d.id}>
                <Td className="font-bold text-sky-700">{d.code}</Td>
                <Td>
                  {d.type === 'percentage'
                    ? `${d.value}%`
                    : `€${Number(d.value).toFixed(2)}`}
                </Td>
                <Td className="text-xs">{appliesLabel(d)}</Td>
                <Td className="text-xs">
                  {d.used_count}/{d.max_uses ?? '∞'}
                </Td>
                <Td>
                  <StatusPill active={d.active} />
                </Td>
                <Td>
                  {write && (
                    <div className="flex gap-2">
                      <a
                        href={`/produtos/boost/descontos?edit=${d.id}`}
                        className="text-xs font-bold text-sky-700 hover:underline"
                      >
                        Editar
                      </a>
                      <ActionButton
                        label="Eliminar"
                        variant="danger"
                        confirm={`Eliminar ${d.code}?`}
                        action={deleteDiscount.bind(null, d.id)}
                      />
                    </div>
                  )}
                </Td>
              </tr>
            ))}
          </tbody>
        </TableShell>
      </Panel>
    </div>
  )
}
