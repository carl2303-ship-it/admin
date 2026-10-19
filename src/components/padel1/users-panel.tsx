'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { addSuperAdmin, removeSuperAdmin } from '@/lib/padel1/actions'
import type { Padel1CombinedUser, Padel1SuperAdmin } from '@/lib/padel1/types'
import {
  btnDanger,
  btnGhost,
  btnPrimary,
  fieldClass,
  Panel,
  TableShell,
  Td,
  Th,
} from './ui'

const ROLE_LABEL: Record<Padel1CombinedUser['role'], string> = {
  player: 'Jogador',
  manager: 'Manager',
  organizer: 'Organizer',
  super_admin: 'Super Admin',
}

export function UsersPanel({
  users,
  superAdmins,
  canWrite,
}: {
  users: Padel1CombinedUser[]
  superAdmins: Padel1SuperAdmin[]
  canWrite: boolean
}) {
  const router = useRouter()
  const [pending, start] = useTransition()
  const [search, setSearch] = useState('')
  const [role, setRole] = useState('all')
  const [showAdd, setShowAdd] = useState(false)
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [page, setPage] = useState(0)
  const PAGE = 50

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return users.filter((u) => {
      if (role !== 'all' && u.role !== role) return false
      if (!q) return true
      return (
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.phone.includes(q)
      )
    })
  }, [users, search, role])

  const slice = filtered.slice(page * PAGE, page * PAGE + PAGE)

  return (
    <div className="space-y-4">
      <Panel className="space-y-3 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="font-semibold">Super admins ({superAdmins.length})</p>
          {canWrite && (
            <button
              type="button"
              className={btnPrimary}
              onClick={() => setShowAdd((v) => !v)}
            >
              Adicionar
            </button>
          )}
        </div>
        {showAdd && canWrite && (
          <div className="flex flex-wrap gap-2">
            <input
              className={`${fieldClass} max-w-xs`}
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <input
              className={`${fieldClass} max-w-xs`}
              placeholder="Nome"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <button
              type="button"
              className={btnPrimary}
              disabled={pending}
              onClick={() =>
                start(async () => {
                  const r = await addSuperAdmin({ email, name })
                  if (!r.ok) window.alert(r.error)
                  else {
                    setShowAdd(false)
                    setEmail('')
                    setName('')
                    router.refresh()
                  }
                })
              }
            >
              Guardar
            </button>
          </div>
        )}
        <ul className="space-y-1 text-sm">
          {superAdmins.map((sa) => (
            <li
              key={sa.id}
              className="flex items-center justify-between gap-2 rounded-lg border border-zinc-100 px-3 py-2"
            >
              <span>
                <span className="font-semibold">{sa.name}</span>{' '}
                <span className="text-xs text-slate-400">
                  {sa.user_id.slice(0, 8)}…
                </span>
              </span>
              {canWrite && (
                <button
                  type="button"
                  className={btnDanger}
                  disabled={pending}
                  onClick={() =>
                    start(async () => {
                      if (!window.confirm(`Remover ${sa.name}?`)) return
                      const r = await removeSuperAdmin(sa.id)
                      if (!r.ok) window.alert(r.error)
                      router.refresh()
                    })
                  }
                >
                  Remover
                </button>
              )}
            </li>
          ))}
        </ul>
      </Panel>

      <div className="flex flex-wrap gap-2">
        <input
          className={`${fieldClass} max-w-xs`}
          placeholder="Pesquisar…"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setPage(0)
          }}
        />
        <select
          className={`${fieldClass} max-w-[180px]`}
          value={role}
          onChange={(e) => {
            setRole(e.target.value)
            setPage(0)
          }}
        >
          <option value="all">Todos roles</option>
          <option value="player">Jogador</option>
          <option value="manager">Manager</option>
          <option value="organizer">Organizer</option>
          <option value="super_admin">Super Admin</option>
        </select>
      </div>

      <Panel>
        <TableShell>
          <thead>
            <tr>
              <Th>Nome</Th>
              <Th>Contacto</Th>
              <Th>Role</Th>
              <Th>Pontos</Th>
              <Th>Criado</Th>
            </tr>
          </thead>
          <tbody>
            {slice.map((u) => (
              <tr key={u.id}>
                <Td className="font-semibold">{u.name}</Td>
                <Td>
                  <div>{u.email}</div>
                  <div className="text-xs text-slate-400">{u.phone}</div>
                </Td>
                <Td>{ROLE_LABEL[u.role]}</Td>
                <Td>{u.rewardPoints}</Td>
                <Td>
                  {new Date(u.createdAt).toLocaleDateString('pt-PT')}
                </Td>
              </tr>
            ))}
          </tbody>
        </TableShell>
      </Panel>

      <div className="flex gap-2">
        <button
          type="button"
          className={btnGhost}
          disabled={page === 0}
          onClick={() => setPage((p) => Math.max(0, p - 1))}
        >
          Anterior
        </button>
        <span className="self-center text-xs text-slate-400">
          Página {page + 1} / {Math.max(1, Math.ceil(filtered.length / PAGE))}
        </span>
        <button
          type="button"
          className={btnGhost}
          disabled={(page + 1) * PAGE >= filtered.length}
          onClick={() => setPage((p) => p + 1)}
        >
          Seguinte
        </button>
      </div>
    </div>
  )
}
