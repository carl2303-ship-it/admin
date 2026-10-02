'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import {
  generateSaasPaymentLink,
  saveSaasLicense,
  sendSaasPaymentLinkEmail,
  updateSaasPlan,
} from '@/lib/boost/actions'
import type { BoostOrganization } from '@/lib/boost/types'
import { PLAN_LABELS, PLAN_MAX_TOURNAMENTS } from '@/lib/boost/types'
import {
  formatSaasDate,
  inferBillingPeriod,
  isSaasActiveCard,
  isSaasExpired,
  resolveSaasPlanEnd,
  resolveSaasPlanStart,
} from '@/lib/boost/saas-dates'
import { ActionButton } from './action-buttons'
import { btnPrimary, fieldClass } from './ui'
import {
  deleteSaasLicense,
  resendSaasCredentials,
  toggleSaasStatus,
} from '@/lib/boost/actions'
import { getTourBrandedUrl, getTourLoginUrl } from '@/lib/boost/tour-urls'

export function SaasCreateForm({ canWrite }: { canWrite: boolean }) {
  const router = useRouter()
  const [pending, start] = useTransition()
  const [error, setError] = useState<string | null>(null)

  if (!canWrite) return null

  const today = new Date()
  const end = new Date()
  end.setFullYear(end.getFullYear() + 1)

  return (
    <form
      className="space-y-3 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm"
      action={(fd) => {
        start(async () => {
          setError(null)
          const result = await saveSaasLicense(fd)
          if (!result.ok) {
            setError(result.error)
            return
          }
          if (result.message) window.alert(result.message)
          router.refresh()
        })
      }}
    >
      <h3 className="font-[family-name:var(--font-display)] text-lg font-bold">
        Nova licença SaaS Tour
      </h3>
      <p className="text-xs text-zinc-500">
        Cria via Edge Function <code>provision-saas-license</code> (não duplica
        Stripe/Tour).
      </p>
      <div className="grid gap-3 md:grid-cols-2">
        <label className="block space-y-1">
          <span className="text-xs font-bold uppercase text-zinc-500">Nome</span>
          <input name="name" required className={fieldClass} />
        </label>
        <label className="block space-y-1">
          <span className="text-xs font-bold uppercase text-zinc-500">Slug</span>
          <input name="slug" className={fieldClass} placeholder="auto" />
        </label>
        <label className="block space-y-1 md:col-span-2">
          <span className="text-xs font-bold uppercase text-zinc-500">
            Owner email
          </span>
          <input name="owner_email" type="email" required className={fieldClass} />
        </label>
        <label className="block space-y-1">
          <span className="text-xs font-bold uppercase text-zinc-500">Plano</span>
          <select name="plan_type" defaultValue="gold" className={fieldClass}>
            {Object.entries(PLAN_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </label>
        <label className="block space-y-1">
          <span className="text-xs font-bold uppercase text-zinc-500">
            Max torneios
          </span>
          <input
            name="max_tournaments"
            type="number"
            defaultValue={PLAN_MAX_TOURNAMENTS.gold}
            className={fieldClass}
          />
        </label>
        <label className="block space-y-1">
          <span className="text-xs font-bold uppercase text-zinc-500">Início</span>
          <input
            name="contract_start"
            type="date"
            defaultValue={today.toISOString().slice(0, 10)}
            className={fieldClass}
          />
        </label>
        <label className="block space-y-1">
          <span className="text-xs font-bold uppercase text-zinc-500">Expira</span>
          <input
            name="subscription_expires_at"
            type="date"
            defaultValue={end.toISOString().slice(0, 10)}
            className={fieldClass}
          />
        </label>
        <input type="hidden" name="status" value="active" />
        <input type="hidden" name="language" value="es" />
        <input type="hidden" name="currency" value="EUR" />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button type="submit" disabled={pending} className={btnPrimary}>
        {pending ? 'A provisionar…' : 'Criar + provisionar Tour'}
      </button>
    </form>
  )
}

function PlanPeriodDates({ org }: { org: BoostOrganization }) {
  const start = resolveSaasPlanStart(org)
  const endIso = resolveSaasPlanEnd(org)
  const active = isSaasActiveCard(org)

  if (!active) return null

  return (
    <dl className="grid grid-cols-2 gap-2 rounded-xl bg-zinc-50 px-3 py-2 text-xs">
      <div>
        <dt className="font-bold uppercase text-zinc-400">Início do plano</dt>
        <dd className="font-semibold text-zinc-800">
          {formatSaasDate(start.iso)}
          {start.derived && start.iso ? (
            <span className="ml-1 font-normal text-zinc-400">(criado em)</span>
          ) : null}
        </dd>
      </div>
      <div>
        <dt className="font-bold uppercase text-zinc-400">Fim do plano</dt>
        <dd className="font-semibold text-zinc-800">
          {formatSaasDate(endIso)}
          {org.cancel_at_period_end ? (
            <span className="ml-1 font-normal text-amber-700">
              · cancela no fim
            </span>
          ) : null}
        </dd>
      </div>
    </dl>
  )
}

export function SaasOrgCard({
  org,
  canWrite,
}: {
  org: BoostOrganization
  canWrite: boolean
}) {
  const router = useRouter()
  const [payUrl, setPayUrl] = useState<string | null>(null)
  const [payError, setPayError] = useState<string | null>(null)
  const [pending, start] = useTransition()
  const expired = isSaasExpired(org)

  return (
    <article className="flex flex-col rounded-2xl border border-zinc-200 bg-white shadow-sm">
      <div
        className="h-1.5 rounded-t-2xl"
        style={{
          background: `linear-gradient(90deg, ${org.primary_color || '#0EA5E9'}, ${org.accent_color || '#F97316'})`,
        }}
      />
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="truncate font-[family-name:var(--font-display)] text-lg font-bold">
              {org.name}
            </h3>
            <p className="font-mono text-xs text-zinc-500">{org.slug}</p>
          </div>
          <span
            className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-bold ${
              org.status === 'active' && !expired
                ? 'bg-emerald-100 text-emerald-800'
                : 'bg-red-100 text-red-700'
            }`}
          >
            {expired ? 'Expirado' : org.status}
          </span>
        </div>
        <dl className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <dt className="font-bold uppercase text-zinc-400">Owner</dt>
            <dd className="break-all">{org.owner_email || '—'}</dd>
          </div>
          <div>
            <dt className="font-bold uppercase text-zinc-400">Conta Tour</dt>
            <dd>{org.tour_user_id ? '✓' : 'pendente'}</dd>
          </div>
          <div className="col-span-2">
            <dt className="font-bold uppercase text-zinc-400">
              App Tour (login)
            </dt>
            <dd>
              <a
                href={getTourLoginUrl()}
                target="_blank"
                rel="noreferrer"
                className="break-all text-sky-600 hover:underline"
              >
                {getTourLoginUrl()}
              </a>
            </dd>
          </div>
          <div className="col-span-2">
            <dt className="font-bold uppercase text-zinc-400">
              Entrada com marca
            </dt>
            <dd>
              <a
                href={getTourBrandedUrl(org.slug)}
                target="_blank"
                rel="noreferrer"
                className="break-all font-mono text-sky-600 hover:underline"
              >
                {getTourBrandedUrl(org.slug)}
              </a>
              <p className="mt-0.5 text-[11px] font-normal normal-case tracking-normal text-zinc-400">
                Mesma App Tour com as cores/marca deste organizador (antes
                chamado «página pública»).
              </p>
            </dd>
          </div>
        </dl>

        <PlanPeriodDates org={org} />

        {canWrite && (
          <>
            <label className="block text-xs">
              <span className="font-bold uppercase text-zinc-400">Plano</span>
              <select
                className={fieldClass + ' mt-1'}
                defaultValue={org.plan_type}
                onChange={(e) => {
                  start(async () => {
                    const r = await updateSaasPlan(org.id, e.target.value)
                    if (!r.ok) window.alert(r.error)
                    router.refresh()
                  })
                }}
              >
                {Object.entries(PLAN_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </label>
            <div className="mt-auto flex flex-wrap gap-2 border-t border-zinc-100 pt-3">
              <ActionButton
                label={org.status === 'active' ? 'Suspender' : 'Ativar'}
                action={() => toggleSaasStatus(org.id)}
              />
              {org.owner_email && (
                <ActionButton
                  label="Credenciais"
                  confirm={`Reenviar credenciais para ${org.owner_email}?`}
                  action={() => resendSaasCredentials(org.id)}
                />
              )}
              <button
                type="button"
                disabled={pending}
                className="inline-flex items-center rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-800 hover:bg-emerald-100 disabled:opacity-60"
                onClick={() => {
                  setPayError(null)
                  const email =
                    window.prompt(
                      'Email para enviar o link de pagamento',
                      org.owner_email || ''
                    ) || ''
                  if (!email) return
                  start(async () => {
                    const r = await sendSaasPaymentLinkEmail({
                      orgId: org.id,
                      ownerEmail: email,
                      planType: org.plan_type,
                      currency: org.currency || 'EUR',
                      billingPeriod: inferBillingPeriod(org),
                    })
                    if (!r.ok) {
                      setPayError(r.error)
                      window.alert(r.error)
                      return
                    }
                    setPayUrl(r.url || null)
                    if (r.message) window.alert(r.message)
                    router.refresh()
                  })
                }}
              >
                {pending ? 'A enviar…' : 'Enviar link de pagamento'}
              </button>
              <button
                type="button"
                disabled={pending}
                title="Gera o link sem enviar email"
                className="inline-flex items-center rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs font-bold text-zinc-700 hover:bg-zinc-100 disabled:opacity-60"
                onClick={() => {
                  setPayError(null)
                  const email =
                    window.prompt('Email do cliente (link Stripe)', org.owner_email || '') ||
                    ''
                  if (!email) return
                  start(async () => {
                    const r = await generateSaasPaymentLink({
                      orgId: org.id,
                      ownerEmail: email,
                      planType: org.plan_type,
                      currency: org.currency || 'EUR',
                      billingPeriod: inferBillingPeriod(org),
                      sendEmail: false,
                    })
                    if (!r.ok) {
                      setPayError(r.error)
                      window.alert(r.error)
                      return
                    }
                    setPayUrl(r.url || null)
                    if (r.message) window.alert(r.message)
                    router.refresh()
                  })
                }}
              >
                Só gerar link
              </button>
              <ActionButton
                label="Eliminar"
                variant="danger"
                confirm={`Eliminar licença "${org.name}"?`}
                action={() => deleteSaasLicense(org.id)}
              />
            </div>
            {payError && (
              <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                {payError}
              </p>
            )}
            {payUrl && (
              <input
                readOnly
                value={payUrl}
                className={fieldClass + ' text-xs'}
                onFocus={(e) => e.target.select()}
              />
            )}
          </>
        )}
      </div>
    </article>
  )
}
