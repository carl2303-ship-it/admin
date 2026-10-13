'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  deletePlatformPlan,
  savePlatformPlan,
  saveStripeConfig,
  togglePlatformPlan,
} from '@/lib/padel1/actions'
import type {
  Padel1PlatformPlan,
  Padel1StripeConfigStatus,
} from '@/lib/padel1/types'
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

export function SettingsPanel({
  stripe,
  plans,
  canWrite,
}: {
  stripe: Padel1StripeConfigStatus | null
  plans: Padel1PlatformPlan[]
  canWrite: boolean
}) {
  const router = useRouter()
  const [pending, start] = useTransition()
  const [tab, setTab] = useState<'stripe' | 'plans'>('stripe')
  const [pk, setPk] = useState('')
  const [sk, setSk] = useState('')
  const [wh, setWh] = useState('')
  const [planForm, setPlanForm] = useState({
    id: '' as string | undefined,
    name: '',
    priceMonthly: '',
    priceAnnual: '',
    featuresJson: '{}',
  })
  const [showPlan, setShowPlan] = useState(false)

  const clubPlans = plans.filter((p) => p.target_type === 'club')

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <button
          type="button"
          className={tab === 'stripe' ? btnPrimary : btnGhost}
          onClick={() => setTab('stripe')}
        >
          Stripe plataforma
        </button>
        <button
          type="button"
          className={tab === 'plans' ? btnPrimary : btnGhost}
          onClick={() => setTab('plans')}
        >
          Planos
        </button>
      </div>

      {tab === 'stripe' && (
        <Panel className="space-y-3 p-4">
          <p className="text-sm text-zinc-600">
            Credenciais em <code>platform_stripe_config</code> (projecto
            padel1). O hub nunca mostra o valor actual dos secrets — só
            presença. Preenche para criar/rodar.
          </p>
          <div className="flex flex-wrap gap-3 text-xs">
            <StatusPill
              active={Boolean(stripe?.hasPublishable)}
              activeLabel="PK ligado"
              inactiveLabel="PK em falta"
            />
            <StatusPill
              active={Boolean(stripe?.hasSecret)}
              activeLabel="SK ligado"
              inactiveLabel="SK em falta"
            />
            <StatusPill
              active={Boolean(stripe?.hasWebhook)}
              activeLabel="Webhook ligado"
              inactiveLabel="Webhook em falta"
            />
            {stripe?.publishablePreview && (
              <span className="text-zinc-500">
                PK: {stripe.publishablePreview}
              </span>
            )}
            {stripe?.updated_at && (
              <span className="text-zinc-500">
                Actualizado{' '}
                {new Date(stripe.updated_at).toLocaleString('pt-PT')}
              </span>
            )}
          </div>
          {canWrite && (
            <div className="space-y-2">
              <input
                className={fieldClass}
                placeholder="stripe_publishable_key"
                value={pk}
                onChange={(e) => setPk(e.target.value)}
              />
              <input
                className={fieldClass}
                type="password"
                placeholder="stripe_secret_key"
                value={sk}
                onChange={(e) => setSk(e.target.value)}
              />
              <input
                className={fieldClass}
                type="password"
                placeholder="webhook_secret (opcional)"
                value={wh}
                onChange={(e) => setWh(e.target.value)}
              />
              <button
                type="button"
                className={btnPrimary}
                disabled={pending}
                onClick={() =>
                  start(async () => {
                    const r = await saveStripeConfig({
                      publishableKey: pk,
                      secretKey: sk,
                      webhookSecret: wh,
                    })
                    if (!r.ok) window.alert(r.error)
                    else {
                      setPk('')
                      setSk('')
                      setWh('')
                      window.alert(r.message || 'Guardado')
                      router.refresh()
                    }
                  })
                }
              >
                Guardar Stripe
              </button>
            </div>
          )}
        </Panel>
      )}

      {tab === 'plans' && (
        <div className="space-y-3">
          {canWrite && (
            <button
              type="button"
              className={btnPrimary}
              onClick={() => {
                setPlanForm({
                  id: undefined,
                  name: '',
                  priceMonthly: '',
                  priceAnnual: '',
                  featuresJson: '{}',
                })
                setShowPlan(true)
              }}
            >
              Novo plano
            </button>
          )}
          {showPlan && canWrite && (
            <Panel className="space-y-2 p-4">
              <input
                className={fieldClass}
                placeholder="Nome"
                value={planForm.name}
                onChange={(e) =>
                  setPlanForm({ ...planForm, name: e.target.value })
                }
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  className={fieldClass}
                  placeholder="€/mês"
                  value={planForm.priceMonthly}
                  onChange={(e) =>
                    setPlanForm({ ...planForm, priceMonthly: e.target.value })
                  }
                />
                <input
                  className={fieldClass}
                  placeholder="€/ano"
                  value={planForm.priceAnnual}
                  onChange={(e) =>
                    setPlanForm({ ...planForm, priceAnnual: e.target.value })
                  }
                />
              </div>
              <textarea
                className={fieldClass}
                rows={3}
                value={planForm.featuresJson}
                onChange={(e) =>
                  setPlanForm({ ...planForm, featuresJson: e.target.value })
                }
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  className={btnPrimary}
                  disabled={pending}
                  onClick={() =>
                    start(async () => {
                      const r = await savePlatformPlan({
                        id: planForm.id,
                        name: planForm.name,
                        priceMonthly: planForm.priceMonthly
                          ? Number(planForm.priceMonthly)
                          : null,
                        priceAnnual: planForm.priceAnnual
                          ? Number(planForm.priceAnnual)
                          : null,
                        featuresJson: planForm.featuresJson,
                      })
                      if (!r.ok) window.alert(r.error)
                      else {
                        setShowPlan(false)
                        router.refresh()
                      }
                    })
                  }
                >
                  Guardar
                </button>
                <button
                  type="button"
                  className={btnGhost}
                  onClick={() => setShowPlan(false)}
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
                  <Th>Nome</Th>
                  <Th>€/mês</Th>
                  <Th>€/ano</Th>
                  <Th>Estado</Th>
                  <Th />
                </tr>
              </thead>
              <tbody>
                {clubPlans.map((p) => (
                  <tr key={p.id}>
                    <Td className="font-semibold">{p.name}</Td>
                    <Td>{p.price_monthly ?? '—'}</Td>
                    <Td>{p.price_annual ?? '—'}</Td>
                    <Td>
                      <StatusPill active={p.is_active} />
                    </Td>
                    <Td>
                      {canWrite && (
                        <div className="flex flex-wrap gap-1">
                          <button
                            type="button"
                            className={btnGhost}
                            onClick={() => {
                              setPlanForm({
                                id: p.id,
                                name: p.name,
                                priceMonthly: p.price_monthly?.toString() || '',
                                priceAnnual: p.price_annual?.toString() || '',
                                featuresJson: JSON.stringify(
                                  p.features || {},
                                  null,
                                  2
                                ),
                              })
                              setShowPlan(true)
                            }}
                          >
                            Editar
                          </button>
                          <button
                            type="button"
                            className={btnGhost}
                            disabled={pending}
                            onClick={() =>
                              start(async () => {
                                const r = await togglePlatformPlan(
                                  p.id,
                                  !p.is_active
                                )
                                if (!r.ok) window.alert(r.error)
                                router.refresh()
                              })
                            }
                          >
                            Toggle
                          </button>
                          <button
                            type="button"
                            className={btnDanger}
                            disabled={pending}
                            onClick={() =>
                              start(async () => {
                                if (!window.confirm(`Apagar ${p.name}?`))
                                  return
                                const r = await deletePlatformPlan(p.id)
                                if (!r.ok) window.alert(r.error)
                                router.refresh()
                              })
                            }
                          >
                            Apagar
                          </button>
                        </div>
                      )}
                    </Td>
                  </tr>
                ))}
              </tbody>
            </TableShell>
          </Panel>
        </div>
      )}
    </div>
  )
}
