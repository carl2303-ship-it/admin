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
