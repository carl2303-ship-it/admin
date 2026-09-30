import { requireBoostClient, BoostConfigError } from './client'
import type {
  BoostBlogPost,
  BoostBrand,
  BoostCategory,
  BoostDiscount,
  BoostEbookLead,
  BoostEbookPurchase,
  BoostNewsletterSubscriber,
  BoostOrder,
  BoostOrderItem,
  BoostOrganization,
  BoostProduct,
  BoostStageRegistration,
} from './types'
import { PLAN_PRICES } from './types'

export type QueryResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; missingConfig?: boolean }

function wrapError(err: unknown): QueryResult<never> {
  if (err instanceof BoostConfigError) {
    return { ok: false, error: err.message, missingConfig: true }
  }
  return {
    ok: false,
    error: err instanceof Error ? err.message : 'Erro desconhecido',
  }
}

async function listTable<T>(
  table: string,
  opts?: { order?: string; ascending?: boolean; limit?: number; eq?: [string, string] }
): Promise<QueryResult<T[]>> {
  try {
    const client = requireBoostClient()
    let q = client.from(table).select('*')
    if (opts?.eq) q = q.eq(opts.eq[0], opts.eq[1])
    if (opts?.order) q = q.order(opts.order, { ascending: opts.ascending ?? false })
    if (opts?.limit) q = q.limit(opts.limit)
    const { data, error } = await q
    if (error) return { ok: false, error: error.message }
    return { ok: true, data: (data || []) as T[] }
  } catch (e) {
    return wrapError(e)
  }
}

export async function listProducts(): Promise<QueryResult<BoostProduct[]>> {
  try {
    const client = requireBoostClient()
    const { data, error } = await client
      .from('products')
      .select(`*, category:categories(name), brand:brands(name)`)
      .order('created_at', { ascending: false })
    if (error) return { ok: false, error: error.message }
    return { ok: true, data: (data || []) as BoostProduct[] }
  } catch (e) {
    return wrapError(e)
  }
}

export async function getProduct(id: string): Promise<QueryResult<BoostProduct | null>> {
  try {
    const client = requireBoostClient()
    const { data, error } = await client.from('products').select('*').eq('id', id).maybeSingle()
    if (error) return { ok: false, error: error.message }
    return { ok: true, data: data as BoostProduct | null }
  } catch (e) {
    return wrapError(e)
  }
}

export async function listOrders(): Promise<QueryResult<BoostOrder[]>> {
  return listTable<BoostOrder>('orders', { order: 'created_at', limit: 200 })
}

export async function getOrderDetail(id: string): Promise<
  QueryResult<{ order: BoostOrder; items: BoostOrderItem[] } | null>
> {
  try {
    const client = requireBoostClient()
    const { data: order, error } = await client.from('orders').select('*').eq('id', id).maybeSingle()
    if (error) return { ok: false, error: error.message }
    if (!order) return { ok: true, data: null }
    const { data: items, error: itemsError } = await client
      .from('order_items')
      .select('*')
      .eq('order_id', id)
    if (itemsError) return { ok: false, error: itemsError.message }
    return {
      ok: true,
      data: { order: order as BoostOrder, items: (items || []) as BoostOrderItem[] },
    }
  } catch (e) {
    return wrapError(e)
  }
}

export async function listCategories(): Promise<QueryResult<BoostCategory[]>> {
  return listTable<BoostCategory>('categories', { order: 'display_order', ascending: true })
}

export async function listBrands(): Promise<QueryResult<BoostBrand[]>> {
  return listTable<BoostBrand>('brands', { order: 'display_order', ascending: true })
}

export async function listDiscounts(): Promise<QueryResult<BoostDiscount[]>> {
  return listTable<BoostDiscount>('discount_codes', { order: 'created_at' })
}

export async function listSaasLicenses(): Promise<QueryResult<BoostOrganization[]>> {
  return listTable<BoostOrganization>('organizations', {
    order: 'created_at',
    eq: ['source', 'boost'],
  })
}

export function saasKpis(orgs: BoostOrganization[]) {
  const now = Date.now()
  const isExpired = (o: BoostOrganization) =>
    Boolean(o.subscription_expires_at && new Date(o.subscription_expires_at).getTime() < now)
  const active = orgs.filter((o) => o.status === 'active' && !isExpired(o))
  const atRisk = orgs.filter((o) => o.status === 'suspended' || isExpired(o))
  const mrr = active.reduce((sum, org) => sum + (PLAN_PRICES[org.plan_type] || 0), 0)
  return { active: active.length, atRisk: atRisk.length, mrr, total: orgs.length }
}

export async function boostModuleCounts(): Promise<
  QueryResult<{
    products: number
    orders: number
    discounts: number
    saas: number
    blog: number
    stages: number
    newsletter: number
    ebookLeads: number
    ebookPurchases: number
  }>
> {
  try {
    const client = requireBoostClient()
    const tables = [
      ['products', null],
      ['orders', null],
      ['discount_codes', null],
      ['organizations', ['source', 'boost']],
      ['blog_posts', null],
      ['stage_registrations', null],
      ['newsletter_subscribers', null],
      ['ebook_leads', null],
      ['ebook_purchases', null],
    ] as const
    const results = await Promise.all(
      tables.map(([table, eq]) => {
        let q = client.from(table).select('id', { count: 'exact', head: true })
        if (eq) q = q.eq(eq[0], eq[1])
        return q
      })
    )
    const err = results.find((r) => r.error)?.error
    if (err) return { ok: false, error: err.message }
    const [products, orders, discounts, saas, blog, stages, newsletter, ebookLeads, ebookPurchases] =
      results
    return {
      ok: true,
      data: {
        products: products.count ?? 0,
        orders: orders.count ?? 0,
        discounts: discounts.count ?? 0,
        saas: saas.count ?? 0,
        blog: blog.count ?? 0,
        stages: stages.count ?? 0,
        newsletter: newsletter.count ?? 0,
        ebookLeads: ebookLeads.count ?? 0,
        ebookPurchases: ebookPurchases.count ?? 0,
      },
    }
  } catch (e) {
    return wrapError(e)
  }
}

export async function listBlogPosts(): Promise<QueryResult<BoostBlogPost[]>> {
  return listTable<BoostBlogPost>('blog_posts', { order: 'created_at' })
}

export async function listStageRegistrations(): Promise<QueryResult<BoostStageRegistration[]>> {
  return listTable<BoostStageRegistration>('stage_registrations', {
    order: 'created_at',
    limit: 500,
  })
}

export async function listNewsletterSubscribers(): Promise<
  QueryResult<BoostNewsletterSubscriber[]>
> {
  return listTable<BoostNewsletterSubscriber>('newsletter_subscribers', {
    order: 'subscribed_at',
    limit: 2000,
  })
}

export async function listEbookLeads(): Promise<QueryResult<BoostEbookLead[]>> {
  return listTable<BoostEbookLead>('ebook_leads', { order: 'created_at', limit: 2000 })
}

export async function listEbookPurchases(): Promise<QueryResult<BoostEbookPurchase[]>> {
  return listTable<BoostEbookPurchase>('ebook_purchases', { order: 'created_at', limit: 2000 })
}

export async function getBoostAnalytics(input: {
  period?: string
  compare?: string
}): Promise<
  QueryResult<{
    period: string
    compare: string
    revenue: number
    sales: number
    avgTicket: number
    customers: number
    revenueChange: number | null
    salesChange: number | null
    avgChange: number | null
    customersChange: number | null
    saas: {
      active: number
      mrr: number
      atRisk: number
      newInPeriod: number
      newChange: number | null
      byPlan: Record<string, number>
    }
    daily: { date: string; sales: number; revenue: number; avg: number }[]
    topProducts: { name: string; quantity: number; revenue: number }[]
  }>
> {
  try {
    const period = input.period || 'month'
    const compare = input.compare || 'previous'
    const client = requireBoostClient()
    const end = new Date()
    const start = new Date()
    start.setMonth(end.getMonth() - 1)
    const startIso = start.toISOString()
    const endIso = end.toISOString()
    const [ordersRes, ebooksRes, orgsRes] = await Promise.all([
      client
        .from('orders')
        .select('*')
        .gte('created_at', startIso)
        .lte('created_at', endIso)
        .in('status', ['paid', 'shipped', 'delivered']),
      client
        .from('ebook_purchases')
        .select('*')
        .gte('created_at', startIso)
        .lte('created_at', endIso)
        .eq('status', 'completed'),
      client.from('organizations').select('*').eq('source', 'boost'),
    ])
    if (ordersRes.error) return { ok: false, error: ordersRes.error.message }
    if (ebooksRes.error) return { ok: false, error: ebooksRes.error.message }
    if (orgsRes.error) return { ok: false, error: orgsRes.error.message }
    const salesRows = [
      ...(ordersRes.data || []).map((o) => ({
        amount: Number(o.total || 0),
        email: o.customer_email as string | null,
        created_at: o.created_at as string,
      })),
      ...(ebooksRes.data || []).map((p) => ({
        amount: Number(p.amount || 0),
        email: p.customer_email as string | null,
        created_at: p.created_at as string,
      })),
    ]
    const revenue = salesRows.reduce((s, x) => s + x.amount, 0)
    const sales = salesRows.length
    const avgTicket = sales > 0 ? revenue / sales : 0
    const customers = new Set(salesRows.map((s) => s.email).filter(Boolean)).size
    const orgs = (orgsRes.data || []) as BoostOrganization[]
    const kpis = saasKpis(orgs)
    const byPlan: Record<string, number> = { bronze: 0, silver: 0, gold: 0, platinum: 0 }
    for (const o of orgs) {
      if (o.status === 'active') byPlan[o.plan_type] = (byPlan[o.plan_type] || 0) + 1
    }
    const dailyMap: Record<string, { sales: number; revenue: number }> = {}
    for (const sale of salesRows) {
      const date = new Date(sale.created_at).toISOString().slice(0, 10)
      if (!dailyMap[date]) dailyMap[date] = { sales: 0, revenue: 0 }
      dailyMap[date].sales += 1
      dailyMap[date].revenue += sale.amount
    }
    const daily = Object.entries(dailyMap)
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([date, v]) => ({
        date,
        sales: v.sales,
        revenue: v.revenue,
        avg: v.sales > 0 ? v.revenue / v.sales : 0,
      }))
    return {
      ok: true,
      data: {
        period,
        compare,
        revenue,
        sales,
        avgTicket,
        customers,
        revenueChange: null,
        salesChange: null,
        avgChange: null,
        customersChange: null,
        saas: {
          active: kpis.active,
          mrr: kpis.mrr,
          atRisk: kpis.atRisk,
          newInPeriod: 0,
          newChange: null,
          byPlan,
        },
        daily,
        topProducts: [],
      },
    }
  } catch (e) {
    return wrapError(e)
  }
}

export async function getStripeVisibility(): Promise<
  QueryResult<{
    edgeConfigured: boolean
    storeUrl: string
    subscriptions: {
      id: string
      name: string
      owner_email: string | null
      plan_type: string
      status: string
      stripe_subscription_id: string | null
      cancel_at_period_end: boolean | null
      subscription_expires_at: string | null
    }[]
    recentEbookSessions: BoostEbookPurchase[]
    withStripeSub: number
    withoutStripeSub: number
  }>
> {
  try {
    const client = requireBoostClient()
    const [orgs, purchases] = await Promise.all([
      client
        .from('organizations')
        .select(
          'id, name, owner_email, plan_type, status, stripe_subscription_id, cancel_at_period_end, subscription_expires_at'
        )
        .eq('source', 'boost')
        .order('created_at', { ascending: false }),
      client.from('ebook_purchases').select('*').order('created_at', { ascending: false }).limit(30),
    ])
    if (orgs.error) return { ok: false, error: orgs.error.message }
    if (purchases.error) return { ok: false, error: purchases.error.message }
    const subscriptions = (orgs.data || []) as {
      id: string
      name: string
      owner_email: string | null
      plan_type: string
      status: string
      stripe_subscription_id: string | null
      cancel_at_period_end: boolean | null
      subscription_expires_at: string | null
    }[]
    return {
      ok: true,
      data: {
        edgeConfigured: Boolean(
          process.env.BOOST_SUPABASE_URL &&
            (process.env.BOOST_EDGE_AUTH_EMAIL || process.env.BOOST_EDGE_USER_ID) &&
            process.env.BOOST_SUPABASE_ANON_KEY
        ),
        storeUrl: process.env.NEXT_PUBLIC_BOOST_STORE_URL || 'https://boostpadel.store',
        subscriptions,
        recentEbookSessions: (purchases.data || []) as BoostEbookPurchase[],
        withStripeSub: subscriptions.filter((s) => s.stripe_subscription_id).length,
        withoutStripeSub: subscriptions.filter((s) => !s.stripe_subscription_id).length,
      },
    }
  } catch (e) {
    return wrapError(e)
  }
}
