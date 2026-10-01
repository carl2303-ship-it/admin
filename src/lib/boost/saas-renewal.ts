import { requireBoostClient } from './client'
import {
  inferBillingPeriod,
  resolveSaasPlanEnd,
} from './saas-dates'
import { createSaasPaymentLink } from './saas-payment-link'
import type { BoostOrganization } from './types'

const DAY_MS = 86_400_000

export type RenewalRunResult = {
  scanned: number
  eligible: number
  sent: number
  skipped: number
  errors: { orgId: string; slug: string; error: string }[]
  details: { orgId: string; slug: string; status: string }[]
}

/**
 * Recorrente = tem período de subscrição e NÃO é Stripe a auto-renovar.
 * Stripe com `stripe_subscription_id` e `cancel_at_period_end=false` cobra sozinho —
 * não enviamos payment link (evita cobrança dupla).
 * Manual / cancelado ao fim do período → precisa de link de renovação.
 */
export function isRecurringNeedingPaymentLink(
  org: Pick<
    BoostOrganization,
    | 'status'
    | 'owner_email'
    | 'subscription_expires_at'
    | 'stripe_subscription_id'
    | 'cancel_at_period_end'
    | 'renewal_payment_link_sent_at'
  >
): boolean {
  if (org.status !== 'active') return false
  if (!org.owner_email?.trim()) return false
  if (!org.subscription_expires_at) return false

  const autoStripe =
    Boolean(org.stripe_subscription_id) && !org.cancel_at_period_end
  if (autoStripe) return false

  return true
}

/** Janela: expira nas próximas 24h ou expirou há ≤48h. */
export function isInRenewalWindow(
  org: Pick<BoostOrganization, 'subscription_expires_at'>,
  now = Date.now()
): boolean {
  const endIso = resolveSaasPlanEnd(org)
  if (!endIso) return false
  const end = new Date(endIso).getTime()
  if (Number.isNaN(end)) return false
  if (end > now + DAY_MS) return false
  if (end < now - 2 * DAY_MS) return false
  return true
}

export function alreadySentForThisPeriod(
  org: Pick<
    BoostOrganization,
    'subscription_expires_at' | 'renewal_payment_link_sent_at'
  >
): boolean {
  if (!org.renewal_payment_link_sent_at || !org.subscription_expires_at) {
    return false
  }
  const sent = new Date(org.renewal_payment_link_sent_at).getTime()
  const end = new Date(org.subscription_expires_at).getTime()
  if (Number.isNaN(sent) || Number.isNaN(end)) return false
  // Já enviado nesta janela de renovação (desde 7 dias antes do fim)
  return sent >= end - 7 * DAY_MS
}

export function shouldAutoSendRenewalLink(
  org: BoostOrganization,
  now = Date.now()
): boolean {
  return (
    isRecurringNeedingPaymentLink(org) &&
    isInRenewalWindow(org, now) &&
    !alreadySentForThisPeriod(org)
  )
}

/** Cron diário: envia links de renovação elegíveis. */
export async function runSaasRenewalPaymentLinks(): Promise<RenewalRunResult> {
  const client = requireBoostClient()
  const { data, error } = await client
    .from('organizations')
    .select('*')
    .eq('source', 'boost')
    .eq('status', 'active')

  if (error) {
    throw new Error(error.message)
  }

  const orgs = (data || []) as BoostOrganization[]
  const result: RenewalRunResult = {
    scanned: orgs.length,
    eligible: 0,
    sent: 0,
    skipped: 0,
    errors: [],
    details: [],
  }

  for (const org of orgs) {
    if (!shouldAutoSendRenewalLink(org)) {
      result.skipped += 1
      continue
    }
    result.eligible += 1

    const billingPeriod = inferBillingPeriod(org)
    const link = await createSaasPaymentLink({
      orgId: org.id,
      ownerEmail: org.owner_email || '',
      planType: org.plan_type || 'gold',
      currency: org.currency || 'EUR',
      billingPeriod,
      sendEmail: true,
    })

    if (!link.ok) {
      result.errors.push({
        orgId: org.id,
        slug: org.slug,
        error: link.error,
      })
      result.details.push({
        orgId: org.id,
        slug: org.slug,
        status: `erro: ${link.error}`,
      })
      continue
    }

    result.sent += 1
    result.details.push({
      orgId: org.id,
      slug: org.slug,
      status: 'email enviado',
    })
  }

  return result
}
