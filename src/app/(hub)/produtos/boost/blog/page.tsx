import { redirect } from 'next/navigation'
import {
  requireBoostModule,
  canWriteBoostContent,
  staffRole,
} from '@/lib/boost/auth'
import { listBlogPosts } from '@/lib/boost/queries'
import { deleteBlogPost } from '@/lib/boost/actions'
import { ActionButton } from '@/components/boost/action-buttons'
import { BlogForm } from '@/components/boost/blog-form'
import {
  ConfigBanner,
  ErrorBanner,
  Panel,
  StatusPill,
  TableShell,
  Th,
  Td,
} from '@/components/boost/ui'

export default async function BoostBlogPage({
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
  const write = canWriteBoostContent(staffRole(auth.staff, auth.isBootstrap))
  const result = await listBlogPosts()

  if (!result.ok && result.missingConfig) {
    return <ConfigBanner message={result.error} />
  }
  if (!result.ok) return <ErrorBanner message={result.error} />

  const editing = edit
    ? result.data.find((p) => p.id === edit) || null
    : null

  return (
    <div className="space-y-4">
      <h2 className="font-[family-name:var(--font-display)] text-xl font-bold">
        Blog
      </h2>
      {write && <BlogForm post={editing} />}
      <Panel>
        <TableShell>
          <thead>
            <tr>
              <Th>Título</Th>
              <Th>Autor</Th>
              <Th>Categoria</Th>
              <Th>Estado</Th>
              <Th>Data</Th>
              <Th>Acções</Th>
            </tr>
          </thead>
          <tbody>
            {result.data.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-zinc-500">
                  Nenhum post
                </td>
              </tr>
            )}
            {result.data.map((p) => (
              <tr key={p.id}>
                <Td className="font-semibold">{p.title}</Td>
                <Td>{p.author}</Td>
                <Td>{p.category || 'geral'}</Td>
                <Td>
                  <StatusPill
                    active={p.published}
                    activeLabel="Publicado"
                    inactiveLabel="Rascunho"
                  />
                </Td>
                <Td className="text-xs text-zinc-500">
                  {new Date(p.created_at).toLocaleDateString('pt-PT')}
                </Td>
                <Td>
                  {write && (
                    <div className="flex gap-2">
                      <a
                        href={`/produtos/boost/blog?edit=${p.id}`}
                        className="text-xs font-bold text-sky-700 hover:underline"
                      >
                        Editar
                      </a>
                      <ActionButton
                        label="Eliminar"
                        variant="danger"
                        confirm={`Eliminar «${p.title}»?`}
                        action={deleteBlogPost.bind(null, p.id)}
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
