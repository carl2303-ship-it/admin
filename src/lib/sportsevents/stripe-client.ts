import Stripe from 'stripe'
import { getAppSetting } from '@/lib/sportsevents/app-settings'

export async function getStripe() {
  const key =
    process.env.STRIPE_SECRET_KEY ||
    (await getAppSetting('stripe_secret_key'))
  if (!key) return null
  return new Stripe(key, {
    apiVersion: '2026-09-30.endive',
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
