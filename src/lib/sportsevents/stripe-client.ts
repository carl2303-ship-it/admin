import Stripe from 'stripe'
import { getAppSetting } from '@/lib/sportsevents/app-settings'

export async function getStripe() {
  const key =
    process.env.STRIPE_SECRET_KEY ||
    (await getAppSetting('stripe_secret_key'))
  if (!key) return null
  return new Stripe(key, {
    // Pinned stripe@23.1.0 (package-lock) uses 2026-10-28.endive.
    // Cast keeps typecheck green if a cache still resolves an older stripe.
    apiVersion: '2026-10-28.endive' as Stripe.LatestApiVersion,
  })
}

export async function getStripeWebhookSecret() {
  return (
    process.env.STRIPE_WEBHOOK_SECRET ||
    (await getAppSetting('stripe_webhook_secret'))
  )
}

export async function getSiteUrl() {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.URL ||
    (await getAppSetting('site_url')) ||
    'http://localhost:3000'
  )
}
