import { invokeBoostEdgeFunction, requireBoostClient } from './client'
import { PLAN_MAX_TOURNAMENTS } from './types'

export type SaasPaymentLinkInput = {
  orgId: string
  ownerEmail: string
  planType: string
  currency: string
  billingPeriod: 'mensal' | 'anual'
  sendEmail: boolean
  /** Só para cron / bot — se omitido, não força JWT de staff. */
  preferUserId?: string | null
}

export type SaasPaymentLinkResult =
  | { ok: true; url: string; message: string; emailSent: boolean }
  | { ok: false; error: string }

/**
 * Gera Checkout Stripe SaaS Tour via Edge `stripe-checkout`.
 * Reutilizado pela UI (manual) e pelo cron de renovação.
 */
export async function createSaasPaymentLink(
  input: SaasPaymentLinkInput
): Promise<SaasPaymentLinkResult> {
  const ownerEmail = input.ownerEmail.trim()
  if (!ownerEmail) {
    return { ok: false, error: 'Email do cliente obrigatório.' }
  }

  if (!process.env.BOOST_SUPABASE_URL || !process.env.BOOST_SUPABASE_ANON_KEY) {
    return {
      ok: false,
      error:
        'Edge Boost não configurado: falta BOOST_SUPABASE_URL e/ou BOOST_SUPABASE_ANON_KEY no Netlify do admin.',
    }
  }

  try {
    const client = requireBoostClient()
    const { data: org, error: orgError } = await client
      .from('organizations')
      .select('*')
      .eq('id', input.orgId)
      .eq('source', 'boost')
      .maybeSingle()
    if (orgError || !org) {
      return { ok: false, error: orgError?.message || 'Org não encontrada' }
    }

    const storeBase =
      process.env.NEXT_PUBLIC_BOOST_STORE_URL || 'https://boostpadel.store'

    const { data, error } = await invokeBoostEdgeFunction<{
      url?: string
      emailSent?: boolean
      error?: string
    }>(
      'stripe-checkout',
      {
        productType: 'saas-tour-subscription',
        planType: input.planType,
        billingPeriod: input.billingPeriod,
        organizationName: org.name,
        organizationSlug: org.slug,
        ownerEmail,
        language: org.language || 'pt',
        currency: input.currency,
        sendPaymentLinkEmail: input.sendEmail,
        successUrl: `${storeBase}/tour.html?subscription=success&slug=${encodeURIComponent(org.slug)}`,
        cancelUrl: `${storeBase}/tour.html#precos`,
      },
      { preferUserId: input.preferUserId }
    )

    if (error) {
      const edgeHint =
        /BOOST_EDGE|Sem JWT|ANON_KEY|não configurad/i.test(error)
          ? error
          : `${error} (confirma BOOST_EDGE_AUTH_* ou BOOST_EDGE_USER_ID se a Edge exigir Auth)`
      return { ok: false, error: edgeHint }
    }
    if (!data?.url) {
      return { ok: false, error: 'Stripe não devolveu URL de pagamento' }
    }

    const patch: Record<string, unknown> = {}
    if (!org.owner_email || org.owner_email !== ownerEmail) {
      patch.owner_email = ownerEmail
    }
    if (org.plan_type !== input.planType) {
      patch.plan_type = input.planType
      patch.max_tournaments = PLAN_MAX_TOURNAMENTS[input.planType] ?? 15
    }
    if ((org.currency || 'EUR') !== input.currency) {
      patch.currency = input.currency
    }
    const renewalAt = input.sendEmail ? new Date().toISOString() : null
    if (renewalAt) {
      patch.renewal_payment_link_sent_at = renewalAt
    }
    if (Object.keys(patch).length > 0) {
      const { error: upErr } = await client
        .from('organizations')
        .update(patch)
        .eq('id', org.id)
      // Coluna renewal_* pode ainda não existir se migration Boost não foi aplicada
      if (
        upErr &&
        renewalAt &&
        /renewal_payment_link_sent_at/i.test(upErr.message)
      ) {
        const { renewal_payment_link_sent_at: _, ...withoutRenewal } = patch
        if (Object.keys(withoutRenewal).length > 0) {
          await client
            .from('organizations')
            .update(withoutRenewal)
            .eq('id', org.id)
        }
      }
    }

    const emailSent = Boolean(input.sendEmail && (data.emailSent !== false))
    return {
      ok: true,
      url: data.url,
      emailSent,
      message: input.sendEmail
        ? `Link gerado e email enviado para ${ownerEmail}`
        : 'Link gerado',
    }
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : 'Erro ao gerar link',
    }
  }
}
