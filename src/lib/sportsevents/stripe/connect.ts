import type Stripe from 'stripe'
import { getSiteUrl, getStripe } from '@/lib/sportsevents/stripe-client'

export type ConnectPartnerRow = {
  id: string
  name: string
  email?: string | null
  type?: string | null
  country_code?: string | null
  stripe_account_id?: string | null
  stripe_connect_status?: string | null
}

export async function ensureExpressAccount(
  partner: ConnectPartnerRow,
  opts: { country?: string; email?: string } = {}
): Promise<{ accountId: string; created: boolean }> {
  const stripe = await getStripe()
  if (!stripe) throw new Error('Stripe não configurado')

  if (partner.stripe_account_id) {
    return { accountId: partner.stripe_account_id, created: false }
  }

  const country =
    (opts.country || partner.country_code || 'PT').toUpperCase().slice(0, 2)

  const account = await stripe.accounts.create({
    type: 'express',
    country,
    email: opts.email || partner.email || undefined,
    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true },
    },
    business_profile: {
      name: partner.name,
      product_description: 'Sports tourism / padel training camp supplier',
    },
    metadata: {
      partner_id: partner.id,
      partner_type: partner.type || 'OUTROS',
      platform: 'sportsevents.app',
    },
  })

  return { accountId: account.id, created: true }
}

export async function createConnectOnboardingLink(
  accountId: string,
  opts: { refreshUrl?: string; returnUrl?: string } = {}
): Promise<Stripe.AccountLink> {
  const stripe = await getStripe()
  if (!stripe) throw new Error('Stripe não configurado')

  const siteUrl = await getSiteUrl()
  const refresh =
    opts.refreshUrl ||
    `${siteUrl}/produtos/sportsevents/parceiros?stripe=refresh&account=${accountId}`
  const ret =
    opts.returnUrl ||
    `${siteUrl}/produtos/sportsevents/parceiros?stripe=return&account=${accountId}`

  return stripe.accountLinks.create({
    account: accountId,
    refresh_url: refresh,
    return_url: ret,
    type: 'account_onboarding',
  })
}

export async function syncConnectAccountStatus(
  accountId: string
): Promise<'active' | 'pending_onboarding' | 'restricted'> {
  const stripe = await getStripe()
  if (!stripe) throw new Error('Stripe não configurado')

  const account = await stripe.accounts.retrieve(accountId)
  if (account.charges_enabled && account.payouts_enabled) return 'active'
  if (account.requirements?.disabled_reason) return 'restricted'
  return 'pending_onboarding'
}
