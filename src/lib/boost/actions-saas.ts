'use server'

import { requireBoostClient, invokeBoostEdgeFunction } from './client'
import { PLAN_MAX_TOURNAMENTS } from './types'
import {
  guardWrite,
  guardContentWrite,
  revalidateBoost,
  slugify,
  type ActionResult,
} from './actions-shared'

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
