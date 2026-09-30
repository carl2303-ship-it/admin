import { redirect } from 'next/navigation'
import { requireBoostModule, canWriteBoost, staffRole } from '@/lib/boost/auth'
import { getOrderDetail, listOrders } from '@/lib/boost/queries'
import { deleteOrder } from '@/lib/boost/actions'
import { ActionButton } from '@/components/boost/action-buttons'
import { OrderStatusSelect } from '@/components/boost/order-status-select'
import { DigitalEmailPreviewButton } from '@/components/boost/digital-email-preview'
import {
  ConfigBanner,
  ErrorBanner,
  Panel,
  TableShell,
  Th,
  Td,
} from '@/components/boost/ui'

export default async function BoostOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ detail?: string }>
}) {
  const { detail } = await searchParams
  const auth = await requireBoostModule()
  if (!auth.user) redirect('/login')
  if (auth.error && !auth.isBootstrap) {
    return <ErrorBanner message={auth.error} />
  }
  const write = canWriteBoost(staffRole(auth.staff, auth.isBootstrap))
  const result = await listOrders()

  if (!result.ok && result.missingConfig) {
    return <ConfigBanner message={result.error} />
  }
  if (!result.ok) return <ErrorBanner message={result.error} />

  const detailResult = detail ? await getOrderDetail(detail) : null

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-[family-name:var(--font-display)] text-xl font-bold">
          Pedidos
        </h2>
        {write && <DigitalEmailPreviewButton />}
      </div>
      <Panel>
        <TableShell>
          <thead>
            <tr>
              <Th>Data</Th>
              <Th>Cliente</Th>
              <Th>Total</Th>
              <Th>Estado</Th>
              <Th>Acções</Th>
            </tr>
          </thead>
          <tbody>
            {result.data.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-8 text-center text-zinc-500"
                >
                  Nenhum pedido
                </td>
              </tr>
            )}
            {result.data.map((o) => (
              <tr key={o.id} className="hover:bg-zinc-50/80">
                <Td className="whitespace-nowrap text-xs text-zinc-500">
                  {new Date(o.created_at).toLocaleString('pt-PT')}
                </Td>
                <Td>
                  <p className="font-semibold">{o.customer_name || '—'}</p>
                  <p className="text-xs text-zinc-400">{o.customer_email}</p>
                </Td>
                <Td className="font-bold">
                  €{Number(o.total ?? 0).toFixed(2)}
                </Td>
                <Td>
                  {write ? (
                    <OrderStatusSelect orderId={o.id} status={o.status} />
                  ) : (
                    o.status
                  )}
                </Td>
                <Td>
                  <div className="flex flex-wrap gap-2">
                    <a
                      href={`/produtos/boost/pedidos?detail=${o.id}`}
                      className="text-xs font-bold text-sky-700 hover:underline"
                    >
                      Detalhe
                    </a>
                    {write && (
                      <ActionButton
                        label="Eliminar"
                        variant="danger"
                        confirm="Eliminar este pedido?"
                        action={deleteOrder.bind(null, o.id)}
                      />
                    )}
                  </div>
                </Td>
              </tr>
            ))}
          </tbody>
        </TableShell>
      </Panel>

      {detail && detailResult?.ok && detailResult.data && (
        <Panel className="p-5">
          <h3 className="font-bold">
            Detalhe · {detailResult.data.order.customer_name}
          </h3>
          <p className="mt-1 text-xs text-zinc-500">
            {detailResult.data.order.shipping_address || 'Sem morada'}
          </p>
          <ul className="mt-3 space-y-1 text-sm">
            {detailResult.data.items.map((item) => {
              const unit =
                item.price ??
                (item as { product_price?: number }).product_price ??
                0
              return (
                <li key={item.id} className="flex justify-between gap-4">
                  <span>
                    {item.quantity}× {item.product_name || item.product_id}
                  </span>
                  <span className="font-semibold">
                    €{Number(unit).toFixed(2)}
                  </span>
                </li>
              )
            })}
          </ul>
        </Panel>
      )}
    </div>
  )
}
