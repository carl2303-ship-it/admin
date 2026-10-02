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
