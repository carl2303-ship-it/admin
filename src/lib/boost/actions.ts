'use server'

import { revalidatePath } from 'next/cache'
import {
  requireBoostModule,
  canWriteBoost,
  canWriteBoostContent,
  staffRole,
} from './auth'
import { requireBoostClient, invokeBoostEdgeFunction } from './client'
import { PLAN_MAX_TOURNAMENTS } from './types'

export type ActionResult = { ok: true; message?: string } | { ok: false; error: string }

async function guardWrite(): Promise<
  | { ok: true; boostUserId: string | null }
  | { ok: false; error: string }
> {
  const auth = await requireBoostModule()
  if (!auth.user) return { ok: false, error: 'Não autenticado' }
  if (auth.error && !auth.isBootstrap) return { ok: false, error: auth.error }
  const role = staffRole(auth.staff, auth.isBootstrap)
  if (!canWriteBoost(role)) {
    return { ok: false, error: 'Sem permissão de escrita (owner/commerce).' }
  }
  return { ok: true, boostUserId: auth.staff?.boost_user_id ?? null }
}

async function guardContentWrite(): Promise<
  | { ok: true }
  | { ok: false; error: string }
> {
  const auth = await requireBoostModule()
  if (!auth.user) return { ok: false, error: 'Não autenticado' }
  if (auth.error && !auth.isBootstrap) return { ok: false, error: auth.error }
  const role = staffRole(auth.staff, auth.isBootstrap)
  if (!canWriteBoostContent(role)) {
    return {
      ok: false,
      error: 'Sem permissão de escrita de conteúdo (owner/commerce/content).',
    }
  }
  return { ok: true }
}

function revalidateBoost(paths: string[] = []) {
  revalidatePath('/produtos/boost')
  for (const p of paths) revalidatePath(p)
}

function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

// --- Products ---

export async function saveProduct(
  formData: FormData
): Promise<ActionResult> {
  const g = await guardWrite()
  if (!g.ok) return g

  try {
    const client = requireBoostClient()
    const id = String(formData.get('id') || '')
    const name = String(formData.get('name') || '').trim()
    if (!name) return { ok: false, error: 'Nome obrigatório' }

    const slugRaw = String(formData.get('slug') || '').trim()
    const payload = {
      name,
      slug: slugRaw || slugify(name),
      category_id: String(formData.get('category_id') || '') || null,
      brand_id: String(formData.get('brand_id') || '') || null,
      price: parseFloat(String(formData.get('price') || '0')) || 0,
      compare_at_price: formData.get('compare_at_price')
        ? parseFloat(String(formData.get('compare_at_price')))
        : null,
      stock: parseInt(String(formData.get('stock') || '0'), 10) || 0,
      image_url: String(formData.get('image_url') || '') || null,
      short_description: String(formData.get('short_description') || '') || null,
      description: String(formData.get('description') || '') || null,
      active: formData.get('active') === 'on' || formData.get('active') === 'true',
      is_featured:
        formData.get('is_featured') === 'on' ||
        formData.get('is_featured') === 'true',
      is_digital:
        formData.get('is_digital') === 'on' ||
        formData.get('is_digital') === 'true',
      download_url: String(formData.get('download_url') || '') || null,
      learn_more_url: String(formData.get('learn_more_url') || '') || null,
      video_url: String(formData.get('video_url') || '') || null,
      updated_at: new Date().toISOString(),
    }

    if (id) {
      const { error } = await client.from('products').update(payload).eq('id', id)
      if (error) return { ok: false, error: error.message }
    } else {
      const { error } = await client.from('products').insert([payload])
      if (error) return { ok: false, error: error.message }
    }

    revalidateBoost(['/produtos/boost/produtos'])
    return { ok: true, message: 'Produto guardado' }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Erro' }
  }
}

export async function quickUpdateProduct(
  id: string,
  field: 'price' | 'stock' | 'is_featured' | 'active',
  value: number | boolean
): Promise<ActionResult> {
  const g = await guardWrite()
  if (!g.ok) return g
  try {
    const client = requireBoostClient()
    const { error } = await client
      .from('products')
      .update({ [field]: value, updated_at: new Date().toISOString() })
      .eq('id', id)
    if (error) return { ok: false, error: error.message }
    revalidateBoost(['/produtos/boost/produtos'])
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Erro' }
  }
}

export async function deleteProduct(id: string): Promise<ActionResult> {
  const g = await guardWrite()
  if (!g.ok) return g
  try {
    const client = requireBoostClient()
    const { error } = await client.from('products').delete().eq('id', id)
    if (error) return { ok: false, error: error.message }
    revalidateBoost(['/produtos/boost/produtos'])
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Erro' }
  }
}

export async function duplicateProduct(id: string): Promise<ActionResult> {
  const g = await guardWrite()
  if (!g.ok) return g
  try {
    const client = requireBoostClient()
    const { data, error } = await client
      .from('products')
      .select('*')
      .eq('id', id)
      .maybeSingle()
    if (error || !data) return { ok: false, error: error?.message || 'Não encontrado' }

    const copy = { ...data } as Record<string, unknown>
    delete copy.id
    delete copy.created_at
    copy.name = `${data.name} (cópia)`
    copy.slug = `${data.slug}-copia-${Date.now().toString(36)}`
    copy.active = false
    copy.is_featured = false
    copy.updated_at = new Date().toISOString()

    const { error: insertError } = await client.from('products').insert([copy])
    if (insertError) return { ok: false, error: insertError.message }
    revalidateBoost(['/produtos/boost/produtos'])
    return { ok: true, message: 'Produto duplicado' }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Erro' }
  }
}

// --- Orders ---

export async function updateOrderStatus(
  id: string,
  status: string
): Promise<ActionResult> {
  const g = await guardWrite()
  if (!g.ok) return g
  try {
    const client = requireBoostClient()
    const { error } = await client.from('orders').update({ status }).eq('id', id)
    if (error) return { ok: false, error: error.message }
    revalidateBoost(['/produtos/boost/pedidos'])
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Erro' }
  }
}

export async function deleteOrder(id: string): Promise<ActionResult> {
  const g = await guardWrite()
  if (!g.ok) return g
  try {
    const client = requireBoostClient()
    await client.from('order_items').delete().eq('order_id', id)
    const { error } = await client.from('orders').delete().eq('id', id)
    if (error) return { ok: false, error: error.message }
    revalidateBoost(['/produtos/boost/pedidos'])
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Erro' }
  }
}

// --- Categories / Brands ---

export async function saveCategory(formData: FormData): Promise<ActionResult> {
  const g = await guardWrite()
  if (!g.ok) return g
  try {
    const client = requireBoostClient()
    const id = String(formData.get('id') || '')
    const name = String(formData.get('name') || '').trim()
    if (!name) return { ok: false, error: 'Nome obrigatório' }
    const payload = {
      name,
      slug: String(formData.get('slug') || slugify(name)).toLowerCase(),
      description: String(formData.get('description') || '') || null,
      display_order: parseInt(String(formData.get('display_order') || '0'), 10) || 0,
      active: formData.get('active') === 'on' || formData.get('active') === 'true',
    }
    if (id) {
      const { error } = await client.from('categories').update(payload).eq('id', id)
      if (error) return { ok: false, error: error.message }
    } else {
      const { error } = await client.from('categories').insert([payload])
      if (error) return { ok: false, error: error.message }
    }
    revalidateBoost(['/produtos/boost/categorias'])
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Erro' }
  }
}

export async function deleteCategory(id: string): Promise<ActionResult> {
  const g = await guardWrite()
  if (!g.ok) return g
  try {
    const client = requireBoostClient()
    const { error } = await client.from('categories').delete().eq('id', id)
    if (error) return { ok: false, error: error.message }
    revalidateBoost(['/produtos/boost/categorias'])
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Erro' }
  }
}

export async function saveBrand(formData: FormData): Promise<ActionResult> {
  const g = await guardWrite()
  if (!g.ok) return g
  try {
    const client = requireBoostClient()
    const id = String(formData.get('id') || '')
    const name = String(formData.get('name') || '').trim()
    if (!name) return { ok: false, error: 'Nome obrigatório' }
    const payload = {
      name,
      slug: String(formData.get('slug') || slugify(name)).toLowerCase(),
      description: String(formData.get('description') || '') || null,
      logo_url: String(formData.get('logo_url') || '') || null,
      display_order: parseInt(String(formData.get('display_order') || '0'), 10) || 0,
      active: formData.get('active') === 'on' || formData.get('active') === 'true',
    }
    if (id) {
      const { error } = await client.from('brands').update(payload).eq('id', id)
      if (error) return { ok: false, error: error.message }
    } else {
      const { error } = await client.from('brands').insert([payload])
      if (error) return { ok: false, error: error.message }
    }
    revalidateBoost(['/produtos/boost/marcas'])
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Erro' }
  }
}

export async function deleteBrand(id: string): Promise<ActionResult> {
  const g = await guardWrite()
  if (!g.ok) return g
  try {
    const client = requireBoostClient()
    const { error } = await client.from('brands').delete().eq('id', id)
    if (error) return { ok: false, error: error.message }
    revalidateBoost(['/produtos/boost/marcas'])
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Erro' }
  }
}

// --- Discounts ---

export async function saveDiscount(formData: FormData): Promise<ActionResult> {
  const g = await guardWrite()
  if (!g.ok) return g
  try {
    const client = requireBoostClient()
    const id = String(formData.get('id') || '')
    const code = String(formData.get('code') || '')
      .toUpperCase()
      .trim()
    if (!code) return { ok: false, error: 'Código obrigatório' }
    const appliesTo = String(formData.get('applies_to') || 'all')
    const payload = {
      code,
      description: String(formData.get('description') || '') || null,
      type: String(formData.get('type') || 'percentage'),
      value: parseFloat(String(formData.get('value') || '0')) || 0,
      min_purchase: parseFloat(String(formData.get('min_purchase') || '0')) || 0,
      max_uses: formData.get('max_uses')
        ? parseInt(String(formData.get('max_uses')), 10)
        : null,
      applies_to: appliesTo,
      category:
        appliesTo === 'category'
          ? String(formData.get('category') || '') || null
          : null,
      product_ids: [] as string[],
      valid_from:
        String(formData.get('valid_from') || '') || new Date().toISOString(),
      valid_until: String(formData.get('valid_until') || '') || null,
      active: formData.get('active') === 'on' || formData.get('active') === 'true',
      updated_at: new Date().toISOString(),
    }
    if (id) {
      const { error } = await client
        .from('discount_codes')
        .update(payload)
        .eq('id', id)
      if (error) return { ok: false, error: error.message }
    } else {
      const { error } = await client.from('discount_codes').insert([payload])
      if (error) return { ok: false, error: error.message }
    }
    revalidateBoost(['/produtos/boost/descontos'])
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Erro' }
  }
}

export async function deleteDiscount(id: string): Promise<ActionResult> {
  const g = await guardWrite()
  if (!g.ok) return g
  try {
    const client = requireBoostClient()
    const { error } = await client.from('discount_codes').delete().eq('id', id)
    if (error) return { ok: false, error: error.message }
    revalidateBoost(['/produtos/boost/descontos'])
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Erro' }
  }
}

// --- SaaS ---

export async function saveSaasLicense(
  formData: FormData
): Promise<ActionResult> {
  const g = await guardWrite()
  if (!g.ok) return g

  const id = String(formData.get('id') || '')
  const name = String(formData.get('name') || '').trim()
  const slug = String(formData.get('slug') || slugify(name))
    .toLowerCase()
    .trim()
  const ownerEmail = String(formData.get('owner_email') || '').trim() || null
  const planType = String(formData.get('plan_type') || 'gold')
  const contractStart = String(formData.get('contract_start') || '')
  const contractExpires = String(formData.get('subscription_expires_at') || '')

  if (!name || !slug) return { ok: false, error: 'Nome e slug obrigatórios' }

  const payload = {
    name,
    slug,
    owner_email: ownerEmail,
    plan_type: planType,
    status: String(formData.get('status') || 'active'),
    language: String(formData.get('language') || 'es'),
    currency: String(formData.get('currency') || 'EUR'),
    max_tournaments:
      parseInt(String(formData.get('max_tournaments') || ''), 10) ||
      PLAN_MAX_TOURNAMENTS[planType] ||
      15,
    source: 'boost',
    primary_color: String(formData.get('primary_color') || '') || null,
    accent_color: String(formData.get('accent_color') || '') || null,
    contract_start: contractStart
      ? new Date(contractStart).toISOString()
      : null,
    subscription_expires_at: contractExpires
      ? new Date(`${contractExpires}T23:59:59`).toISOString()
      : null,
  }

  try {
    if (id) {
      const client = requireBoostClient()
      const { error } = await client
        .from('organizations')
        .update(payload)
        .eq('id', id)
        .eq('source', 'boost')
      if (error) return { ok: false, error: error.message }
      revalidateBoost(['/produtos/boost/saas'])
      return { ok: true, message: 'Licença actualizada' }
    }

    if (!ownerEmail) {
      return {
        ok: false,
        error: 'Email do owner obrigatório para provisionar login Tour.',
      }
    }

    const { data, error } = await invokeBoostEdgeFunction<{
      error?: string
      tour_provision?: { credentials_sent?: boolean; user_id?: string }
    }>('provision-saas-license', {
      ...payload,
      provision_login: true,
      send_credentials_email: true,
    }, { preferUserId: g.boostUserId })

    if (error) return { ok: false, error }
    if (data?.tour_provision?.credentials_sent) {
      revalidateBoost(['/produtos/boost/saas'])
      return { ok: true, message: 'Licença criada; credenciais Tour enviadas.' }
    }
    if (data?.tour_provision?.user_id) {
      revalidateBoost(['/produtos/boost/saas'])
      return {
        ok: true,
        message: 'Licença criada e login Tour associado (email de credenciais pode ter falhado).',
      }
    }
    revalidateBoost(['/produtos/boost/saas'])
    return {
      ok: true,
      message:
        'Licença criada. Se o login Tour falhou, usa o admin legacy ou verifica TOUR_SUPABASE_* nas Edge Functions.',
    }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Erro' }
  }
}

export async function toggleSaasStatus(id: string): Promise<ActionResult> {
  const g = await guardWrite()
  if (!g.ok) return g
  try {
    const client = requireBoostClient()
    const { data, error } = await client
      .from('organizations')
      .select('status')
      .eq('id', id)
      .eq('source', 'boost')
      .maybeSingle()
    if (error || !data) return { ok: false, error: error?.message || 'Não encontrado' }
    const next = data.status === 'active' ? 'suspended' : 'active'
    const { error: up } = await client
      .from('organizations')
      .update({ status: next })
      .eq('id', id)
    if (up) return { ok: false, error: up.message }
    revalidateBoost(['/produtos/boost/saas'])
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Erro' }
  }
}

export async function updateSaasPlan(
  id: string,
  planType: string
): Promise<ActionResult> {
  const g = await guardWrite()
  if (!g.ok) return g
  try {
    const client = requireBoostClient()
    const { error } = await client
      .from('organizations')
      .update({
        plan_type: planType,
        max_tournaments: PLAN_MAX_TOURNAMENTS[planType] ?? 15,
      })
      .eq('id', id)
      .eq('source', 'boost')
    if (error) return { ok: false, error: error.message }
    revalidateBoost(['/produtos/boost/saas'])
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Erro' }
  }
}

export async function deleteSaasLicense(id: string): Promise<ActionResult> {
  const g = await guardWrite()
  if (!g.ok) return g
  try {
    const client = requireBoostClient()
    const { error } = await client
      .from('organizations')
      .delete()
      .eq('id', id)
      .eq('source', 'boost')
    if (error) return { ok: false, error: error.message }
    revalidateBoost(['/produtos/boost/saas'])
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Erro' }
  }
}

export async function resendSaasCredentials(
  organizationId: string
): Promise<ActionResult> {
  const g = await guardWrite()
  if (!g.ok) return g

  const { data, error } = await invokeBoostEdgeFunction<{
    message?: string
  }>('provision-saas-license', {
    action: 'resend_credentials',
    organization_id: organizationId,
  }, { preferUserId: g.boostUserId })

  if (error) return { ok: false, error }
  return { ok: true, message: data?.message || 'Credenciais reenviadas' }
}

export async function generateSaasPaymentLink(input: {
  orgId: string
  ownerEmail: string
  planType: string
  currency: string
  billingPeriod: 'mensal' | 'anual'
  sendEmail: boolean
}): Promise<ActionResult & { url?: string }> {
  const g = await guardWrite()
  if (!g.ok) return g

  try {
    const client = requireBoostClient()
    const { data: org, error: orgError } = await client
      .from('organizations')
      .select('*')
      .eq('id', input.orgId)
      .eq('source', 'boost')
      .maybeSingle()
    if (orgError || !org) {
      return { ok: false, error: orgError?.message || 'Org não encontrada' }
    }

    const storeBase =
      process.env.NEXT_PUBLIC_BOOST_STORE_URL || 'https://boostpadel.store'

    const { data, error } = await invokeBoostEdgeFunction<{
      url?: string
      error?: string
    }>(
      'stripe-checkout',
      {
        productType: 'saas-tour-subscription',
        planType: input.planType,
        billingPeriod: input.billingPeriod,
        organizationName: org.name,
        organizationSlug: org.slug,
        ownerEmail: input.ownerEmail,
        language: org.language || 'pt',
        currency: input.currency,
        sendPaymentLinkEmail: input.sendEmail,
        successUrl: `${storeBase}/tour.html?subscription=success&slug=${encodeURIComponent(org.slug)}`,
        cancelUrl: `${storeBase}/tour.html#precos`,
      },
      { preferUserId: g.boostUserId }
    )

    if (error) return { ok: false, error }
    if (!data?.url) return { ok: false, error: 'Stripe não devolveu URL' }

    if (!org.owner_email || org.owner_email !== input.ownerEmail) {
      await client
        .from('organizations')
        .update({ owner_email: input.ownerEmail })
        .eq('id', org.id)
    }
    if (org.plan_type !== input.planType) {
      await client
        .from('organizations')
        .update({
          plan_type: input.planType,
          max_tournaments: PLAN_MAX_TOURNAMENTS[input.planType] ?? 15,
        })
        .eq('id', org.id)
    }

    revalidateBoost(['/produtos/boost/saas'])
    return {
      ok: true,
      url: data.url,
      message: input.sendEmail
        ? `Link gerado e email enviado para ${input.ownerEmail}`
        : 'Link gerado',
    }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Erro' }
  }
}

// --- Blog ---

export async function saveBlogPost(formData: FormData): Promise<ActionResult> {
  const g = await guardContentWrite()
  if (!g.ok) return g

  try {
    const client = requireBoostClient()
    const id = String(formData.get('id') || '')
    const title = String(formData.get('title') || '').trim()
    if (!title) return { ok: false, error: 'Título obrigatório' }

    const content = String(formData.get('content') || '').trim()
    if (!content || content === '<p><br></p>') {
      return { ok: false, error: 'Conteúdo obrigatório' }
    }

    const slugRaw = String(formData.get('slug') || '').trim()
    const payload = {
      title,
      slug: slugRaw || slugify(title),
      author: String(formData.get('author') || 'BOOST PADEL').trim() || 'BOOST PADEL',
      category: String(formData.get('category') || 'geral').trim() || 'geral',
      image_url: String(formData.get('image_url') || '') || null,
      excerpt: String(formData.get('excerpt') || '') || null,
      content,
      published:
        formData.get('published') === 'on' ||
        formData.get('published') === 'true',
      featured:
        formData.get('featured') === 'on' ||
        formData.get('featured') === 'true',
      updated_at: new Date().toISOString(),
    }

    if (id) {
      const { error } = await client
        .from('blog_posts')
        .update(payload)
        .eq('id', id)
      if (error) return { ok: false, error: error.message }
    } else {
      const { error } = await client.from('blog_posts').insert(payload)
      if (error) return { ok: false, error: error.message }
    }

    revalidateBoost(['/produtos/boost/blog'])
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Erro' }
  }
}

export async function deleteBlogPost(id: string): Promise<ActionResult> {
  const g = await guardContentWrite()
  if (!g.ok) return g
  try {
    const client = requireBoostClient()
    const { error } = await client.from('blog_posts').delete().eq('id', id)
    if (error) return { ok: false, error: error.message }
    revalidateBoost(['/produtos/boost/blog'])
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Erro' }
  }
}

// --- Estágios ---

export async function updateStageStatus(
  id: string,
  status: string
): Promise<ActionResult> {
  const g = await guardWrite()
  if (!g.ok) return g
  try {
    const client = requireBoostClient()
    const { error } = await client
      .from('stage_registrations')
      .update({ status })
      .eq('id', id)
    if (error) return { ok: false, error: error.message }
    revalidateBoost(['/produtos/boost/estagios'])
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Erro' }
  }
}

// --- Ebook purchases ---

export async function deleteEbookPurchase(id: string): Promise<ActionResult> {
  const g = await guardWrite()
  if (!g.ok) return g
  try {
    const client = requireBoostClient()
    const { error } = await client.from('ebook_purchases').delete().eq('id', id)
    if (error) return { ok: false, error: error.message }
    revalidateBoost(['/produtos/boost/ebook-compras'])
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Erro' }
  }
}
