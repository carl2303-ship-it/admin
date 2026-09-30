import { redirect } from 'next/navigation'
import { requireBoostModule, canWriteBoost, staffRole } from '@/lib/boost/auth'
import { listBrands } from '@/lib/boost/queries'
import { deleteBrand, saveBrand } from '@/lib/boost/actions'
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

export default async function BoostBrandsPage({
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
  const result = await listBrands()

  if (!result.ok && result.missingConfig) {
    return <ConfigBanner message={result.error} />
  }
  if (!result.ok) return <ErrorBanner message={result.error} />

  const editing = edit
    ? result.data.find((b) => b.id === edit) || null
    : null

  return (
    <div className="space-y-4">
      <h2 className="font-[family-name:var(--font-display)] text-xl font-bold">
        Marcas
      </h2>
      {write && (
        <SimpleEntityForm
          title={editing ? 'Editar marca' : 'Nova marca'}
          onCancelHref="/produtos/boost/marcas"
          action={saveBrand}
          hidden={editing ? { id: editing.id } : undefined}
          fields={[
            {
              name: 'name',
              label: 'Nome',
              required: true,
              defaultValue: editing?.name,
            },
            { name: 'slug', label: 'Slug', defaultValue: editing?.slug },
            {
              name: 'logo_url',
              label: 'Logo URL',
              defaultValue: editing?.logo_url || '',
            },
            {
              name: 'display_order',
              label: 'Ordem',
              type: 'number',
              defaultValue: editing?.display_order ?? 0,
            },
            {
              name: 'description',
              label: 'Descrição',
              type: 'textarea',
              defaultValue: editing?.description || '',
            },
            {
              name: 'active',
              label: 'Ativa',
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
              <Th>Nome</Th>
              <Th>Slug</Th>
              <Th>Ordem</Th>
              <Th>Estado</Th>
              <Th>Acções</Th>
            </tr>
          </thead>
          <tbody>
            {result.data.map((b) => (
              <tr key={b.id}>
                <Td className="font-semibold">{b.name}</Td>
                <Td className="font-mono text-xs">{b.slug}</Td>
                <Td>{b.display_order}</Td>
                <Td>
                  <StatusPill active={b.active} activeLabel="Ativa" />
                </Td>
                <Td>
                  {write && (
                    <div className="flex gap-2">
                      <a
                        href={`/produtos/boost/marcas?edit=${b.id}`}
                        className="text-xs font-bold text-sky-700 hover:underline"
                      >
                        Editar
                      </a>
                      <ActionButton
                        label="Eliminar"
                        variant="danger"
                        confirm={`Eliminar "${b.name}"?`}
                        action={() => deleteBrand(b.id)}
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
