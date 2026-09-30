import { redirect } from 'next/navigation'
import { requireBoostModule, canWriteBoost, staffRole } from '@/lib/boost/auth'
import { listCategories } from '@/lib/boost/queries'
import { deleteCategory, saveCategory } from '@/lib/boost/actions'
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

export default async function BoostCategoriesPage({
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
  const result = await listCategories()

  if (!result.ok && result.missingConfig) {
    return <ConfigBanner message={result.error} />
  }
  if (!result.ok) return <ErrorBanner message={result.error} />

  const editing = edit
    ? result.data.find((c) => c.id === edit) || null
    : null

  return (
    <div className="space-y-4">
      <h2 className="font-[family-name:var(--font-display)] text-xl font-bold">
        Categorias
      </h2>
      {write && (
        <SimpleEntityForm
          title={editing ? 'Editar categoria' : 'Nova categoria'}
          onCancelHref="/produtos/boost/categorias"
          action={saveCategory}
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
            {result.data.map((c) => (
              <tr key={c.id}>
                <Td className="font-semibold">{c.name}</Td>
                <Td className="font-mono text-xs">{c.slug}</Td>
                <Td>{c.display_order}</Td>
                <Td>
                  <StatusPill active={c.active} activeLabel="Ativa" />
                </Td>
                <Td>
                  {write && (
                    <div className="flex gap-2">
                      <a
                        href={`/produtos/boost/categorias?edit=${c.id}`}
                        className="text-xs font-bold text-sky-700 hover:underline"
                      >
                        Editar
                      </a>
                      <ActionButton
                        label="Eliminar"
                        variant="danger"
                        confirm={`Eliminar "${c.name}"?`}
                        action={deleteCategory.bind(null, c.id)}
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
