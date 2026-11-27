'use server'

import { createPadel1ServiceClient } from '@/lib/supabase/admin'
import { requireBoostClient } from './client'
import { guardWrite, revalidateBoost, type ActionResult } from './actions-shared'
import {
  buildStoreListingPayload,
  type MarketplaceListingStatus,
} from './marketplace-sync'

const LISTINGS_TABLE = 'marketplace_listings'
const MISSING_TABLE_HINT =
  'Tabela marketplace_listings ainda não existe no Padel1 (migration do Player). Aplica o schema e tenta de novo.'

const MISSING_ENV =
  'PADEL1_SUPABASE_URL / PADEL1_SUPABASE_SERVICE_ROLE_KEY em falta no Netlify do admin (server-only).'

export type MarketplaceListingState = {
  listed: boolean
  status: MarketplaceListingStatus | null
  listingId: string | null
}

function isMissingTableError(message: string): boolean {
  return (
    /could not find the table/i.test(message) ||
    /relation .*marketplace_listings.* does not exist/i.test(message) ||
    /schema cache/i.test(message)
  )
}

function requirePadel1() {
  const client = createPadel1ServiceClient()
  if (!client) {
    return { ok: false as const, error: MISSING_ENV }
  }
  return { ok: true as const, client }
}

/**
 * Current Padel1 listing for a Store product (source=store).
 * Safe when table/env missing: returns listed=false + error message.
 */
export async function getStoreMarketplaceListingState(
  productId: string
): Promise<
  | { ok: true; data: MarketplaceListingState }
  | { ok: false; error: string; missingConfig?: boolean; missingTable?: boolean }
> {
  const g = await guardWrite()
  if (!g.ok) return g

  const padel1 = requirePadel1()
  if (!padel1.ok) {
    return { ok: false, error: padel1.error, missingConfig: true }
  }

  const { data, error } = await padel1.client
    .from(LISTINGS_TABLE)
    .select('id, status')
    .eq('source', 'store')
    .eq('store_product_id', productId)
    .maybeSingle()

  if (error) {
    if (isMissingTableError(error.message)) {
      return { ok: false, error: MISSING_TABLE_HINT, missingTable: true }
    }
    return { ok: false, error: error.message }
  }

  const status = (data?.status as MarketplaceListingStatus | undefined) ?? null
  const listed = Boolean(data?.id) && status === 'active'
  return {
    ok: true,
    data: {
      listed,
      status,
      listingId: data?.id ? String(data.id) : null,
    },
  }
}

type ProductRow = {
  id: string
  name: string
  price: number
  short_description: string | null
  description: string | null
  image_url: string | null
  additional_images: unknown
  category_id: string | null
  category?: { name: string; slug: string } | null
}

async function loadBoostProduct(
  productId: string
): Promise<{ ok: true; product: ProductRow } | { ok: false; error: string }> {
  const client = requireBoostClient()
  const { data, error } = await client
    .from('products')
    .select(
      'id, name, price, short_description, description, image_url, additional_images, category_id, category:categories(name, slug)'
    )
    .eq('id', productId)
    .maybeSingle()

  if (error) return { ok: false, error: error.message }
  if (!data) return { ok: false, error: 'Produto não encontrado' }
  return { ok: true, product: data as unknown as ProductRow }
}

async function upsertStoreListing(
  payload: ReturnType<typeof buildStoreListingPayload>
): Promise<{ ok: true; id: string | null } | { ok: false; error: string }> {
  const padel1 = requirePadel1()
  if (!padel1.ok) return padel1

  // Prefer upsert on store_product_id when unique index exists.
  const upsert = await padel1.client
    .from(LISTINGS_TABLE)
    .upsert(payload, { onConflict: 'store_product_id' })
    .select('id')
    .maybeSingle()

  if (!upsert.error && upsert.data) {
    return { ok: true, id: String(upsert.data.id) }
  }

  if (upsert.error && isMissingTableError(upsert.error.message)) {
    return { ok: false, error: MISSING_TABLE_HINT }
  }

  // Fallback: select + update/insert (no unique constraint yet).
  const existing = await padel1.client
    .from(LISTINGS_TABLE)
    .select('id')
    .eq('source', 'store')
    .eq('store_product_id', payload.store_product_id)
    .maybeSingle()

  if (existing.error) {
    if (isMissingTableError(existing.error.message)) {
      return { ok: false, error: MISSING_TABLE_HINT }
    }
    // Surface original upsert error if select also fails oddly.
    return {
      ok: false,
      error: upsert.error?.message || existing.error.message,
    }
  }

  if (existing.data?.id) {
    const { error } = await padel1.client
      .from(LISTINGS_TABLE)
      .update(payload)
      .eq('id', existing.data.id)
    if (error) return { ok: false, error: error.message }
    return { ok: true, id: String(existing.data.id) }
  }

  const { data: inserted, error: insertError } = await padel1.client
    .from(LISTINGS_TABLE)
    .insert(payload)
    .select('id')
    .maybeSingle()

  if (insertError) {
    if (isMissingTableError(insertError.message)) {
      return { ok: false, error: MISSING_TABLE_HINT }
    }
    return {
      ok: false,
      error:
        upsert.error?.message ||
        insertError.message ||
        'Falha ao criar listing Padel1',
    }
  }

  return { ok: true, id: inserted?.id ? String(inserted.id) : null }
}

/** Publish / refresh official Store product on Padel1 marketplace (idempotent). */
export async function addProductToPadel1Marketplace(
  productId: string
): Promise<ActionResult & { listingId?: string | null }> {
  const g = await guardWrite()
  if (!g.ok) return g

  try {
    const loaded = await loadBoostProduct(productId)
    if (!loaded.ok) return loaded

    const p = loaded.product
    const payload = buildStoreListingPayload({
      productId: p.id,
      name: p.name,
      price: Number(p.price) || 0,
      shortDescription: p.short_description,
      description: p.description,
      imageUrl: p.image_url,
      additionalImages: p.additional_images,
      categoryName: p.category?.name,
      categorySlug: p.category?.slug,
      status: 'active',
    })

    const result = await upsertStoreListing(payload)
    if (!result.ok) return result

    revalidateBoost([`/produtos/boost/produtos/${productId}`])
    return {
      ok: true,
      message: 'Produto adicionado à Padel1',
      listingId: result.id,
    }
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : 'Erro ao sincronizar com Padel1',
    }
  }
}

/** Soft-deactivate Store listing on Padel1 (idempotent). */
export async function removeProductFromPadel1Marketplace(
  productId: string
): Promise<ActionResult> {
  const g = await guardWrite()
  if (!g.ok) return g

  const padel1 = requirePadel1()
  if (!padel1.ok) return padel1

  try {
    const now = new Date().toISOString()
    const { data: existing, error: findError } = await padel1.client
      .from(LISTINGS_TABLE)
      .select('id, status')
      .eq('source', 'store')
      .eq('store_product_id', productId)
      .maybeSingle()

    if (findError) {
      if (isMissingTableError(findError.message)) {
        return { ok: false, error: MISSING_TABLE_HINT }
      }
      return { ok: false, error: findError.message }
    }

    if (!existing?.id) {
      return { ok: true, message: 'Já não estava na Padel1' }
    }

    if (existing.status === 'inactive') {
      return { ok: true, message: 'Já removido da Padel1' }
    }

    const { error } = await padel1.client
      .from(LISTINGS_TABLE)
      .update({ status: 'inactive', updated_at: now })
      .eq('id', existing.id)

    if (error) {
      if (isMissingTableError(error.message)) {
        return { ok: false, error: MISSING_TABLE_HINT }
      }
      return { ok: false, error: error.message }
    }

    revalidateBoost([`/produtos/boost/produtos/${productId}`])
    return { ok: true, message: 'Produto removido da Padel1' }
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : 'Erro ao remover da Padel1',
    }
  }
}
