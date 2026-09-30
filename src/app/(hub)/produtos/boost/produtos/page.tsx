import Link from 'next/link'
import { redirect } from 'next/navigation'
import { requireBoostModule, canWriteBoost, staffRole } from '@/lib/boost/auth'
import { listProducts } from '@/lib/boost/queries'
import {
  deleteProduct,
  duplicateProduct,
  quickUpdateProduct,
} from '@/lib/boost/actions'
import { ActionButton } from '@/components/boost/action-buttons'
import {
  ConfigBanner,
  ErrorBanner,
  Panel,
  StatusPill,
  TableShell,
  Th,
  Td,
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
        <TableShell>
          <thead>
            <tr>
              <Th>Produto</Th>
              <Th>Categoria</Th>
              <Th>Preço</Th>
              <Th>Stock</Th>
              <Th>Estado</Th>
              <Th>Acções</Th>
            </tr>
          </thead>
          <tbody>
            {result.data.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="border-b border-zinc-50 px-4 py-8 text-center text-zinc-500"
                >
                  Nenhum produto
                </td>
              </tr>
            )}
            {result.data.map((p) => (
              <tr key={p.id} className="hover:bg-zinc-50/80">
                <Td>
                  <div className="flex items-center gap-3">
                    {p.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={p.image_url}
                        alt=""
                        className="h-10 w-10 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-lg bg-zinc-100" />
                    )}
                    <div>
                      <p className="font-semibold">{p.name}</p>
                      <p className="text-xs text-zinc-400">{p.slug}</p>
                    </div>
                  </div>
                </Td>
                <Td>{p.category?.name || '—'}</Td>
                <Td className="font-bold text-sky-700">
                  €{Number(p.price).toFixed(2)}
                </Td>
                <Td>{p.stock ?? 0}</Td>
                <Td>
                  <div className="flex flex-col gap-1">
                    <StatusPill active={p.active} />
                    {p.is_featured && (
                      <span className="text-[10px] font-bold text-amber-700">
                        ★ destaque
                      </span>
                    )}
                  </div>
                </Td>
                <Td>
                  <div className="flex flex-wrap gap-1.5">
                    {write && (
                      <>
                        <Link
                          href={`/produtos/boost/produtos/${p.id}`}
                          className="text-xs font-bold text-sky-700 hover:underline"
                        >
                          Editar
                        </Link>
                        <ActionButton
                          label={p.is_featured ? '★' : '☆'}
                          action={() =>
                            quickUpdateProduct(p.id, 'is_featured', !p.is_featured)
                          }
                        />
                        <ActionButton
                          label="Duplicar"
                          action={() => duplicateProduct(p.id)}
                        />
                        <ActionButton
                          label="Eliminar"
                          variant="danger"
                          confirm={`Eliminar "${p.name}"?`}
                          action={() => deleteProduct(p.id)}
                        />
                      </>
                    )}
                  </div>
                </Td>
              </tr>
            ))}
          </tbody>
        </TableShell>
      </Panel>
    </div>
  )
}
