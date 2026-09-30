import { redirect } from 'next/navigation'
import { requireBoostModule, canWriteBoost, staffRole } from '@/lib/boost/auth'
import { listEbookPurchases } from '@/lib/boost/queries'
import { deleteEbookPurchase } from '@/lib/boost/actions'
import { ActionButton } from '@/components/boost/action-buttons'
import { ExportButton } from '@/components/boost/export-button'
import {
  ConfigBanner,
  ErrorBanner,
  Panel,
  TableShell,
  Th,
  Td,
} from '@/components/boost/ui'

export default async function BoostEbookPurchasesPage() {
  const auth = await requireBoostModule()
  if (!auth.user) redirect('/login')
  if (auth.error && !auth.isBootstrap) {
    return <ErrorBanner message={auth.error} />
  }
  const write = canWriteBoost(staffRole(auth.staff, auth.isBootstrap))
  const result = await listEbookPurchases()

  if (!result.ok && result.missingConfig) {
    return <ConfigBanner message={result.error} />
  }
  if (!result.ok) return <ErrorBanner message={result.error} />

  const purchases = result.data
  const revenue = purchases.reduce((s, p) => s + Number(p.amount || 0), 0)
  const kpis = {
    total: purchases.length,
    ebook: purchases.filter((p) => p.product_type === 'ebook').length,
    upsell: purchases.filter((p) => p.product_type === 'upsell').length,
    revenue,
  }

  const csv = [
    ['Cliente', 'Email', 'Produto', 'Valor', 'Estado', 'Data', 'Session ID'].join(
      ','
    ),
    ...purchases.map((p) =>
      [
        p.customer_name || '',
        p.customer_email || '',
        p.product_type || '',
        Number(p.amount || 0).toFixed(2),
        p.status || '',
        new Date(p.created_at).toLocaleString('pt-PT'),
        p.stripe_session_id || '',
      ].join(',')
    ),
  ].join('\n')

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-[family-name:var(--font-display)] text-xl font-bold">
          Compras Ebook
        </h2>
        <ExportButton
          label="Exportar CSV"
          filename={`ebook-purchases-${new Date().toISOString().slice(0, 10)}.csv`}
          content={csv}
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ['Total vendas', String(kpis.total)],
          ['Ebook base', String(kpis.ebook)],
          ['Upsell', String(kpis.upsell)],
          ['Receita', `€${kpis.revenue.toFixed(2)}`],
        ].map(([label, value]) => (
          <Panel key={label} className="p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-zinc-500">
              {label}
            </p>
            <p className="mt-1 font-[family-name:var(--font-display)] text-2xl font-bold">
              {value}
            </p>
          </Panel>
        ))}
      </div>
      <Panel>
        <TableShell>
          <thead>
            <tr>
              <Th>Cliente</Th>
              <Th>Produto</Th>
              <Th>Valor</Th>
              <Th>Estado</Th>
              <Th>Data</Th>
              <Th>Stripe session</Th>
              <Th>Acções</Th>
            </tr>
          </thead>
          <tbody>
            {purchases.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-zinc-500">
                  Sem compras
                </td>
              </tr>
            )}
            {purchases.map((p) => (
              <tr key={p.id}>
                <Td>
                  <p className="font-semibold">{p.customer_name || '—'}</p>
                  <p className="text-xs text-zinc-400">{p.customer_email}</p>
                </Td>
                <Td>
                  <span className="rounded-full bg-sky-100 px-2.5 py-0.5 text-xs font-bold text-sky-800">
                    {p.product_type || '—'}
                  </span>
                </Td>
                <Td className="font-bold">
                  €{Number(p.amount || 0).toFixed(2)}
                </Td>
                <Td>{p.status}</Td>
                <Td className="text-xs text-zinc-500">
                  {new Date(p.created_at).toLocaleString('pt-PT')}
                </Td>
                <Td className="max-w-[8rem] truncate font-mono text-[10px] text-zinc-400">
                  {p.stripe_session_id || '—'}
                </Td>
                <Td>
                  {write && (
                    <ActionButton
                      label="Eliminar"
                      variant="danger"
                      confirm="Eliminar esta compra?"
                      action={deleteEbookPurchase.bind(null, p.id)}
                    />
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
