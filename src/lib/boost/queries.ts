import { requireBoostClient, BoostConfigError } from './client'
import type {
  BoostBrand,
  BoostCategory,
  BoostDiscount,
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
  }>
> {
  try {
    const client = requireBoostClient()
    const [products, orders, discounts, saas] = await Promise.all([
      client.from('products').select('id', { count: 'exact', head: true }),
      client.from('orders').select('id', { count: 'exact', head: true }),
      client.from('discount_codes').select('id', { count: 'exact', head: true }),
      client
        .from('organizations')
        .select('id', { count: 'exact', head: true })
        .eq('source', 'boost'),
    ])
    const err =
      products.error || orders.error || discounts.error || saas.error
    if (err) return { ok: false, error: err.message }
    return {
      ok: true,
      data: {
        products: products.count ?? 0,
        orders: orders.count ?? 0,
        discounts: discounts.count ?? 0,
        saas: saas.count ?? 0,
      },
    }
  } catch (e) {
    return wrapError(e)
  }
}
