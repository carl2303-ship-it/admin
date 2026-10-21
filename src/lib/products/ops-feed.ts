import {
  createBoostServiceClient,
  createPadel1ServiceClient,
  createSportsEventsServiceClient,
} from '@/lib/supabase/admin'

export type OpsItem = {
  id: string
  product: 'boost' | 'padel1' | 'sportsevents'
  title: string
  subtitle?: string
  meta?: string
  href: string
  tone?: 'default' | 'warn' | 'hot'
}

export type OpsSection = {
  key: string
  label: string
  product: OpsItem['product']
  href: string
  count: number | null
  items: OpsItem[]
  status: 'ok' | 'degraded' | 'missing_config'
  error?: string
}

const OPEN_ORDER = new Set(['pending', 'paid', 'shipped'])
const OPEN_LEAD = new Set(['NOVO', 'NOVA', 'CONTACTAR', 'QUALIFICACAO', 'OPEN', 'NEW'])
const PENDING_BOOKING = new Set(['PENDING', 'PENDENTE', 'pending'])

function daysAgoIso(days: number) {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toISOString()
}

function fmtWhen(iso: string | null | undefined) {
  if (!iso) return undefined
  try {
    return new Date(iso).toLocaleString('pt-PT', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return undefined
  }
}

/** Pedidos Boost ainda abertos (pending/paid/shipped) — acção em Pedidos. */
export async function fetchBoostOpenOrders(): Promise<OpsSection> {
  const key = 'boost_orders'
  const label = 'Pedidos Boost a tratar'
  const href = '/produtos/boost/pedidos'
  const client = createBoostServiceClient()
  if (!client) {
    return {
      key,
      label,
      product: 'boost',
      href,
      count: null,
      items: [],
      status: 'missing_config',
      error: 'BOOST_* service role em falta',
    }
  }

  const { data, error } = await client
    .from('orders')
    .select('id, customer_name, customer_email, status, total, created_at')
    .in('status', [...OPEN_ORDER])
    .order('created_at', { ascending: false })
    .limit(8)

  if (error) {
    return {
      key,
      label,
      product: 'boost',
      href,
      count: null,
      items: [],
      status: 'degraded',
      error: error.message,
    }
  }

  const rows = data || []
  return {
    key,
    label,
    product: 'boost',
    href,
    count: rows.length,
    status: 'ok',
    items: rows.map((o) => ({
      id: o.id,
      product: 'boost',
      title: o.customer_name || o.customer_email || 'Pedido',
      subtitle: `${o.status} · €${Number(o.total ?? 0).toFixed(2)}`,
      meta: fmtWhen(o.created_at),
      href: `${href}?detail=${o.id}`,
      tone: o.status === 'pending' ? 'hot' : 'default',
    })),
  }
}

/** Leads ebook recentes (7 dias). */
export async function fetchBoostEbookLeadsRecent(): Promise<OpsSection> {
  const key = 'boost_ebook_leads'
  const label = 'Leads ebook (7 dias)'
  const href = '/produtos/boost/ebook-leads'
  const client = createBoostServiceClient()
  if (!client) {
    return {
      key,
      label,
      product: 'boost',
      href,
      count: null,
      items: [],
      status: 'missing_config',
      error: 'BOOST_* service role em falta',
    }
  }

  const since = daysAgoIso(7)
  const { data, error } = await client
    .from('ebook_leads')
    .select('id, name, email, created_at, newsletter_opt_in')
    .gte('created_at', since)
    .order('created_at', { ascending: false })
    .limit(8)

  if (error) {
    return {
      key,
      label,
      product: 'boost',
      href,
      count: null,
      items: [],
      status: 'degraded',
      error: error.message,
    }
  }

  const rows = data || []
  return {
    key,
    label,
    product: 'boost',
    href,
    count: rows.length,
    status: 'ok',
    items: rows.map((l) => ({
      id: l.id,
      product: 'boost',
      title: l.name || l.email,
      subtitle: l.newsletter_opt_in ? 'Newsletter opt-in' : l.email,
      meta: fmtWhen(l.created_at),
      href,
      tone: 'default',
    })),
  }
}

/** Leads SE abertos / novos. */
export async function fetchSeOpenLeads(): Promise<OpsSection> {
  const key = 'se_leads_open'
  const label = 'Leads SE a responder'
  const href = '/produtos/sportsevents/pipeline'
  const client = createSportsEventsServiceClient()
  if (!client) {
    return {
      key,
      label,
      product: 'sportsevents',
      href,
      count: null,
      items: [],
      status: 'missing_config',
      error: 'SE service role em falta',
    }
  }

  const { data, error } = await client
    .from('leads')
    .select(
      'id, client_name, client_email, company_or_club, status, source, created_at, estimated_revenue'
    )
    .order('created_at', { ascending: false })
    .limit(40)

  if (error) {
    return {
      key,
      label,
      product: 'sportsevents',
      href,
      count: null,
      items: [],
      status: 'degraded',
      error: error.message,
    }
  }

  const open = (data || []).filter((l) =>
    OPEN_LEAD.has(String(l.status || '').toUpperCase())
  )
  const recentFallback =
    open.length > 0
      ? open
      : (data || []).filter(
          (l) =>
            new Date(l.created_at).getTime() >=
            Date.now() - 14 * 24 * 60 * 60 * 1000
        )

  const rows = (open.length > 0 ? open : recentFallback).slice(0, 8)

  return {
    key,
    label,
    product: 'sportsevents',
    href,
    count: open.length > 0 ? open.length : rows.length,
    status: 'ok',
    items: rows.map((l) => ({
      id: l.id,
      product: 'sportsevents',
      title: l.client_name || l.company_or_club || 'Lead',
      subtitle: `${l.status || '—'}${l.source === 'stage_builder' ? ' · App Builder' : ''}${
        l.estimated_revenue ? ` · ~€${l.estimated_revenue}` : ''
      }`,
      meta: fmtWhen(l.created_at),
      href,
      tone:
        String(l.status || '').toUpperCase() === 'NOVO' ||
        l.source === 'stage_builder'
          ? 'hot'
          : 'default',
    })),
  }
}

/** Parceiros SE sem contacto (mesma lógica PartnersNetwork). */
export async function fetchSePartnersToContact(): Promise<OpsSection> {
  const key = 'se_partners_contact'
  const label = 'Parceiros a contactar'
  const href = '/produtos/sportsevents/parceiros'
  const client = createSportsEventsServiceClient()
  if (!client) {
    return {
      key,
      label,
      product: 'sportsevents',
      href,
      count: null,
      items: [],
      status: 'missing_config',
      error: 'SE service role em falta',
    }
  }

  const { data, error } = await client
    .from('partners')
    .select('id, name, type, status, emailed_at, phoned_at, country_code')
    .order('updated_at', { ascending: false })
    .limit(200)

  if (error) {
    // updated_at pode não existir — fallback
    const fb = await client
      .from('partners')
      .select('id, name, type, status, emailed_at, phoned_at, country_code')
      .limit(200)
    if (fb.error) {
      return {
        key,
        label,
        product: 'sportsevents',
        href,
        count: null,
        items: [],
        status: 'degraded',
        error: error.message,
      }
    }
    return buildPartnersSection(key, label, href, fb.data || [])
  }

  return buildPartnersSection(key, label, href, data || [])
}

function buildPartnersSection(
  key: string,
  label: string,
  href: string,
  rows: Array<{
    id: string
    name: string | null
    type?: string | null
    status?: string | null
    emailed_at?: string | null
    phoned_at?: string | null
    country_code?: string | null
  }>
): OpsSection {
  const todo = rows.filter((p) => {
    const status = p.status || 'PROSPECAO'
    return !p.emailed_at && !p.phoned_at && status !== 'PARCEIRO'
  })

  return {
    key,
    label,
    product: 'sportsevents',
    href,
    count: todo.length,
    status: 'ok',
    items: todo.slice(0, 8).map((p) => ({
      id: p.id,
      product: 'sportsevents',
      title: p.name || 'Parceiro',
      subtitle: [p.type, p.status, p.country_code].filter(Boolean).join(' · '),
      href,
      tone: 'warn',
    })),
  }
}

/** Bookings de pacotes pendentes. */
export async function fetchSePendingPackageBookings(): Promise<OpsSection> {
  const key = 'se_pkg_pending'
  const label = 'Bookings pacote pendentes'
  const href = '/produtos/sportsevents/eventos'
  const client = createSportsEventsServiceClient()
  if (!client) {
    return {
      key,
      label,
      product: 'sportsevents',
      href,
      count: null,
      items: [],
      status: 'missing_config',
      error: 'SE service role em falta',
    }
  }

  const { data, error } = await client
    .from('package_bookings')
    .select(
      'id, status, total_amount_cents, created_at, hub_packages(name, package_key)'
    )
    .order('created_at', { ascending: false })
    .limit(30)

  if (error) {
    return {
      key,
      label,
      product: 'sportsevents',
      href,
      count: null,
      items: [],
      status: 'degraded',
      error: error.message,
    }
  }

  const pending = (data || []).filter((b) =>
    PENDING_BOOKING.has(String(b.status || '').toUpperCase())
  )

  return {
    key,
    label,
    product: 'sportsevents',
    href,
    count: pending.length,
    status: 'ok',
    items: pending.slice(0, 8).map((b) => {
      const pkg = Array.isArray(b.hub_packages)
        ? b.hub_packages[0]
        : b.hub_packages
      const cents = Number(b.total_amount_cents || 0)
      return {
        id: b.id,
        product: 'sportsevents' as const,
        title: (pkg as { name?: string } | null)?.name || 'Booking pacote',
        subtitle: `${b.status} · €${(cents / 100).toFixed(2)}`,
        meta: fmtWhen(b.created_at),
        href,
        tone: 'hot' as const,
      }
    }),
  }
}

/** Clubes Padel1 recentes + contratos a expirar. */
export async function fetchPadel1Ops(): Promise<OpsSection[]> {
  const client = createPadel1ServiceClient()
  const clubsHref = '/produtos/padel1/clubes'
  const saasHref = '/produtos/padel1/saas'
  const txHref = '/produtos/padel1/transacoes'

  if (!client) {
    return [
      {
        key: 'padel1_clubs',
        label: 'Clubes Padel1 recentes',
        product: 'padel1',
        href: clubsHref,
        count: null,
        items: [],
        status: 'missing_config',
        error: 'PADEL1_* service role em falta',
      },
    ]
  }

  const since = daysAgoIso(30)
  const now = Date.now()
  const in30 = now + 30 * 24 * 60 * 60 * 1000

  const boost = createBoostServiceClient()
  const [clubs, payments, saas] = await Promise.all([
    client
      .from('clubs')
      .select('id, name, status, city, created_at, contract_expires_at')
      .gte('created_at', since)
      .order('created_at', { ascending: false })
      .limit(8),
    client
      .from('platform_payments')
      .select('id, payer_name, payer_email, amount, status, created_at, target_type')
      .order('created_at', { ascending: false })
      .limit(20),
    boost
      ? boost
          .from('organizations')
          .select(
            'id, name, owner_email, status, subscription_expires_at, plan_type'
          )
          .eq('source', 'boost')
          .order('subscription_expires_at', { ascending: true })
          .limit(40)
      : Promise.resolve({
          data: null as
            | {
                id: string
                name: string
                owner_email: string | null
                status: string
                subscription_expires_at: string | null
                plan_type: string
              }[]
            | null,
          error: { message: 'no boost' } as { message: string } | null,
        }),
  ])

  const sections: OpsSection[] = []

  if (clubs.error) {
    sections.push({
      key: 'padel1_clubs',
      label: 'Clubes Padel1 recentes',
      product: 'padel1',
      href: clubsHref,
      count: null,
      items: [],
      status: 'degraded',
      error: clubs.error.message,
    })
  } else {
    const rows = clubs.data || []
    sections.push({
      key: 'padel1_clubs',
      label: 'Clubes novos (30 dias)',
      product: 'padel1',
      href: clubsHref,
      count: rows.length,
      status: 'ok',
      items: rows.map((c) => ({
        id: c.id,
        product: 'padel1',
        title: c.name,
        subtitle: [c.status, c.city].filter(Boolean).join(' · '),
        meta: fmtWhen(c.created_at),
        href: clubsHref,
        tone: 'default',
      })),
    })

  }

  const expiringRes = await client
    .from('clubs')
    .select('id, name, contract_expires_at')
    .not('contract_expires_at', 'is', null)
    .gte('contract_expires_at', new Date(now).toISOString())
    .lte('contract_expires_at', new Date(in30).toISOString())
    .order('contract_expires_at', { ascending: true })
    .limit(8)

  if (!expiringRes.error && (expiringRes.data || []).length) {
    const expiring = expiringRes.data || []
    sections.push({
      key: 'padel1_expiring',
      label: 'Contratos a expirar (30d)',
      product: 'padel1',
      href: clubsHref,
      count: expiring.length,
      status: 'ok',
      items: expiring.map((c) => ({
        id: `exp-${c.id}`,
        product: 'padel1',
        title: c.name,
        subtitle: `Expira ${fmtWhen(c.contract_expires_at)}`,
        href: clubsHref,
        tone: 'warn',
      })),
    })
  }

  if (!payments.error && payments.data) {
    const openPay = payments.data.filter(
      (p) =>
        !['completed', 'paid', 'succeeded'].includes(
          String(p.status || '').toLowerCase()
        )
    )
    if (openPay.length) {
      sections.push({
        key: 'padel1_payments',
        label: 'Pagamentos plataforma abertos',
        product: 'padel1',
        href: txHref,
        count: openPay.length,
        status: 'ok',
        items: openPay.slice(0, 8).map((p) => ({
          id: p.id,
          product: 'padel1',
          title: p.payer_name || p.payer_email || 'Pagamento',
          subtitle: `${p.status} · €${Number(p.amount || 0)} · ${p.target_type}`,
          meta: fmtWhen(p.created_at),
          href: txHref,
          tone: 'hot',
        })),
      })
    }
  }

  const saasData = saas.data
  const saasErr = saas.error
  if (!saasErr && Array.isArray(saasData)) {
    const atRisk = saasData.filter((o) => {
      const exp = o.subscription_expires_at
        ? new Date(o.subscription_expires_at).getTime()
        : null
      const expired = exp !== null && exp < now
      const soon = exp !== null && exp >= now && exp <= in30
      return o.status === 'suspended' || expired || soon
    })
    if (atRisk.length) {
      sections.push({
        key: 'saas_tour_risk',
        label: 'SaaS Tour em risco / a renovar',
        product: 'padel1',
        href: saasHref,
        count: atRisk.length,
        status: 'ok',
        items: atRisk.slice(0, 8).map((o) => ({
          id: o.id,
          product: 'padel1',
          title: o.name,
          subtitle: `${o.plan_type} · ${o.status}${
            o.subscription_expires_at
              ? ` · fim ${fmtWhen(o.subscription_expires_at)}`
              : ''
          }`,
          href: saasHref,
          tone: 'warn',
        })),
      })
    }
  }

  return sections
}

export async function fetchOpsFeed(): Promise<OpsSection[]> {
  const [boostOrders, ebookLeads, seLeads, sePartners, seBookings, padel1] =
    await Promise.all([
      fetchBoostOpenOrders(),
      fetchBoostEbookLeadsRecent(),
      fetchSeOpenLeads(),
      fetchSePartnersToContact(),
      fetchSePendingPackageBookings(),
      fetchPadel1Ops(),
    ])

  return [
    boostOrders,
    ebookLeads,
    seLeads,
    sePartners,
    seBookings,
    ...padel1,
  ]
}
