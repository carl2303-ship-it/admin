'use server'

import { requireBoostModule } from './auth'
import { requireBoostClient } from './client'
import {
  guardWrite,
  guardContentWrite,
  revalidateBoost,
  slugify,
  type ActionResult,
} from './actions-shared'

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
