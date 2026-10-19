'use client'

import { Fragment, useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  assignClubOwner,
  createClub,
  createPlatformCheckout,
  generateLicenseKey,
  loadClubKeysAction,
  removeClubOwner,
  sendCheckoutEmail,
  updateClub,
  updateClubContract,
  updateClubPlan,
  updateClubStatus,
} from '@/lib/padel1/actions'
import type { Padel1Club, Padel1ClubForm, Padel1LicenseKey } from '@/lib/padel1/types'
import { ModuleToggles } from './module-toggles'
import {
  btnDanger,
  btnGhost,
  btnPrimary,
  fieldClass,
  Panel,
  StatusPill,
  TableShell,
  Td,
  Th,
} from './ui'
import { ClubFormFields, ClubDetail } from './clubs-panel-detail'

const emptyForm: Padel1ClubForm = {
  name: '',
  description: '',
  city: '',
  address: '',
  country: 'Portugal',
  phone: '',
  email: '',
  website: '',
  logo_url: '',
  photo_url_1: '',
  photo_url_2: '',
  plan_type: 'bronze',
}

export function ClubsPanel({
  clubs,
  canWrite,
}: {
  clubs: Padel1Club[]
  canWrite: boolean
}) {
  const router = useRouter()
  const [pending, start] = useTransition()
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState<Padel1ClubForm>(emptyForm)
  const [editId, setEditId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<Padel1ClubForm>(emptyForm)
  const [ownerClubId, setOwnerClubId] = useState<string | null>(null)
  const [ownerEmail, setOwnerEmail] = useState('')
  const [ownerPassword, setOwnerPassword] = useState('')
  const [createNewOwner, setCreateNewOwner] = useState(false)
  const [keys, setKeys] = useState<Record<string, Padel1LicenseKey[]>>({})
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return clubs.filter((c) => {
      if (filterStatus !== 'all' && c.status !== filterStatus) return false
      if (!q) return true
      return (
        c.name.toLowerCase().includes(q) ||
        (c.city || '').toLowerCase().includes(q) ||
        (c.email || '').toLowerCase().includes(q)
      )
    })
  }, [clubs, search, filterStatus])

  const run = (fn: () => Promise<{ ok: boolean; error?: string; message?: string; data?: Record<string, unknown> }>) => {
    start(async () => {
      const r = await fn()
      if (!r.ok) window.alert(r.error || 'Erro')
      else if (r.message) window.alert(r.message)
      if (r.ok && r.data?.url) setCheckoutUrl(String(r.data.url))
      if (r.ok && r.data?.license_key) {
        /* message already alerted */
      }
      router.refresh()
    })
  }

  const expand = (club: Padel1Club) => {
    if (expanded === club.id) {
      setExpanded(null)
      return
    }
    setExpanded(club.id)
    start(async () => {
      const res = await loadClubKeysAction(club.id)
      if (res.ok) setKeys((prev) => ({ ...prev, [club.id]: res.data }))
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <input
          className={`${fieldClass} max-w-xs`}
          placeholder="Pesquisar clube…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className={`${fieldClass} max-w-[160px]`}
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="all">Todos estados</option>
          <option value="active">Activos</option>
          <option value="suspended">Suspensos</option>
        </select>
        {canWrite && (
          <button
            type="button"
            className={btnPrimary}
            onClick={() => {
              setForm(emptyForm)
              setShowCreate(true)
            }}
          >
            Novo clube
          </button>
        )}
      </div>

      {showCreate && canWrite && (
        <Panel className="space-y-3 p-4">
          <p className="font-semibold">Criar clube</p>
          <ClubFormFields form={form} setForm={setForm} />
          <div className="flex gap-2">
            <button
              type="button"
              disabled={pending}
              className={btnPrimary}
              onClick={() =>
                run(async () => {
                  const r = await createClub(form)
                  if (r.ok) setShowCreate(false)
                  return r
                })
              }
            >
              Guardar
            </button>
            <button
              type="button"
              className={btnGhost}
              onClick={() => setShowCreate(false)}
            >
              Cancelar
            </button>
          </div>
        </Panel>
      )}

      <Panel>
        <TableShell>
          <thead>
            <tr>
              <Th>Clube</Th>
              <Th>Cidade</Th>
              <Th>Estado</Th>
              <Th>Plano</Th>
              <Th>Tipo</Th>
              <Th>Acções</Th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((club) => (
              <Fragment key={club.id}>
                <tr>
                  <Td>
                    <button
                      type="button"
                      className="flex items-center gap-2 text-left font-semibold text-violet-700 hover:underline"
                      onClick={() => expand(club)}
                    >
                      {club.logo_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={club.logo_url}
                          alt=""
                          className="h-8 w-8 shrink-0 rounded-lg object-cover"
                        />
                      ) : (
                        <span
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-200 text-[10px] text-slate-400"
                          aria-hidden
                        >
                          —
                        </span>
                      )}
                      {club.name}
                    </button>
                  </Td>
                  <Td>{club.city || '—'}</Td>
                  <Td>
                    <StatusPill
                      active={club.status === 'active'}
                      activeLabel="Activo"
                      inactiveLabel={club.status}
                    />
                  </Td>
                  <Td>
                    {canWrite ? (
                      <select
                        className={`${fieldClass} max-w-[110px]`}
                        value={club.plan_type || 'bronze'}
                        disabled={pending}
                        onChange={(e) =>
                          run(() => updateClubPlan(club.id, e.target.value))
                        }
                      >
                        <option value="bronze">bronze</option>
                        <option value="silver">silver</option>
                        <option value="gold">gold</option>
                      </select>
                    ) : (
                      club.plan_type
                    )}
                  </Td>
                  <Td>{club.is_managed ? 'Associado' : 'Ficha'}</Td>
                  <Td>
                    <div className="flex flex-wrap gap-1">
                      {canWrite && (
                        <button
                          type="button"
                          className={btnGhost}
                          disabled={pending}
                          onClick={() =>
                            run(() =>
                              updateClubStatus(
                                club.id,
                                club.status === 'active'
                                  ? 'suspended'
                                  : 'active'
                              )
                            )
                          }
                        >
                          {club.status === 'active' ? 'Suspender' : 'Activar'}
                        </button>
                      )}
                      <button
                        type="button"
                        className={btnGhost}
                        onClick={() => expand(club)}
                      >
                        {expanded === club.id ? 'Fechar' : 'Detalhe'}
                      </button>
                    </div>
                  </Td>
                </tr>
                {expanded === club.id && (
                  <tr>
                    <Td colSpan={6} className="bg-slate-900/80">
                      <ClubDetail
                        club={club}
                        canWrite={canWrite}
                        pending={pending}
                        keys={keys[club.id] || []}
                        editId={editId}
                        editForm={editForm}
                        setEditId={setEditId}
                        setEditForm={setEditForm}
                        ownerClubId={ownerClubId}
                        setOwnerClubId={setOwnerClubId}
                        ownerEmail={ownerEmail}
                        setOwnerEmail={setOwnerEmail}
                        ownerPassword={ownerPassword}
                        setOwnerPassword={setOwnerPassword}
                        createNewOwner={createNewOwner}
                        setCreateNewOwner={setCreateNewOwner}
                        checkoutUrl={checkoutUrl}
                        setCheckoutUrl={setCheckoutUrl}
                        run={run}
                      />
                    </Td>
                  </tr>
                )}
              </Fragment>
            ))}
            {filtered.length === 0 && (
              <tr>
                <Td colSpan={6} className="text-slate-400">
                  Nenhum clube.
                </Td>
              </tr>
            )}
          </tbody>
        </TableShell>
      </Panel>
    </div>
  )
}
