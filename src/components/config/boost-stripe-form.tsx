'use client'

import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { btnPrimary, fieldClass, Panel, StatusPill } from '@/components/boost/ui'
import {
  updateBoostStripeSecrets,
  type ConfigActionResult,
} from '@/lib/config/actions'

type Props = {
  managementConfigured: boolean
  stripeSecretPresent: boolean | null
  stripeWebhookPresent: boolean | null
  edgeSecretsError?: string
}

export function BoostStripeSecretsForm({
  managementConfigured,
  stripeSecretPresent,
  stripeWebhookPresent,
  edgeSecretsError,
}: Props) {
  const router = useRouter()
  const [pending, start] = useTransition()

  return (
    <Panel className="p-5">
      <h3 className="font-[family-name:var(--font-display)] text-lg font-bold">
        Chaves Stripe · Loja
      </h3>
      <p className="mt-2 text-sm text-slate-400">
        Se mudares de conta Stripe ou rodares as chaves, cola os novos valores
        aqui. O hub nunca mostra o valor actual — só se está OK ou em falta.
      </p>

      <div className="mt-4 flex flex-wrap gap-3">
        <StatusPill
          active={stripeSecretPresent === true}
          activeLabel="Chave secreta OK"
          inactiveLabel={
            stripeSecretPresent === null
              ? 'Chave secreta: desconhecido'
              : 'Chave secreta em falta'
          }
        />
        <StatusPill
          active={stripeWebhookPresent === true}
          activeLabel="Webhook OK"
          inactiveLabel={
            stripeWebhookPresent === null
              ? 'Webhook: desconhecido'
              : 'Webhook em falta'
          }
        />
      </div>

      {edgeSecretsError && (
        <p className="mt-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
          Não foi possível confirmar o estado das chaves. Podes mesmo assim
          tentar actualizar abaixo.
        </p>
      )}

      {!managementConfigured && (
        <p className="mt-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
          A actualização automática pode estar indisponível. Se o guardado
          falhar, abre Stripe → Chaves API e pede ao suporte para aplicar os
          novos valores.
        </p>
      )}

      <form
        className="mt-5 space-y-3"
        onSubmit={(e) => {
          e.preventDefault()
          const fd = new FormData(e.currentTarget)
          start(async () => {
            const result: ConfigActionResult =
              await updateBoostStripeSecrets(fd)
            if (!result.ok) {
              window.alert(result.error)
            } else {
              window.alert(result.message || 'Chaves actualizadas.')
              e.currentTarget.reset()
            }
            router.refresh()
          })
        }}
      >
        <div>
          <label className="mb-1 block text-xs font-bold uppercase text-slate-400">
            Nova chave secreta (sk_…)
          </label>
          <input
            name="stripe_secret_key"
            type="password"
            autoComplete="off"
            spellCheck={false}
            placeholder="sk_live_… ou sk_test_…"
            className={fieldClass}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-bold uppercase text-slate-400">
            Novo webhook (whsec_…) — opcional
          </label>
          <input
            name="stripe_webhook_secret"
            type="password"
            autoComplete="off"
            spellCheck={false}
            placeholder="whsec_…"
            className={fieldClass}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-bold uppercase text-slate-400">
            Nota (opcional)
          </label>
          <input
            name="note"
            type="text"
            placeholder="ex. nova conta Stripe SE"
            className={fieldClass}
          />
        </div>
        <button type="submit" disabled={pending} className={btnPrimary}>
          {pending ? 'A guardar…' : 'Actualizar chaves Stripe'}
        </button>
      </form>
    </Panel>
  )
}
