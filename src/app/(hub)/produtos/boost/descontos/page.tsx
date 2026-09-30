import { redirect } from 'next/navigation'
import { requireBoostModule, canWriteBoost, staffRole } from '@/lib/boost/auth'
import { listDiscounts } from '@/lib/boost/queries'
import { deleteDiscount, saveDiscount } from '@/lib/boost/actions'
import { ActionButton } from '@/components/boost/action-buttons'
import { SimpleEntityForm } from '@/components/boost/simple-entity-form'
import {
  ConfigBanner,
  ErrorBanner,
  Panel,
  StatusPill,
  TableShell,
  Th,
  Td,
} from '@/components/boost/ui'

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
  const result = await listDiscounts()

  if (!result.ok && result.missingConfig) {
    return <ConfigBanner message={result.error} />
  }
  if (!result.ok) return <ErrorBanner message={result.error} />

  const editing = edit
    ? result.data.find((d) => d.id === edit) || null
    : null

  return (
    <div className="space-y-4">
      <h2 className="font-[family-name:var(--font-display)] text-xl font-bold">
        Descontos
      </h2>
      {write && (
        <SimpleEntityForm
          title={editing ? 'Editar código' : 'Novo código'}
          onCancelHref="/produtos/boost/descontos"
          action={saveDiscount}
          hidden={{
            ...(editing ? { id: editing.id } : {}),
            applies_to: editing?.applies_to || 'all',
            type: editing?.type || 'percentage',
          }}
          fields={[
            {
              name: 'code',
              label: 'Código',
              required: true,
              defaultValue: editing?.code,
            },
            {
              name: 'description',
              label: 'Descrição',
              defaultValue: editing?.description || '',
            },
            {
              name: 'value',
              label: 'Valor (% ou €)',
              type: 'number',
              required: true,
              defaultValue: editing?.value ?? 10,
            },
            {
              name: 'min_purchase',
              label: 'Mín. compra',
              type: 'number',
              defaultValue: editing?.min_purchase ?? 0,
            },
            {
              name: 'max_uses',
              label: 'Máx. usos',
              type: 'number',
              defaultValue: editing?.max_uses ?? '',
            },
            {
              name: 'active',
              label: 'Ativo',
              type: 'checkbox',
              defaultValue: editing?.active ?? true,
            },
          ]}
        />
      )}
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
                <Td className="text-xs">{d.applies_to}</Td>
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
                        action={() => deleteDiscount(d.id)}
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
