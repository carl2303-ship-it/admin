/**
 * Links públicos para o Stripe Dashboard (sem secrets).
 */

export type StripeDashboardLink = {
  id: string
  label: string
  href: string
  description: string
}

const BASE = 'https://dashboard.stripe.com'

export function getStripeDashboardLinks(scope: {
  testMode?: boolean
}): StripeDashboardLink[] {
  const prefix = scope.testMode ? `${BASE}/test` : BASE
  return [
    {
      id: 'home',
      label: 'Dashboard',
      href: prefix,
      description: 'Visão geral da conta',
    },
    {
      id: 'payments',
      label: 'Pagamentos',
      href: `${prefix}/payments`,
      description: 'Cobranças recentes',
    },
    {
      id: 'customers',
      label: 'Clientes',
      href: `${prefix}/customers`,
      description: 'Clientes e assinantes',
    },
    {
      id: 'subscriptions',
      label: 'Subscrições',
      href: `${prefix}/subscriptions`,
      description: 'Planos activos',
    },
    {
      id: 'webhooks',
      label: 'Webhooks',
      href: `${prefix}/webhooks`,
      description: 'Endpoints e eventos',
    },
    {
      id: 'apikeys',
      label: 'Chaves API',
      href: `${prefix}/apikeys`,
      description: 'Copiar chaves para actualizar aqui',
    },
  ]
}

export type ProductStripeContext = {
  product: 'boost' | 'padel1' | 'sportsevents'
  title: string
  blurb: string
  hubOpsHref?: string
}

export const PRODUCT_STRIPE_CONTEXTS: ProductStripeContext[] = [
  {
    product: 'boost',
    title: 'Stripe · Loja',
    blurb: 'Checkout da loja e ebooks. Podes actualizar as chaves nesta página.',
    hubOpsHref: '/configuracao/boost',
  },
  {
    product: 'padel1',
    title: 'Stripe · Padel1',
    blurb: 'Planos e pagamentos da plataforma Padel1.',
    hubOpsHref: '/configuracao/padel1',
  },
  {
    product: 'sportsevents',
    title: 'Stripe · SportsEvents',
    blurb: 'Pagamentos e Connect do site SportsEvents.',
    hubOpsHref: '/configuracao/sportsevents',
  },
]
