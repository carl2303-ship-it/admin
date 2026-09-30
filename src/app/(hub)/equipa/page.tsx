import { redirect } from 'next/navigation'
import { requireHubStaff } from '@/lib/auth/hub-auth'
import { HUB_ROLES, roleLabel, type HubRole } from '@/lib/auth/roles'
import {
  bootstrapSelfAsOwner,
  createHubStaffMember,
  listHubStaff,
  toggleHubStaffActive,
  updateHubStaffMember,
} from '@/lib/hub/staff-actions'
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
  btnPrimary,
  fieldClass,
} from '@/components/boost/ui'

export default async function EquipaPage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string }>
}) {
  const { edit } = await searchParams
  const auth = await requireHubStaff()
  if (!auth.user) redirect('/login')
  if (auth.error && !auth.isBootstrap) {
    return <ErrorBanner message={auth.error} />
  }

  const isOwner = auth.isBootstrap || auth.staff?.role === 'owner'
  const list = await listHubStaff()

  if (!list.ok && list.missingConfig) {
    return <ConfigBanner message={list.error} />
  }
  if (!list.ok) return <ErrorBanner message={list.error} />

  const editing = edit
    ? list.data.find((s) => s.id === edit) || null
    : null

  return (
    <div className="mx-auto max-w-5xl space-y-5 animate-fade-up">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-600">
          Hub · Contas
        </p>
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight">
          Equipa (hub_staff)
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-zinc-500">
          Contas da equipa global em Auth SportsEvents + tabela{' '}
          <code>hub_staff</code>. O admin Boost antigo não tinha gestão de
          staff — isto é o controlo de acessos do hub.
        </p>
      </div>

      {auth.isBootstrap && (
        <Panel className="p-5">
          <p className="font-semibold text-amber-900">
            Bootstrap: ainda não há hub_staff
          </p>
          <p className="mt-1 text-sm text-zinc-600">
            Regista a tua conta actual ({auth.user.email}) como owner.
          </p>
          <form
            action={async (fd) => {
              'use server'
              await bootstrapSelfAsOwner(fd)
            }}
            className="mt-4 flex flex-wrap gap-2"
          >
            <input
              name="full_name"
              placeholder="Nome"
              className={fieldClass + ' max-w-xs'}
            />
            <button type="submit" className={btnPrimary}>
              Tornar-me owner
            </button>
          </form>
        </Panel>
      )}

      {isOwner && !auth.isBootstrap && (
        <>
          <SimpleEntityForm
            title="Nova conta hub"
            onCancelHref="/equipa"
            action={createHubStaffMember}
            fields={[
              { name: 'email', label: 'Email', required: true },
              {
                name: 'password',
                label: 'Password temporária',
                required: true,
              },
              { name: 'full_name', label: 'Nome' },
              {
                name: 'role',
                label: `Role (${HUB_ROLES.join(', ')})`,
                defaultValue: 'readonly',
              },
              {
                name: 'boost_user_id',
                label: 'boost_user_id (UUID opcional)',
              },
              {
                name: 'padel1_user_id',
                label: 'padel1_user_id (UUID opcional)',
              },
            ]}
          />
          {editing && (
            <SimpleEntityForm
              title={`Editar · ${editing.email}`}
              onCancelHref="/equipa"
              action={updateHubStaffMember}
              hidden={{ id: editing.id }}
              fields={[
                {
                  name: 'full_name',
                  label: 'Nome',
                  defaultValue: editing.full_name || '',
                },
                {
                  name: 'role',
                  label: 'Role',
                  defaultValue: editing.role,
                },
                {
                  name: 'boost_user_id',
                  label: 'boost_user_id',
                  defaultValue: editing.boost_user_id || '',
                },
                {
                  name: 'padel1_user_id',
                  label: 'padel1_user_id',
                  defaultValue: editing.padel1_user_id || '',
                },
                {
                  name: 'active',
                  label: 'Activo',
                  type: 'checkbox',
                  defaultValue: editing.active,
                },
              ]}
            />
          )}
        </>
      )}

      <Panel>
        <TableShell>
          <thead>
            <tr>
              <Th>Email</Th>
              <Th>Nome</Th>
              <Th>Role</Th>
              <Th>Estado</Th>
              <Th>Bridge IDs</Th>
              <Th>Acções</Th>
            </tr>
          </thead>
          <tbody>
            {list.data.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-zinc-500">
                  Sem staff
                </td>
              </tr>
            )}
            {list.data.map((s) => (
              <tr key={s.id}>
                <Td className="font-semibold">{s.email}</Td>
                <Td>{s.full_name || '—'}</Td>
                <Td>
                  {roleLabel(s.role as HubRole) || s.role}
                </Td>
                <Td>
                  <StatusPill active={s.active} />
                </Td>
                <Td className="font-mono text-[10px] text-zinc-400">
                  <div>B: {s.boost_user_id || '—'}</div>
                  <div>P1: {s.padel1_user_id || '—'}</div>
                </Td>
                <Td>
                  {isOwner && !auth.isBootstrap && (
                    <div className="flex flex-wrap gap-2">
                      <a
                        href={`/equipa?edit=${s.id}`}
                        className="text-xs font-bold text-sky-700 hover:underline"
                      >
                        Editar
                      </a>
                      <ActionButton
                        label={s.active ? 'Desactivar' : 'Activar'}
                        variant="ghost"
                        confirm={
                          s.active
                            ? `Desactivar ${s.email}?`
                            : `Activar ${s.email}?`
                        }
                        action={toggleHubStaffActive.bind(null, s.id)}
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
