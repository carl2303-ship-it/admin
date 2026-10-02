'use server'

import { requireBoostClient } from './client'
import {
  guardWrite,
  guardContentWrite,
  revalidateBoost,
  slugify,
  type ActionResult,
} from './actions-shared'

// --- Ebook funnels ---

const FUNNEL_LANGS = new Set(['pt', 'en', 'es', 'it', 'fr'])
/** Kinds genéricos + legados (ainda aceites para uploads/legado). */
const FUNNEL_KINDS = new Set([
  'ebook_pdf',
  'upsell',
  'downsell',
  'thankyou_bonus',
  'cover',
  'landing_image',
  'other',
  // legado
  'cheat_sheet',
  'mental_cheat_sheet',
  'audio',
  'upsell_video',
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

function parseAiJsonLoose(raw: string): Record<string, unknown> {
  const trimmed = raw.trim()
  try {
    return JSON.parse(trimmed) as Record<string, unknown>
  } catch {
    const match = trimmed.match(/\{[\s\S]*\}/)
    if (!match) throw new Error('Resposta da IA sem JSON válido.')
    return JSON.parse(match[0]) as Record<string, unknown>
  }
}

/**
 * Gera copy da landing a partir da descrição do PDF (+ fotos opcionais).
 * Usa Netlify AI Gateway (OPENAI_* injectado) — não hardcodes de secrets.
 */
export async function generateEbookFunnelLanding(
  formData: FormData
): Promise<ActionResult> {
  const g = await guardContentWrite()
  if (!g.ok) return g

  try {
    const funnelId = String(formData.get('funnel_id') || '').trim()
    const description = String(formData.get('description') || '').trim()
    const tone = String(formData.get('tone') || 'direto').trim()
    const language = String(formData.get('language') || 'pt')
      .trim()
      .toLowerCase()

    if (!funnelId) return { ok: false, error: 'Funil em falta' }
    if (description.length < 20) {
      return {
        ok: false,
        error: 'Descreve o conteúdo do PDF com pelo menos ~20 caracteres.',
      }
    }
    if (!FUNNEL_LANGS.has(language)) {
      return { ok: false, error: 'Idioma inválido' }
    }

    const client = requireBoostClient()
    const { data: funnel, error: funnelError } = await client
      .from('ebook_funnels')
      .select('id, slug, title, landing_body')
      .eq('id', funnelId)
      .maybeSingle()
    if (funnelError) return { ok: false, error: funnelError.message }
    if (!funnel) return { ok: false, error: 'Funil não encontrado' }

    const uploadedImageUrls: string[] = []
    const imageEntries = formData.getAll('images')
    for (const entry of imageEntries) {
      if (!(entry instanceof File) || entry.size === 0) continue
      if (entry.size > 12 * 1024 * 1024) {
        return { ok: false, error: `Imagem demasiado grande: ${entry.name}` }
      }
      const ext = (entry.name.split('.').pop() || 'jpg').toLowerCase()
      const safeName = entry.name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9._-]+/g, '-')
      const path = `funnels/${funnel.slug}/${language}/landing_image-${Date.now()}-${safeName || `img.${ext}`}`
      const buffer = Buffer.from(await entry.arrayBuffer())
      const { error: uploadError } = await client.storage
        .from('ebook-materials')
        .upload(path, buffer, {
          contentType: entry.type || 'image/jpeg',
          cacheControl: '3600',
          upsert: true,
        })
      if (uploadError) return { ok: false, error: uploadError.message }
      const { data: pub } = client.storage.from('ebook-materials').getPublicUrl(path)
      uploadedImageUrls.push(pub.publicUrl)
    }

    // Primeira foto também como cover/landing_image (upsert 1 slot)
    if (uploadedImageUrls.length) {
      const first = uploadedImageUrls[0]
      // path já no URL público — re-upsert cover se ainda não houver
      const { data: existingCover } = await client
        .from('ebook_funnel_assets')
        .select('id')
        .eq('funnel_id', funnelId)
        .eq('language', language)
        .eq('kind', 'cover')
        .maybeSingle()
      if (!existingCover) {
        const coverPath = `funnels/${funnel.slug}/${language}/cover-from-ai-${Date.now()}.jpg`
        // URL já pública — gravar metadados apontando para a primeira imagem
        await client.from('ebook_funnel_assets').upsert(
          {
            funnel_id: funnelId,
            language,
            kind: 'cover',
            storage_path: coverPath,
            public_url: first,
            file_name: 'cover-from-ai',
          },
          { onConflict: 'funnel_id,language,kind' }
        )
      }
      await client.from('ebook_funnel_assets').upsert(
        {
          funnel_id: funnelId,
          language,
          kind: 'landing_image',
          storage_path: `funnels/${funnel.slug}/${language}/landing_image-ai-${Date.now()}`,
          public_url: first,
          file_name: 'landing-from-ai',
        },
        { onConflict: 'funnel_id,language,kind' }
      )
    }

    const prevBody =
      funnel.landing_body && typeof funnel.landing_body === 'object'
        ? (funnel.landing_body as Record<string, unknown>)
        : {}
    const prevImages = Array.isArray(prevBody.images)
      ? (prevBody.images as string[])
      : []
    const imageUrls = [...prevImages, ...uploadedImageUrls]

    // Netlify AI Gateway injecta OPENAI_API_KEY + OPENAI_BASE_URL no runtime.
    // Não definir keys próprias no código — process.env / Netlify.env no deploy.
    const apiKey = process.env.OPENAI_API_KEY
    const baseURL =
      process.env.OPENAI_BASE_URL || process.env.NETLIFY_AI_GATEWAY_BASE_URL
    if (!apiKey) {
      return {
        ok: false,
        error:
          'AI Gateway não configurada. No Netlify do hub: Site configuration → AI → Enable AI Features (e fazer um deploy produção). Variáveis injectadas: OPENAI_API_KEY, OPENAI_BASE_URL.',
      }
    }

    const { default: OpenAI } = await import('openai')
    const openai = new OpenAI({
      apiKey,
      ...(baseURL ? { baseURL } : {}),
    })

    const model =
      process.env.FUNNEL_OPENAI_MODEL ||
      process.env.OPENAI_CONTENT_MODEL ||
      'gpt-4o-mini'

    const langNames: Record<string, string> = {
      pt: 'português europeu',
      en: 'English',
      es: 'español',
      it: 'italiano',
      fr: 'français',
    }

    const completion = await openai.chat.completions.create({
      model,
      temperature: 0.7,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: `És copywriter de landings de ebooks de padel para BOOST PADEL.
Escreve em ${langNames[language] || language}. Tom: ${tone}.
Devolve APENAS JSON válido com:
- headline (string, forte, ≤12 palavras)
- subheadline (string, 1–2 frases)
- cta_label (string, curto, verbo de compra)
- benefits (array de 4–6 strings, benefícios concretos)
- body_markdown (string Markdown curto: 2–4 parágrafos + lista se útil; sem H1)
Não uses markdown fences. Não inventes preços.`,
        },
        {
          role: 'user',
          content: `Título do produto: ${funnel.title}
Descrição do conteúdo do PDF/ebook:
${description}
${imageUrls.length ? `Há ${imageUrls.length} foto(s) na landing (URLs internas — não as cites no texto).` : 'Sem fotos anexadas.'}`,
        },
      ],
    })

    const raw = completion.choices[0]?.message?.content
    if (!raw) return { ok: false, error: 'IA não devolveu conteúdo.' }

    const parsed = parseAiJsonLoose(raw)
    const headline = String(parsed.headline || '').trim()
    const subheadline = String(parsed.subheadline || '').trim()
    const ctaLabel =
      String(parsed.cta_label || '').trim() || 'Comprar agora'
    const benefits = Array.isArray(parsed.benefits)
      ? parsed.benefits.map((b) => String(b).trim()).filter(Boolean).slice(0, 8)
      : []
    const bodyMarkdown = String(parsed.body_markdown || '').trim()

    if (!headline) return { ok: false, error: 'IA não devolveu headline.' }

    const landing_body = {
      benefits,
      body_markdown: bodyMarkdown,
      tone,
      language,
      images: imageUrls,
      generated_at: new Date().toISOString(),
      source_description: description,
    }

    const { error: updateError } = await client
      .from('ebook_funnels')
      .update({
        headline,
        subheadline,
        cta_label: ctaLabel,
        landing_body,
      })
      .eq('id', funnelId)

    if (updateError) return { ok: false, error: updateError.message }

    revalidateBoost([`/produtos/boost/funis/${funnelId}`, '/produtos/boost/funis'])
    return {
      ok: true,
      message: 'Landing gerada e guardada (headline, CTA, benefícios).',
    }
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : 'Erro ao gerar landing',
    }
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
