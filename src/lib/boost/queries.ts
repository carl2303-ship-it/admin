import { requireBoostClient, BoostConfigError } from './client'
import type {
  BoostBlogPost,
  BoostBrand,
  BoostCategory,
  BoostDiscount,
  BoostEbookFunnel,
  BoostEbookFunnelAsset,
  BoostEbookLead,
  BoostEbookPurchase,
  BoostNewsletterSubscriber,
  BoostOrder,
  BoostOrderItem,
  BoostOrganization,
  BoostProduct,
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

export async function listProducts(): Promise<QueryResult<BoostProduct[]>> {
  try {
    const client = requireBoostClient()
    const { data, error } = await client
      .from('products')
      .select(
        `
        *,
        category:categories(name),
        brand:brands(name)
      `
      )
      .order('created_at', { ascending: false })
    if (error) return { ok: false, error: error.message }
    return { ok: true, data: (data || []) as BoostProduct[] }
  } catch (e) {
    return wrapError(e)
  }
}

export async function getProduct(
  id: string
): Promise<QueryResult<BoostProduct | null>> {
  try {
    const client = requireBoostClient()
    const { data, error } = await client
      .from('products')
      .select('*')
      .eq('id', id)
      .maybeSingle()
    if (error) return { ok: false, error: error.message }
    return { ok: true, data: data as BoostProduct | null }
  } catch (e) {
    return wrapError(e)
  }
}

export async function listOrders(): Promise<QueryResult<BoostOrder[]>> {
  try {
    const client = requireBoostClient()
    const { data, error } = await client
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200)
    if (error) return { ok: false, error: error.message }
    return { ok: true, data: (data || []) as BoostOrder[] }
  } catch (e) {
    return wrapError(e)
  }
}

export async function getOrderDetail(id: string): Promise<
  QueryResult<{
    order: BoostOrder
    items: BoostOrderItem[]
  } | null>
> {
  try {
    const client = requireBoostClient()
    const { data: order, error } = await client
      .from('orders')
      .select('*')
      .eq('id', id)
      .maybeSingle()
    if (error) return { ok: false, error: error.message }
    if (!order) return { ok: true, data: null }
    const { data: items, error: itemsError } = await client
      .from('order_items')
      .select('*')
      .eq('order_id', id)
    if (itemsError) return { ok: false, error: itemsError.message }
    return {
      ok: true,
      data: {
        order: order as BoostOrder,
        items: (items || []) as BoostOrderItem[],
      },
    }
  } catch (e) {
    return wrapError(e)
  }
}

export async function listCategories(): Promise<QueryResult<BoostCategory[]>> {
  try {
    const client = requireBoostClient()
    const { data, error } = await client
      .from('categories')
      .select('*')
      .order('display_order', { ascending: true })
    if (error) return { ok: false, error: error.message }
    return { ok: true, data: (data || []) as BoostCategory[] }
  } catch (e) {
    return wrapError(e)
  }
}

export async function listBrands(): Promise<QueryResult<BoostBrand[]>> {
  try {
    const client = requireBoostClient()
    const { data, error } = await client
      .from('brands')
      .select('*')
      .order('display_order', { ascending: true })
    if (error) return { ok: false, error: error.message }
    return { ok: true, data: (data || []) as BoostBrand[] }
  } catch (e) {
    return wrapError(e)
  }
}

export async function listDiscounts(): Promise<QueryResult<BoostDiscount[]>> {
  try {
    const client = requireBoostClient()
    const { data, error } = await client
      .from('discount_codes')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) return { ok: false, error: error.message }
    return { ok: true, data: (data || []) as BoostDiscount[] }
  } catch (e) {
    return wrapError(e)
  }
}

export async function listSaasLicenses(): Promise<
  QueryResult<BoostOrganization[]>
> {
  try {
    const client = requireBoostClient()
    const { data, error } = await client
      .from('organizations')
      .select('*')
      .eq('source', 'boost')
      .order('created_at', { ascending: false })
    if (error) return { ok: false, error: error.message }
    return { ok: true, data: (data || []) as BoostOrganization[] }
  } catch (e) {
    return wrapError(e)
  }
}

export function saasKpis(orgs: BoostOrganization[]) {
  const now = Date.now()
  const isExpired = (o: BoostOrganization) =>
    Boolean(
      o.subscription_expires_at &&
        new Date(o.subscription_expires_at).getTime() < now
    )
  const active = orgs.filter((o) => o.status === 'active' && !isExpired(o))
  const atRisk = orgs.filter((o) => o.status === 'suspended' || isExpired(o))
  const mrr = active.reduce(
    (sum, org) => sum + (PLAN_PRICES[org.plan_type] || 0),
    0
  )
  return {
    active: active.length,
    atRisk: atRisk.length,
    mrr,
    total: orgs.length,
  }
}

export async function boostModuleCounts(): Promise<
  QueryResult<{
    products: number
    orders: number
    discounts: number
    saas: number
    blog: number
    newsletter: number
    ebookLeads: number
    ebookPurchases: number
  }>
> {
  try {
    const client = requireBoostClient()
    const [
      products,
      orders,
      discounts,
      saas,
      blog,
      newsletter,
      ebookLeads,
      ebookPurchases,
    ] = await Promise.all([
      client.from('products').select('id', { count: 'exact', head: true }),
      client.from('orders').select('id', { count: 'exact', head: true }),
      client.from('discount_codes').select('id', { count: 'exact', head: true }),
      client
        .from('organizations')
        .select('id', { count: 'exact', head: true })
        .eq('source', 'boost'),
      client.from('blog_posts').select('id', { count: 'exact', head: true }),
      client
        .from('newsletter_subscribers')
        .select('id', { count: 'exact', head: true }),
      client.from('ebook_leads').select('id', { count: 'exact', head: true }),
      client
        .from('ebook_purchases')
        .select('id', { count: 'exact', head: true }),
    ])
    const err =
      products.error ||
      orders.error ||
      discounts.error ||
      saas.error ||
      blog.error ||
      newsletter.error ||
      ebookLeads.error ||
      ebookPurchases.error
    if (err) return { ok: false, error: err.message }
    return {
      ok: true,
      data: {
        products: products.count ?? 0,
        orders: orders.count ?? 0,
        discounts: discounts.count ?? 0,
        saas: saas.count ?? 0,
        blog: blog.count ?? 0,
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
  try {
    const client = requireBoostClient()
    const { data, error } = await client
      .from('blog_posts')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) return { ok: false, error: error.message }
    return { ok: true, data: (data || []) as BoostBlogPost[] }
  } catch (e) {
    return wrapError(e)
  }
}

export async function listNewsletterSubscribers(): Promise<
  QueryResult<BoostNewsletterSubscriber[]>
> {
  try {
    const client = requireBoostClient()
    const { data, error } = await client
      .from('newsletter_subscribers')
      .select('*')
      .order('subscribed_at', { ascending: false })
      .limit(2000)
    if (error) return { ok: false, error: error.message }
    return { ok: true, data: (data || []) as BoostNewsletterSubscriber[] }
  } catch (e) {
    return wrapError(e)
  }
}

export async function listEbookLeads(): Promise<QueryResult<BoostEbookLead[]>> {
  try {
    const client = requireBoostClient()
    const { data, error } = await client
      .from('ebook_leads')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(2000)
    if (error) return { ok: false, error: error.message }
    return { ok: true, data: (data || []) as BoostEbookLead[] }
  } catch (e) {
    return wrapError(e)
  }
}

export async function listEbookPurchases(): Promise<
  QueryResult<BoostEbookPurchase[]>
> {
  try {
    const client = requireBoostClient()
    const { data, error } = await client
      .from('ebook_purchases')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(2000)
    if (error) return { ok: false, error: error.message }
    return { ok: true, data: (data || []) as BoostEbookPurchase[] }
  } catch (e) {
    return wrapError(e)
  }
}

export async function listEbookFunnels(): Promise<
  QueryResult<BoostEbookFunnel[]>
> {
  try {
    const client = requireBoostClient()
    const { data, error } = await client
      .from('ebook_funnels')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) return { ok: false, error: error.message }
    return { ok: true, data: (data || []) as BoostEbookFunnel[] }
  } catch (e) {
    return wrapError(e)
  }
}

export async function getEbookFunnel(
  id: string
): Promise<
  QueryResult<{ funnel: BoostEbookFunnel; assets: BoostEbookFunnelAsset[] } | null>
> {
  try {
    const client = requireBoostClient()
    const { data: funnel, error } = await client
      .from('ebook_funnels')
      .select('*')
      .eq('id', id)
      .maybeSingle()
    if (error) return { ok: false, error: error.message }
    if (!funnel) return { ok: true, data: null }

    const { data: assets, error: assetsError } = await client
      .from('ebook_funnel_assets')
      .select('*')
      .eq('funnel_id', id)
      .order('language', { ascending: true })
    if (assetsError) return { ok: false, error: assetsError.message }

    return {
      ok: true,
      data: {
        funnel: funnel as BoostEbookFunnel,
        assets: (assets || []) as BoostEbookFunnelAsset[],
      },
    }
  } catch (e) {
    return wrapError(e)
  }
}

function periodBounds(period: string): { start: string; end: string } {
  const end = new Date()
  const start = new Date()
  switch (period) {
    case 'week':
      start.setDate(end.getDate() - 7)
      break
    case 'quarter':
      start.setMonth(end.getMonth() - 3)
      break
    case 'year':
      start.setFullYear(end.getFullYear() - 1)
      break
    case 'all':
      start.setFullYear(2020, 0, 1)
      break
    case 'month':
    default:
      start.setMonth(end.getMonth() - 1)
      break
  }
  return { start: start.toISOString(), end: end.toISOString() }
}

function compareBounds(
  period: string,
  compare: string
): { start: string; end: string } | null {
  if (compare === 'none') return null
  const current = periodBounds(period)
  const currentStart = new Date(current.start)
  const currentEnd = new Date(current.end)
  const diff = currentEnd.getTime() - currentStart.getTime()
  if (compare === 'year') {
    const start = new Date(currentStart)
    start.setFullYear(start.getFullYear() - 1)
    const end = new Date(currentEnd)
    end.setFullYear(end.getFullYear() - 1)
    return { start: start.toISOString(), end: end.toISOString() }
  }
  const end = new Date(currentStart)
  const start = new Date(currentStart.getTime() - diff)
  return { start: start.toISOString(), end: end.toISOString() }
}

function pctChange(current: number, previous: number) {
  if (previous > 0) return ((current - previous) / previous) * 100
  if (current > 0) return 100
  return 0
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
    byCategory: { name: string; revenue: number; pct: number }[]
  }>
> {
  try {
    const period = input.period || 'month'
    const compare = input.compare || 'previous'
    const bounds = periodBounds(period)
    const prev = compareBounds(period, compare)
    const client = requireBoostClient()

    const [ordersRes, ebooksRes, orgsRes, productsRes] = await Promise.all([
      client
        .from('orders')
        .select('*')
        .gte('created_at', bounds.start)
        .lte('created_at', bounds.end)
        .in('status', ['paid', 'shipped', 'delivered']),
      client
        .from('ebook_purchases')
        .select('*')
        .gte('created_at', bounds.start)
        .lte('created_at', bounds.end)
        .eq('status', 'completed'),
      client.from('organizations').select('*').eq('source', 'boost'),
      client
        .from('products')
        .select('id, name, category_id, categories(name)'),
    ])

    if (ordersRes.error) return { ok: false, error: ordersRes.error.message }
    if (ebooksRes.error) return { ok: false, error: ebooksRes.error.message }
    if (orgsRes.error) return { ok: false, error: orgsRes.error.message }

    type Sale = {
      customer_email?: string | null
      amount: number
      created_at: string
      items?: unknown
    }

    const orders = ordersRes.data || []
    const orderIds = orders.map((o) => o.id as string).filter(Boolean)

    let orderItems: {
      order_id: string
      product_name?: string | null
      product_id?: string | null
      quantity?: number | null
      subtotal?: number | null
      product_price?: number | null
    }[] = []

    if (orderIds.length > 0) {
      const { data: itemsData, error: itemsError } = await client
        .from('order_items')
        .select('*')
        .in('order_id', orderIds)
      if (itemsError) return { ok: false, error: itemsError.message }
      orderItems = (itemsData || []) as typeof orderItems
    }

    const currentSales: Sale[] = [
      ...orders.map((o) => ({
        ...o,
        amount: Number(o.total || 0),
      })),
      ...(ebooksRes.data || []).map((p) => ({
        ...p,
        amount: Number(p.amount || 0),
      })),
    ]

    const revenue = currentSales.reduce((s, x) => s + x.amount, 0)
    const sales = currentSales.length
    const avgTicket = sales > 0 ? revenue / sales : 0
    const customers = new Set(
      currentSales.map((s) => s.customer_email).filter(Boolean)
    ).size

    let revenueChange: number | null = null
    let salesChange: number | null = null
    let avgChange: number | null = null
    let customersChange: number | null = null
    let prevNewSaas = 0

    if (prev) {
      const [prevOrders, prevEbooks] = await Promise.all([
        client
          .from('orders')
          .select('*')
          .gte('created_at', prev.start)
          .lte('created_at', prev.end)
          .in('status', ['paid', 'shipped', 'delivered']),
        client
          .from('ebook_purchases')
          .select('*')
          .gte('created_at', prev.start)
          .lte('created_at', prev.end)
          .eq('status', 'completed'),
      ])
      const prevSales = [
        ...(prevOrders.data || []).map((o) => ({
          amount: Number(o.total || 0),
          customer_email: o.customer_email as string | null,
        })),
        ...(prevEbooks.data || []).map((p) => ({
          amount: Number(p.amount || 0),
          customer_email: p.customer_email as string | null,
        })),
      ]
      const prevRevenue = prevSales.reduce((s, x) => s + x.amount, 0)
      const prevSalesCount = prevSales.length
      const prevAvg = prevSalesCount > 0 ? prevRevenue / prevSalesCount : 0
      const prevCustomers = new Set(
        prevSales.map((s) => s.customer_email).filter(Boolean)
      ).size
      revenueChange = pctChange(revenue, prevRevenue)
      salesChange = pctChange(sales, prevSalesCount)
      avgChange = pctChange(avgTicket, prevAvg)
      customersChange = pctChange(customers, prevCustomers)

      const orgs = (orgsRes.data || []) as BoostOrganization[]
      prevNewSaas = orgs.filter(
        (o) =>
          o.created_at >= prev.start && o.created_at <= prev.end
      ).length
    }

    const orgs = (orgsRes.data || []) as BoostOrganization[]
    const kpis = saasKpis(orgs)
    const newInPeriod = orgs.filter(
      (o) => o.created_at >= bounds.start && o.created_at <= bounds.end
    ).length
    const byPlan: Record<string, number> = {
      bronze: 0,
      silver: 0,
      gold: 0,
      platinum: 0,
    }
    for (const o of orgs) {
      if (o.status === 'active') {
        byPlan[o.plan_type] = (byPlan[o.plan_type] || 0) + 1
      }
    }

    type ProductRow = {
      id: string
      name: string
      category_id?: string | null
      categories?: { name?: string } | { name?: string }[] | null
    }
    const products = (productsRes.data || []) as ProductRow[]
    const productById = new Map(products.map((p) => [p.id, p]))
    const productByName = new Map(
      products.map((p) => [p.name.toLowerCase(), p])
    )

    function categoryNameForProduct(p: ProductRow | undefined): string {
      if (!p) return 'Sem Categoria'
      const cat = p.categories
      if (Array.isArray(cat)) return cat[0]?.name || 'Sem Categoria'
      return cat?.name || 'Sem Categoria'
    }

    const productAgg: Record<
      string,
      { name: string; quantity: number; revenue: number }
    > = {}
    const categoryAgg: Record<string, number> = {}

    function addLine(opts: {
      productId?: string | null
      productName?: string | null
      quantity: number
      subtotal: number
    }) {
      const byId = opts.productId
        ? productById.get(opts.productId)
        : undefined
      const byName = opts.productName
        ? productByName.get(opts.productName.toLowerCase())
        : undefined
      const product = byId || byName
      const name =
        product?.name || opts.productName || 'Produto desconhecido'
      if (!productAgg[name]) {
        productAgg[name] = { name, quantity: 0, revenue: 0 }
      }
      productAgg[name].quantity += opts.quantity
      productAgg[name].revenue += opts.subtotal

      const catName = categoryNameForProduct(product)
      categoryAgg[catName] = (categoryAgg[catName] || 0) + opts.subtotal
    }

    // Preferência: order_items (fonte normalizada)
    for (const item of orderItems) {
      addLine({
        productId: item.product_id,
        productName: item.product_name,
        quantity: Number(item.quantity || 0),
        subtotal: Number(
          item.subtotal ??
            Number(item.product_price || 0) * Number(item.quantity || 0)
        ),
      })
    }

    // Fallback / complemento: orders.items embutidos (quando não há order_items)
    if (orderItems.length === 0) {
      for (const order of orders) {
        const items = Array.isArray(order.items) ? order.items : []
        for (const item of items as {
          product_id?: string
          name?: string
          quantity?: number
          subtotal?: number
        }[]) {
          addLine({
            productId: item.product_id,
            productName: item.name,
            quantity: Number(item.quantity || 0),
            subtotal: Number(item.subtotal || 0),
          })
        }
      }
    }

    const topProducts = Object.values(productAgg)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5)

    const categoryTotal = Object.values(categoryAgg).reduce((s, v) => s + v, 0)
    const byCategory = Object.entries(categoryAgg)
      .sort((a, b) => b[1] - a[1])
      .map(([name, amount]) => ({
        name,
        revenue: amount,
        pct: categoryTotal > 0 ? (amount / categoryTotal) * 100 : 0,
      }))

    const dailyMap: Record<string, { sales: number; revenue: number }> = {}
    for (const sale of currentSales) {
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
        revenueChange,
        salesChange,
        avgChange,
        customersChange,
        saas: {
          active: kpis.active,
          mrr: kpis.mrr,
          atRisk: kpis.atRisk,
          newInPeriod,
          newChange: prev ? pctChange(newInPeriod, prevNewSaas) : null,
          byPlan,
        },
        daily,
        topProducts,
        byCategory,
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
      client
        .from('ebook_purchases')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(30),
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

    const edgeConfigured = Boolean(
      process.env.BOOST_SUPABASE_URL &&
        (process.env.BOOST_EDGE_AUTH_EMAIL || process.env.BOOST_EDGE_USER_ID) &&
        process.env.BOOST_SUPABASE_ANON_KEY
    )

    return {
      ok: true,
      data: {
        edgeConfigured,
        storeUrl:
          process.env.NEXT_PUBLIC_BOOST_STORE_URL || 'https://boostpadel.store',
        subscriptions,
        recentEbookSessions: (purchases.data || []) as BoostEbookPurchase[],
        withStripeSub: subscriptions.filter((s) => s.stripe_subscription_id)
          .length,
        withoutStripeSub: subscriptions.filter((s) => !s.stripe_subscription_id)
          .length,
      },
    }
  } catch (e) {
    return wrapError(e)
  }
}
