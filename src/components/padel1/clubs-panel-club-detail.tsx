'use client'

import { useState } from 'react'
import {
  assignClubOwner,
  createPlatformCheckout,
  generateLicenseKey,
  removeClubOwner,
  sendCheckoutEmail,
  updateClub,
  updateClubContract,
} from '@/lib/padel1/actions'
import type { Padel1Club, Padel1ClubForm, Padel1LicenseKey } from '@/lib/padel1/types'
import { ModuleToggles } from './module-toggles'
import { ClubFormFields } from './clubs-panel-detail'
import {
  btnDanger,
  btnGhost,
  btnPrimary,
  fieldClass,
} from './ui'

function clubToForm(c: Padel1Club): Padel1ClubForm {
  return {
    name: c.name || '',
    description: c.description || '',
    city: c.city || '',
    address: c.address || '',
    country: c.country || 'Portugal',
    phone: c.phone || '',
    email: c.email || '',
    website: c.website || '',
    logo_url: c.logo_url || '',
    photo_url_1: c.photo_url_1 || '',
    photo_url_2: c.photo_url_2 || '',
    plan_type: c.plan_type || 'bronze',
  }
}

export function ClubDetail({
  club,
  canWrite,
  pending,
  keys,
  editId,
  editForm,
  setEditId,
  setEditForm,
  ownerClubId,
  setOwnerClubId,
  ownerEmail,
  setOwnerEmail,
  ownerPassword,
  setOwnerPassword,
  createNewOwner,
  setCreateNewOwner,
  checkoutUrl,
  setCheckoutUrl,
  run,
}: {
  club: Padel1Club
  canWrite: boolean
  pending: boolean
  keys: Padel1LicenseKey[]
  editId: string | null
  editForm: Padel1ClubForm
  setEditId: (id: string | null) => void
  setEditForm: (f: Padel1ClubForm) => void
  ownerClubId: string | null
  setOwnerClubId: (id: string | null) => void
  ownerEmail: string
  setOwnerEmail: (v: string) => void
  ownerPassword: string
  setOwnerPassword: (v: string) => void
  createNewOwner: boolean
  setCreateNewOwner: (v: boolean) => void
  checkoutUrl: string | null
  setCheckoutUrl: (v: string | null) => void
  run: (
    fn: () => Promise<{
      ok: boolean
      error?: string
      message?: string
      data?: Record<string, unknown>
    }>
  ) => void
}) {
  const [contractStart, setContractStart] = useState(
    club.contract_start?.slice(0, 10) || ''
  )
  const [contractExpires, setContractExpires] = useState(
    club.contract_expires_at?.slice(0, 10) || ''
  )
  const [planName, setPlanName] = useState('Bronze')
  const [duration, setDuration] = useState(12)
  const [billing, setBilling] = useState<'month' | 'year'>('year')

  return (
    <div className="space-y-4 py-2 text-sm">
      <div className="grid gap-2 sm:grid-cols-3">
        <p>
          <span className="text-zinc-500">Email:</span> {club.email || '—'}
        </p>
        <p>
          <span className="text-zinc-500">Telefone:</span> {club.phone || '—'}
        </p>
        <p>
          <span className="text-zinc-500">Owner:</span>{' '}
          {club.owner_id ? `${club.owner_id.slice(0, 8)}…` : '—'}
        </p>
        <p>
          <span className="text-zinc-500">Contrato:</span>{' '}
          {club.contract_expires_at
            ? new Date(club.contract_expires_at).toLocaleDateString('pt-PT')
            : '—'}
        </p>
        <p>
          <span className="text-zinc-500">Website:</span> {club.website || '—'}
        </p>
      </div>

      {canWrite && (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className={btnGhost}
            onClick={() => {
              setEditId(club.id)
              setEditForm(clubToForm(club))
            }}
          >
            Editar
          </button>
          <button
            type="button"
            className={btnGhost}
            onClick={() => {
              setOwnerClubId(club.id)
              setOwnerEmail(club.email || '')
              setOwnerPassword('')
              setCreateNewOwner(false)
            }}
          >
            Atribuir owner
          </button>
          {club.owner_id && (
            <button
              type="button"
              className={btnDanger}
              disabled={pending}
              onClick={() =>
                run(async () => {
                  if (!window.confirm('Remover owner deste clube?')) {
                    return { ok: true }
                  }
                  return removeClubOwner(club.id)
                })
              }
            >
              Remover owner
            </button>
          )}
        </div>
      )}

      {editId === club.id && canWrite && (
        <div className="space-y-2 rounded-xl border border-zinc-200 bg-white p-3">
          <ClubFormFields form={editForm} setForm={setEditForm} />
          <div className="flex gap-2">
            <button
              type="button"
              className={btnPrimary}
              disabled={pending}
              onClick={() =>
                run(async () => {
                  const r = await updateClub(club.id, editForm)
                  if (r.ok) setEditId(null)
                  return r
                })
              }
            >
              Guardar edição
            </button>
            <button
              type="button"
              className={btnGhost}
              onClick={() => setEditId(null)}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {ownerClubId === club.id && canWrite && (
        <div className="space-y-2 rounded-xl border border-zinc-200 bg-white p-3">
          <p className="font-semibold">Atribuir owner</p>
          <input
            className={fieldClass}
            placeholder="Email"
            value={ownerEmail}
            onChange={(e) => setOwnerEmail(e.target.value)}
          />
          <label className="flex items-center gap-2 text-xs">
            <input
              type="checkbox"
              checked={createNewOwner}
              onChange={(e) => setCreateNewOwner(e.target.checked)}
            />
            Criar conta nova
          </label>
          {createNewOwner && (
            <input
              className={fieldClass}
              type="password"
              placeholder="Password"
              value={ownerPassword}
              onChange={(e) => setOwnerPassword(e.target.value)}
            />
          )}
          <div className="flex gap-2">
            <button
              type="button"
              className={btnPrimary}
              disabled={pending}
              onClick={() =>
                run(async () => {
                  const r = await assignClubOwner({
                    clubId: club.id,
                    email: ownerEmail,
                    password: ownerPassword,
                    createNew: createNewOwner,
                  })
                  if (r.ok) setOwnerClubId(null)
                  return r
                })
              }
            >
              Confirmar
            </button>
            <button
              type="button"
              className={btnGhost}
              onClick={() => setOwnerClubId(null)}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {canWrite && (
        <div className="grid gap-2 rounded-xl border border-zinc-200 bg-white p-3 sm:grid-cols-4">
          <label className="text-xs font-semibold">
            Início contrato
            <input
              type="date"
              className={`${fieldClass} mt-1`}
              value={contractStart}
              onChange={(e) => setContractStart(e.target.value)}
            />
          </label>
          <label className="text-xs font-semibold">
            Expira
            <input
              type="date"
              className={`${fieldClass} mt-1`}
              value={contractExpires}
              onChange={(e) => setContractExpires(e.target.value)}
            />
          </label>
          <div className="flex items-end">
            <button
              type="button"
              className={btnGhost}
              disabled={pending}
              onClick={() =>
                run(() =>
                  updateClubContract(
                    club.id,
                    contractStart || null,
                    contractExpires || null
                  )
                )
              }
            >
              Guardar contrato
            </button>
          </div>
        </div>
      )}

      {canWrite && (
        <div className="space-y-2 rounded-xl border border-zinc-200 bg-white p-3">
          <p className="font-semibold">Licença / checkout</p>
          <div className="flex flex-wrap gap-2">
            <select
              className={`${fieldClass} max-w-[140px]`}
              value={planName}
              onChange={(e) => setPlanName(e.target.value)}
            >
              <option>Bronze</option>
              <option>Silver</option>
              <option>Gold</option>
            </select>
            <input
              type="number"
              className={`${fieldClass} max-w-[100px]`}
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value) || 12)}
            />
            <select
              className={`${fieldClass} max-w-[120px]`}
              value={billing}
              onChange={(e) =>
                setBilling(e.target.value as 'month' | 'year')
              }
            >
              <option value="year">Anual</option>
              <option value="month">Mensal</option>
            </select>
            <button
              type="button"
              className={btnGhost}
              disabled={pending}
              onClick={() =>
                run(() =>
                  generateLicenseKey({
                    clubId: club.id,
                    ownerId: club.owner_id,
                    planName,
                    durationMonths: duration,
                  })
                )
              }
            >
              Gerar chave
            </button>
            <button
              type="button"
              className={btnPrimary}
              disabled={pending || !club.email}
              onClick={() =>
                run(async () => {
                  const r = await createPlatformCheckout({
                    clubId: club.id,
                    planName,
                    durationMonths: duration,
                    billingInterval: billing,
                    payerEmail: club.email || '',
                  })
                  return r
                })
              }
            >
              Checkout Stripe
            </button>
            {checkoutUrl && (
              <button
                type="button"
                className={btnGhost}
                disabled={pending || !club.email}
                onClick={() =>
                  run(() =>
                    sendCheckoutEmail({
                      toEmail: club.email || '',
                      toName: club.name,
                      checkoutUrl,
                      planName,
                    })
                  )
                }
              >
                Enviar email checkout
              </button>
            )}
          </div>
          {checkoutUrl && (
            <p className="break-all text-xs text-violet-700">{checkoutUrl}</p>
          )}
          {keys.length > 0 && (
            <ul className="space-y-1 text-xs text-zinc-600">
              {keys.map((k) => (
                <li key={k.id}>
                  <code>{k.license_key}</code> · {k.plan_name} · {k.status}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <ModuleToggles
        entityType="club"
        entityId={club.id}
        entityName={club.name}
        canWrite={canWrite}
      />
    </div>
  )
}
