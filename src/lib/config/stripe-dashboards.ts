/**
 * Links públicos para o Stripe Dashboard (sem secrets).
 * Contas Stripe são por produto — o hub só aponta, não embute keys.
 */

export type StripeDashboardLink = {
  id: string
  label: string
  href: string
  description: string
}

const BASE = 'https://dashboard.stripe.com'

export function getStripeDashboardLinks(scope: {
  /** Prefer test mode links when true. */
  testMode?: boolean
}): StripeDashboardLink[] {
  const prefix = scope.testMode ? `${BASE}/test` : BASE
  return [
    {
      id: 'home',
      label: 'Dashboard',
      href: prefix,
      description: 'Visão geral da conta Stripe',
    },
    {
      id: 'payments',
      label: 'Pagamentos',
      href: `${prefix}/payments`,
      description: 'Cobranças e intentos recentes',
    },
    {
      id: 'customers',
      label: 'Clientes',
      href: `${prefix}/customers`,
      description: 'Customers / assinantes',
    },
    {
      id: 'subscriptions',
      label: 'Subscrições',
      href: `${prefix}/subscriptions`,
      description: 'SaaS / planos activos',
    },
    {
      id: 'webhooks',
      label: 'Webhooks',
      href: `${prefix}/webhooks`,
      description: 'Endpoints e logs de eventos',
    },
    {
      id: 'apikeys',
      label: 'API keys',
      href: `${prefix}/apikeys`,
      description: 'Rodar sk_ / pk_ (copiar para hub / Edge)',
    },
    {
      id: 'developers',
      label: 'Developers',
      href: `${prefix}/developers`,
      description: 'Logs, eventos, ferramentas',
    },
  ]
}

export type ProductStripeContext = {
  product: 'boost' | 'padel1' | 'sportsevents'
  title: string
  blurb: string
  /** Onde vivem os secrets desta conta. */
  secretsLiveIn: string
  hubOpsHref?: string
}

export const PRODUCT_STRIPE_CONTEXTS: ProductStripeContext[] = [
  {
    product: 'boost',
    title: 'Stripe · Boost Store',
    blurb:
      'Conta usada pelas Edge Functions Boost (checkout SaaS / ebooks). Secrets no Edge Boost, não no Netlify admin.',
    secretsLiveIn: 'Supabase Boost → Edge Functions → Secrets',
    hubOpsHref: '/produtos/boost/stripe',
  },
  {
    product: 'padel1',
    title: 'Stripe · Padel1 (plataforma)',
    blurb:
      'Stripe da plataforma / HQ. Escrita live no hub chega na Fase 3; por agora deep-link + intent.',
    secretsLiveIn: 'Projecto padel1 / Manager (fora do env admin)',
    hubOpsHref: '/produtos/padel1',
  },
  {
    product: 'sportsevents',
    title: 'Stripe · SportsEvents (Connect)',
    blurb:
      'Connect / pagamentos do site público. Env no Netlify sportsevents.app até Fase 4.',
    secretsLiveIn: 'Netlify sportsevents.app (+ ERP /admin)',
    hubOpsHref: '/produtos/sportsevents',
  },
]
