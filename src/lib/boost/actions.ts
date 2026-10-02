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

function parseJsonArray(raw: string): unknown[] {
  try {
    const parsed = JSON.parse(raw || '[]')
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export async function uploadBoostImage(
  formData: FormData
): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  const g = await guardContentWrite()
  if (!g.ok) return g

  try {
    const file = formData.get('file')
    if (!(file instanceof File) || file.size === 0) {
      return { ok: false, error: 'Ficheiro em falta' }
    }
    const allowed = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
    ]
    if (!allowed.includes(file.type)) {
      return { ok: false, error: 'Tipo de ficheiro não suportado' }
    }
    if (file.size > 5 * 1024 * 1024) {
      return { ok: false, error: 'Imagem > 5MB' }
    }

    const folder = String(formData.get('folder') || 'products')
      .replace(/[^a-z0-9/_-]/gi, '')
      .replace(/^\/+|\/+$/g, '') || 'products'
    const ext = (file.name.split('.').pop() || 'jpg').toLowerCase()
    const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 9)}.${ext}`

    const client = requireBoostClient()
    const buffer = Buffer.from(await file.arrayBuffer())
    const { error } = await client.storage.from('product-images').upload(path, buffer, {
      contentType: file.type,
      cacheControl: '3600',
      upsert: false,
    })
    if (error) return { ok: false, error: error.message }

    const { data } = client.storage.from('product-images').getPublicUrl(path)
    return { ok: true, url: data.publicUrl }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Erro upload' }
  }
}

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

    const description = String(formData.get('description') || '').trim()
    if (!description || description === '<p><br></p>') {
      return { ok: false, error: 'Descrição obrigatória' }
    }

    const additionalRaw = String(formData.get('additional_images') || '')
    const additional_images = additionalRaw
      .split('\n')
      .map((u) => u.trim())
      .filter(Boolean)

    const colors = parseJsonArray(String(formData.get('colors_json') || '[]'))
      .map((c) => {
        if (!c || typeof c !== 'object') return null
        const o = c as { name?: unknown; hex?: unknown }
        const colorName = String(o.name || '').trim()
        if (!colorName) return null
        return { name: colorName, hex: String(o.hex || '#000000') }
      })
      .filter(Boolean)

    const sizes = parseJsonArray(String(formData.get('sizes_json') || '[]'))
      .map((s) => String(s || '').trim())
      .filter(Boolean)

    const slugRaw = String(formData.get('slug') || '').trim()
    const imageUrl = String(formData.get('image_url') || '') || null
    if (!imageUrl && !id) {
      return { ok: false, error: 'Imagem do produto obrigatória (upload ou URL)' }
    }

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
      image_url: imageUrl,
      additional_images,
      colors,
      sizes,
      short_description: String(formData.get('short_description') || '') || null,
      description,
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
      website_url: String(formData.get('website_url') || '') || null,
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

    let productIds: string[] = []
    if (appliesTo === 'specific_products') {
      productIds = parseJsonArray(String(formData.get('product_ids_json') || '[]'))
        .map((x) => String(x))
        .filter(Boolean)
      if (productIds.length === 0) {
        return { ok: false, error: 'Selecione pelo menos um produto' }
      }
    }

    if (appliesTo === 'category') {
      const cat = String(formData.get('category') || '').trim()
      if (!cat) return { ok: false, error: 'Categoria obrigatória' }
    }

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
      product_ids: appliesTo === 'specific_products' ? productIds : [],
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

export async function getDigitalProductsForEmailPreview(): Promise<
  | { ok: true; products: { name: string; download_url: string | null }[] }
  | { ok: false; error: string }
> {
  const auth = await requireBoostModule()
  if (!auth.user) return { ok: false, error: 'Não autenticado' }
  if (auth.error && !auth.isBootstrap) return { ok: false, error: auth.error }

  try {
    const client = requireBoostClient()
    const { data, error } = await client
      .from('products')
      .select('name, download_url')
      .eq('is_digital', true)
      .limit(3)
    if (error) return { ok: false, error: error.message }
    if (!data || data.length === 0) {
      return {
        ok: false,
        error:
          'Não foram encontrados produtos digitais. Adicione pelo menos um produto digital com link de download.',
      }
    }
    return {
      ok: true,
      products: data.map((p) => ({
        name: String(p.name),
        download_url: (p.download_url as string | null) || null,
      })),
    }
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

  const { createSaasPaymentLink } = await import('./saas-payment-link')
  const result = await createSaasPaymentLink({
    ...input,
    preferUserId: g.boostUserId,
  })
  if (!result.ok) return { ok: false, error: result.error }

  revalidateBoost(['/produtos/boost/saas'])
  return {
    ok: true,
    url: result.url,
    message: result.message,
  }
}

/** Atalho UI: gera + envia email do link de pagamento SaaS. */
export async function sendSaasPaymentLinkEmail(input: {
  orgId: string
  ownerEmail: string
  planType: string
  currency: string
  billingPeriod?: 'mensal' | 'anual'
}): Promise<ActionResult & { url?: string }> {
  return generateSaasPaymentLink({
    orgId: input.orgId,
    ownerEmail: input.ownerEmail,
    planType: input.planType,
    currency: input.currency,
    billingPeriod: input.billingPeriod || 'mensal',
    sendEmail: true,
  })
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

// --- Ebook funnels ---

const FUNNEL_LANGS = new Set(['pt', 'en', 'es', 'it', 'fr'])
const FUNNEL_KINDS = new Set([
  'ebook_pdf',
  'cheat_sheet',
  'mental_cheat_sheet',
  'audio',
  'upsell_video',
  'cover',
  'other',
])

function parseLanguages(raw: FormDataEntryValue | null): string[] {
  const parts = String(raw || 'pt')
    .split(/[,\s]+/)
    .map((s) => s.trim().toLowerCase())
    .filter((s) => FUNNEL_LANGS.has(s))
  return parts.length ? [...new Set(parts)] : ['pt']
}

function eurosToCents(raw: string): number | null {
  const normalized = raw.replace(',', '.').trim()
  const euros = Number(normalized)
  if (!Number.isFinite(euros) || euros <= 0) return null
  return Math.round(euros * 100)
}

export async function createEbookFunnel(
  formData: FormData
): Promise<ActionResult & { id?: string }> {
  const g = await guardWrite()
  if (!g.ok) return g

  try {
    const title = String(formData.get('title') || '').trim()
    const slugInput = String(formData.get('slug') || '').trim()
    const slug = slugify(slugInput || title)
    const ebookCents = eurosToCents(String(formData.get('ebook_price') || ''))
    const upsellCents = eurosToCents(String(formData.get('upsell_price') || ''))
    const languages = parseLanguages(formData.get('languages'))
    const headline = String(formData.get('headline') || '').trim()
    const subheadline = String(formData.get('subheadline') || '').trim()
    const ctaLabel =
      String(formData.get('cta_label') || '').trim() || 'Comprar agora'
    const stripeEbookName =
      String(formData.get('stripe_ebook_name') || '').trim() || title
    const stripeUpsellName =
      String(formData.get('stripe_upsell_name') || '').trim() ||
      `${title} — Upsell`

    if (!title) return { ok: false, error: 'Título obrigatório' }
    if (!slug) return { ok: false, error: 'Slug inválido' }
    if (ebookCents == null) return { ok: false, error: 'Preço ebook inválido' }
    if (upsellCents == null) return { ok: false, error: 'Preço upsell inválido' }

    const ebookProductType = `ebook_${slug}`
    const upsellProductType = `upsell_${slug}`

    const client = requireBoostClient()
    const { data, error } = await client
      .from('ebook_funnels')
      .insert({
        title,
        slug,
        ebook_price_cents: ebookCents,
        upsell_price_cents: upsellCents,
        ebook_product_type: ebookProductType,
        upsell_product_type: upsellProductType,
        stripe_ebook_name: stripeEbookName,
        stripe_upsell_name: stripeUpsellName,
        languages,
        headline: headline || title,
        subheadline,
        cta_label: ctaLabel,
        status: 'draft',
      })
      .select('id')
      .single()

    if (error) return { ok: false, error: error.message }

    revalidateBoost(['/produtos/boost/funis'])
    return { ok: true, id: data.id as string, message: 'Funil criado' }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Erro' }
  }
}

export async function updateEbookFunnel(
  formData: FormData
): Promise<ActionResult> {
  const g = await guardWrite()
  if (!g.ok) return g

  try {
    const id = String(formData.get('id') || '').trim()
    if (!id) return { ok: false, error: 'ID em falta' }

    const title = String(formData.get('title') || '').trim()
    const ebookCents = eurosToCents(String(formData.get('ebook_price') || ''))
    const upsellCents = eurosToCents(String(formData.get('upsell_price') || ''))
    const languages = parseLanguages(formData.get('languages'))
    const headline = String(formData.get('headline') || '').trim()
    const subheadline = String(formData.get('subheadline') || '').trim()
    const ctaLabel =
      String(formData.get('cta_label') || '').trim() || 'Comprar agora'
    const stripeEbookName = String(formData.get('stripe_ebook_name') || '').trim()
    const stripeUpsellName = String(
      formData.get('stripe_upsell_name') || ''
    ).trim()
    const status = String(formData.get('status') || 'draft').trim()

    if (!title) return { ok: false, error: 'Título obrigatório' }
    if (ebookCents == null) return { ok: false, error: 'Preço ebook inválido' }
    if (upsellCents == null) return { ok: false, error: 'Preço upsell inválido' }
    if (!['draft', 'active', 'archived'].includes(status)) {
      return { ok: false, error: 'Estado inválido' }
    }

    const client = requireBoostClient()
    const { error } = await client
      .from('ebook_funnels')
      .update({
        title,
        ebook_price_cents: ebookCents,
        upsell_price_cents: upsellCents,
        languages,
        headline,
        subheadline,
        cta_label: ctaLabel,
        stripe_ebook_name: stripeEbookName,
        stripe_upsell_name: stripeUpsellName,
        status,
      })
      .eq('id', id)

    if (error) return { ok: false, error: error.message }

    revalidateBoost([`/produtos/boost/funis`, `/produtos/boost/funis/${id}`])
    return { ok: true, message: 'Funil actualizado' }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Erro' }
  }
}

export async function setEbookFunnelStatus(
  id: string,
  status: 'draft' | 'active' | 'archived'
): Promise<ActionResult> {
  const g = await guardWrite()
  if (!g.ok) return g
  try {
    const client = requireBoostClient()
    const { error } = await client
      .from('ebook_funnels')
      .update({ status })
      .eq('id', id)
    if (error) return { ok: false, error: error.message }
    revalidateBoost(['/produtos/boost/funis', `/produtos/boost/funis/${id}`])
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Erro' }
  }
}

export async function uploadEbookFunnelAsset(
  formData: FormData
): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  const g = await guardContentWrite()
  if (!g.ok) return g

  try {
    const funnelId = String(formData.get('funnel_id') || '').trim()
    const language = String(formData.get('language') || 'pt')
      .trim()
      .toLowerCase()
    const kind = String(formData.get('kind') || '').trim()
    const file = formData.get('file')

    if (!funnelId) return { ok: false, error: 'Funil em falta' }
    if (!FUNNEL_LANGS.has(language)) return { ok: false, error: 'Idioma inválido' }
    if (!FUNNEL_KINDS.has(kind)) return { ok: false, error: 'Tipo de ficheiro inválido' }
    if (!(file instanceof File) || file.size === 0) {
      return { ok: false, error: 'Ficheiro em falta' }
    }
    if (file.size > 100 * 1024 * 1024) {
      return { ok: false, error: 'Ficheiro > 100MB' }
    }

    const client = requireBoostClient()
    const { data: funnel, error: funnelError } = await client
      .from('ebook_funnels')
      .select('id, slug')
      .eq('id', funnelId)
      .maybeSingle()
    if (funnelError) return { ok: false, error: funnelError.message }
    if (!funnel) return { ok: false, error: 'Funil não encontrado' }

    const ext = (file.name.split('.').pop() || 'bin').toLowerCase()
    const safeName = file.name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9._-]+/g, '-')
    const path = `funnels/${funnel.slug}/${language}/${kind}-${Date.now()}-${safeName || `file.${ext}`}`

    const buffer = Buffer.from(await file.arrayBuffer())
    const { error: uploadError } = await client.storage
      .from('ebook-materials')
      .upload(path, buffer, {
        contentType: file.type || 'application/octet-stream',
        cacheControl: '3600',
        upsert: true,
      })
    if (uploadError) return { ok: false, error: uploadError.message }

    const { data: pub } = client.storage.from('ebook-materials').getPublicUrl(path)

    const { error: upsertError } = await client.from('ebook_funnel_assets').upsert(
      {
        funnel_id: funnelId,
        language,
        kind,
        storage_path: path,
        public_url: pub.publicUrl,
        file_name: file.name,
      },
      { onConflict: 'funnel_id,language,kind' }
    )
    if (upsertError) return { ok: false, error: upsertError.message }

    revalidateBoost([`/produtos/boost/funis/${funnelId}`])
    return { ok: true, url: pub.publicUrl }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Erro upload' }
  }
}

export async function deleteEbookFunnelAsset(
  assetId: string,
  funnelId: string
): Promise<ActionResult> {
  const g = await guardContentWrite()
  if (!g.ok) return g
  try {
    const client = requireBoostClient()
    const { data: asset } = await client
      .from('ebook_funnel_assets')
      .select('storage_path')
      .eq('id', assetId)
      .maybeSingle()

    const { error } = await client
      .from('ebook_funnel_assets')
      .delete()
      .eq('id', assetId)
    if (error) return { ok: false, error: error.message }

    if (asset?.storage_path) {
      await client.storage.from('ebook-materials').remove([asset.storage_path])
    }

    revalidateBoost([`/produtos/boost/funis/${funnelId}`])
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Erro' }
  }
}
