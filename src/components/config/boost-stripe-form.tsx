'use client'

import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { btnPrimary, fieldClass, Panel } from '@/components/boost/ui'
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
        Rotação Stripe (Edge Boost)
      </h3>
      <p className="mt-2 text-sm text-zinc-600">
        Os secrets <code className="rounded bg-zinc-100 px-1">STRIPE_*</code>{' '}
        vivem no projeto Supabase Boost (Edge Functions). O hub só as invoca —
        nunca embute a key no Netlify admin nem no browser.
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-zinc-100 bg-zinc-50 px-3 py-2 text-xs">
          <p className="font-bold text-zinc-700">STRIPE_SECRET_KEY (Edge)</p>
          <p className="mt-1 text-zinc-500">
            {stripeSecretPresent === null
              ? 'Desconhecido (sem Management API)'
              : stripeSecretPresent
                ? 'Presente no project Boost'
                : 'Não listado no project Boost'}
          </p>
        </div>
        <div className="rounded-xl border border-zinc-100 bg-zinc-50 px-3 py-2 text-xs">
          <p className="font-bold text-zinc-700">STRIPE_WEBHOOK_SECRET (Edge)</p>
          <p className="mt-1 text-zinc-500">
            {stripeWebhookPresent === null
              ? 'Desconhecido (sem Management API)'
              : stripeWebhookPresent
                ? 'Presente no project Boost'
                : 'Não listado no project Boost'}
          </p>
        </div>
      </div>

      {edgeSecretsError && (
        <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
          {edgeSecretsError}
        </p>
      )}

      <div
        className={
          managementConfigured
            ? 'mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-900'
            : 'mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900'
        }
      >
        {managementConfigured ? (
          <p>
            <strong>Write path activo:</strong> PAT + project ref detectados. Ao
            submeter, o hub actualiza secrets via Supabase Management API. O
            valor <em>não</em> é guardado na DB do hub.
          </p>
        ) : (
          <div className="space-y-2">
            <p>
              <strong>Bloqueador:</strong> falta{' '}
              <code>SUPABASE_ACCESS_TOKEN</code> (ou{' '}
              <code>BOOST_SUPABASE_ACCESS_TOKEN</code>) no Netlify do admin. O
              service role Boost <em>não</em> consegue escrever Edge secrets.
            </p>
            <p>
              Ao submeter sem token: o hub regista um <em>intent</em> (nome do
              secret, sem valor) e mostra o checklist abaixo para rotação manual.
            </p>
          </div>
        )}
      </div>

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
              window.alert(result.message)
              e.currentTarget.reset()
            }
            router.refresh()
          })
        }}
      >
        <div>
          <label className="mb-1 block text-xs font-bold uppercase text-zinc-500">
            STRIPE_SECRET_KEY (novo valor)
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
          <label className="mb-1 block text-xs font-bold uppercase text-zinc-500">
            STRIPE_WEBHOOK_SECRET (opcional)
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
          <label className="mb-1 block text-xs font-bold uppercase text-zinc-500">
            Nota (visível no intent)
          </label>
          <input
            name="note"
            type="text"
            placeholder="ex. rotação trimestral"
            className={fieldClass}
          />
        </div>
        <button type="submit" disabled={pending} className={btnPrimary}>
          {pending
            ? 'A processar…'
            : managementConfigured
              ? 'Actualizar secrets Edge'
              : 'Registar intent + checklist'}
        </button>
      </form>

      {!managementConfigured && (
        <div className="mt-5 rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-700">
          <p className="font-bold text-zinc-900">Checklist — rodar Stripe no Boost</p>
          <ol className="mt-2 list-decimal space-y-1 pl-5 text-xs">
            <li>
              Abre o project Supabase Boost → Edge Functions → Secrets
            </li>
            <li>
              Actualiza <code>STRIPE_SECRET_KEY</code> e, se necessário,{' '}
              <code>STRIPE_WEBHOOK_SECRET</code>
            </li>
            <li>
              Confirma as funções <code>stripe-checkout</code>,{' '}
              <code>manage-saas-subscription</code>,{' '}
              <code>provision-saas-license</code>
            </li>
            <li>
              Testa um link SaaS em{' '}
              <a
                href="/produtos/boost/saas"
                className="font-semibold text-sky-700 hover:underline"
              >
                /produtos/boost/saas
              </a>
            </li>
            <li>
              Volta aqui e marca o intent como <strong>aplicado</strong>
            </li>
            <li>
              (Recomendado) Adiciona PAT em{' '}
              <code>SUPABASE_ACCESS_TOKEN</code> no Netlify admin para a próxima
              rotação ser live no hub
            </li>
          </ol>
        </div>
      )}
    </Panel>
  )
}
