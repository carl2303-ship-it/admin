'use server'

import { requireBoostClient } from './client'
import {
  guardWrite,
  revalidateBoost,
  type ActionResult,
} from './actions-shared'
import {
  LEGACY_PADEL_IQ,
  funnelPublicUrls,
  storeBaseUrl,
} from './legacy-padel-iq'

// --- Funnel ↔ loja + import legado PADEL IQ ---

const DIGITAL_CATEGORY_ID = '538a9bcb-248a-4bf8-898a-4cc15309a9d7'

function learnMoreUrlForFunnel(slug: string): string {
  const base = storeBaseUrl()
  if (slug === LEGACY_PADEL_IQ.slug) {
    return `${base}${LEGACY_PADEL_IQ.legacy_landing_path}`
  }
  return funnelPublicUrls(slug).landing
}

export async function importLegacyPadelIqFunnel(): Promise<
  ActionResult & { id?: string }
> {
  const g = await guardWrite()
  if (!g.ok) return g

  try {
    const client = requireBoostClient()
    const L = LEGACY_PADEL_IQ

    const { data: existing } = await client
      .from('ebook_funnels')
      .select('id')
      .eq('slug', L.slug)
      .maybeSingle()

    let funnelId = existing?.id as string | undefined

    if (funnelId) {
      const { error } = await client
        .from('ebook_funnels')
        .update({
          title: L.title,
          ebook_price_cents: L.ebook_price_cents,
          upsell_price_cents: L.upsell_price_cents,
          ebook_product_type: L.ebook_product_type,
          upsell_product_type: L.upsell_product_type,
          stripe_ebook_name: L.stripe_ebook_name,
          stripe_upsell_name: L.stripe_upsell_name,
          languages: L.languages,
          headline: L.headline,
          subheadline: L.subheadline,
          cta_label: L.cta_label,
          status: L.status,
        })
        .eq('id', funnelId)
      if (error) return { ok: false, error: error.message }
    } else {
      const { data, error } = await client
        .from('ebook_funnels')
        .insert({
          title: L.title,
          slug: L.slug,
          ebook_price_cents: L.ebook_price_cents,
          upsell_price_cents: L.upsell_price_cents,
          ebook_product_type: L.ebook_product_type,
          upsell_product_type: L.upsell_product_type,
          stripe_ebook_name: L.stripe_ebook_name,
          stripe_upsell_name: L.stripe_upsell_name,
          languages: L.languages,
          headline: L.headline,
          subheadline: L.subheadline,
          cta_label: L.cta_label,
          status: L.status,
        })
        .select('id')
        .single()
      if (error) return { ok: false, error: error.message }
      funnelId = data.id as string
    }

    const assetRows = L.assets_pt.map((a) => ({
      funnel_id: funnelId!,
      language: 'pt',
      kind: a.kind,
      storage_path: a.storage_path,
      public_url: a.public_url,
      file_name: a.file_name,
    }))

    const { error: assetsError } = await client
      .from('ebook_funnel_assets')
      .upsert(assetRows, { onConflict: 'funnel_id,language,kind' })
    if (assetsError) return { ok: false, error: assetsError.message }

    const pub = await publishEbookFunnelToStore(funnelId!)
    if (!pub.ok) {
      revalidateBoost([
        '/produtos/boost/funis',
        `/produtos/boost/funis/${funnelId}`,
      ])
      return {
        ok: true,
        id: funnelId,
        message: `Funil importado, mas loja: ${pub.error}`,
      }
    }

    revalidateBoost([
      '/produtos/boost/funis',
      `/produtos/boost/funis/${funnelId}`,
    ])
    return {
      ok: true,
      id: funnelId,
      message: 'PADEL IQ PRO importado e publicado na loja',
    }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Erro' }
  }
}

export async function publishEbookFunnelToStore(
  funnelId: string
): Promise<ActionResult & { productId?: string; storeUrl?: string }> {
  const g = await guardWrite()
  if (!g.ok) return g

  try {
    const client = requireBoostClient()
    const { data: funnel, error } = await client
      .from('ebook_funnels')
      .select('*')
      .eq('id', funnelId)
      .maybeSingle()
    if (error) return { ok: false, error: error.message }
    if (!funnel) return { ok: false, error: 'Funil não encontrado' }

    const { data: cover } = await client
      .from('ebook_funnel_assets')
      .select('public_url')
      .eq('funnel_id', funnelId)
      .eq('kind', 'cover')
      .eq('language', 'pt')
      .maybeSingle()

    const learnMore = learnMoreUrlForFunnel(funnel.slug)
    const price = Math.round(Number(funnel.ebook_price_cents)) / 100
    const imageUrl =
      cover?.public_url ||
      (funnel.slug === LEGACY_PADEL_IQ.slug
        ? LEGACY_PADEL_IQ.cover_public_url
        : null) ||
      'https://gmpyjnufuvsoewbtirsg.supabase.co/storage/v1/object/public/ebook-materials/the%20padel%20iq%20logo.png'

    const shortDesc =
      String(funnel.subheadline || '').trim() ||
      String(funnel.headline || '').trim() ||
      String(funnel.title)
    const description = `<p>${shortDesc}</p>`

    let productId: string | null = null
    const { data: bySlug } = await client
      .from('products')
      .select('id')
      .eq('funnel_slug', funnel.slug)
      .maybeSingle()
    if (bySlug?.id) productId = bySlug.id as string

    if (!productId && funnel.slug === LEGACY_PADEL_IQ.slug) {
      productId = LEGACY_PADEL_IQ.store_product_id
    }

    const payload: Record<string, unknown> = {
      name: String(funnel.title),
      price,
      stock: 100,
      image_url: imageUrl,
      short_description: shortDesc.slice(0, 280),
      description,
      active: funnel.status === 'active',
      is_digital: true,
      is_featured: funnel.slug === LEGACY_PADEL_IQ.slug,
      learn_more_url: learnMore,
      funnel_slug: funnel.slug,
      category_id: DIGITAL_CATEGORY_ID,
      updated_at: new Date().toISOString(),
    }

    if (productId) {
      const { error: upErr } = await client
        .from('products')
        .update(payload)
        .eq('id', productId)
      if (upErr) {
        if (/funnel_slug/i.test(upErr.message)) {
          const withoutSlug = { ...payload }
          delete withoutSlug.funnel_slug
          const { error: retry } = await client
            .from('products')
            .update(withoutSlug)
            .eq('id', productId)
          if (retry) return { ok: false, error: retry.message }
        } else {
          return { ok: false, error: upErr.message }
        }
      }
    } else {
      const insertPayload: Record<string, unknown> = {
        ...payload,
        slug: `ebook-funnel-${funnel.slug}`,
      }
      const { data: inserted, error: insErr } = await client
        .from('products')
        .insert([insertPayload])
        .select('id')
        .single()
      if (insErr) {
        if (/funnel_slug/i.test(insErr.message)) {
          const withoutSlug = { ...insertPayload }
          delete withoutSlug.funnel_slug
          const { data: retry, error: retryErr } = await client
            .from('products')
            .insert([withoutSlug])
            .select('id')
            .single()
          if (retryErr) return { ok: false, error: retryErr.message }
          productId = retry.id as string
        } else {
          return { ok: false, error: insErr.message }
        }
      } else {
        productId = inserted.id as string
      }
    }

    const storeUrl = `${storeBaseUrl()}/digital.html`
    revalidateBoost([
      '/produtos/boost/funis',
      `/produtos/boost/funis/${funnelId}`,
      '/produtos/boost/produtos',
    ])
    return {
      ok: true,
      productId: productId || undefined,
      storeUrl,
      message: `Publicado na loja. Saber mais → ${learnMore}`,
    }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Erro' }
  }
}
