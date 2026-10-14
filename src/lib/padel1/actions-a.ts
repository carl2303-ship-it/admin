'use server'

import { revalidatePath } from 'next/cache'
import { requirePadel1Client, invokePadel1EdgeFunction } from './client'
import {
  requirePadel1Module,
  canWritePadel1,
  staffRole,
} from './auth'
import { getClientModules, listClubLicenseKeys } from './queries'
import type { ActionResult, Padel1ClubForm } from './types'

async function guardWrite(): Promise<
  { ok: true } | { ok: false; error: string }
> {
  const auth = await requirePadel1Module()
  if (!auth.user) return { ok: false, error: 'Não autenticado' }
  if (auth.error && !auth.isBootstrap) return { ok: false, error: auth.error }
  const role = staffRole(auth.staff, auth.isBootstrap)
  if (!canWritePadel1(role)) {
    return { ok: false, error: 'Sem permissão de escrita (owner/platform).' }
  }
  return { ok: true }
}

function revalidatePadel1(paths: string[] = []) {
  revalidatePath('/produtos/padel1')
  for (const p of paths) revalidatePath(p)
}

function randomLicenseKey() {
  const chunk = () =>
    Math.random().toString(36).slice(2, 6).toUpperCase()
  return `P1-${chunk()}-${chunk()}-${chunk()}`
}

export async function updateClubStatus(
  clubId: string,
  status: 'active' | 'suspended'
): Promise<ActionResult> {
  const g = await guardWrite()
  if (!g.ok) return g
  try {
    const client = requirePadel1Client()
    const { error } = await client
      .from('clubs')
      .update({ status })
      .eq('id', clubId)
    if (error) return { ok: false, error: error.message }
    revalidatePadel1(['/produtos/padel1/clubes'])
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Erro' }
  }
}

export async function updateClubPlan(
  clubId: string,
  planType: string
): Promise<ActionResult> {
  const g = await guardWrite()
  if (!g.ok) return g
  try {
    const client = requirePadel1Client()
    const { error } = await client
      .from('clubs')
      .update({ plan_type: planType })
      .eq('id', clubId)
    if (error) return { ok: false, error: error.message }
    revalidatePadel1(['/produtos/padel1/clubes'])
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Erro' }
  }
}

export async function updateClubContract(
  clubId: string,
  contractStart: string | null,
  contractExpiresAt: string | null
): Promise<ActionResult> {
  const g = await guardWrite()
  if (!g.ok) return g
  try {
    const client = requirePadel1Client()
    const { error } = await client
      .from('clubs')
      .update({
        contract_start: contractStart || null,
        contract_expires_at: contractExpiresAt || null,
      })
      .eq('id', clubId)
    if (error) return { ok: false, error: error.message }
    revalidatePadel1(['/produtos/padel1/clubes'])
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Erro' }
  }
}

export async function createClub(
  form: Padel1ClubForm
): Promise<ActionResult> {
  const g = await guardWrite()
  if (!g.ok) return g
  if (!form.name.trim()) return { ok: false, error: 'Nome obrigatório.' }
  try {
    const client = requirePadel1Client()
    const { error } = await client.from('clubs').insert({
      name: form.name.trim(),
      description: form.description.trim() || null,
      city: form.city.trim() || null,
      address: form.address.trim() || null,
      country: form.country.trim() || 'Portugal',
      phone: form.phone.trim() || null,
      email: form.email.trim() || null,
      website: form.website.trim() || null,
      logo_url: form.logo_url.trim() || null,
      photo_url_1: form.photo_url_1.trim() || null,
      photo_url_2: form.photo_url_2.trim() || null,
      plan_type: form.plan_type || 'bronze',
      owner_id: null,
      status: 'active',
      is_active: true,
      is_managed: false,
    })
    if (error) return { ok: false, error: error.message }
    revalidatePadel1(['/produtos/padel1/clubes'])
    return { ok: true, message: 'Clube criado.' }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Erro' }
  }
}

export async function updateClub(
  clubId: string,
  form: Padel1ClubForm
): Promise<ActionResult> {
  const g = await guardWrite()
  if (!g.ok) return g
  if (!form.name.trim()) return { ok: false, error: 'Nome obrigatório.' }
  try {
    const client = requirePadel1Client()
    const { error } = await client
      .from('clubs')
      .update({
        name: form.name.trim(),
        description: form.description.trim() || null,
        city: form.city.trim() || null,
        address: form.address.trim() || null,
        country: form.country.trim() || 'Portugal',
        phone: form.phone.trim() || null,
        email: form.email.trim() || null,
        website: form.website.trim() || null,
        logo_url: form.logo_url.trim() || null,
        photo_url_1: form.photo_url_1.trim() || null,
        photo_url_2: form.photo_url_2.trim() || null,
        plan_type: form.plan_type || 'bronze',
      })
      .eq('id', clubId)
    if (error) return { ok: false, error: error.message }
    revalidatePadel1(['/produtos/padel1/clubes'])
    return { ok: true, message: 'Clube actualizado.' }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Erro' }
  }
}

export async function assignClubOwner(input: {
  clubId: string
  email: string
  password?: string
  createNew: boolean
}): Promise<ActionResult> {
  const g = await guardWrite()
  if (!g.ok) return g
  const email = input.email.trim().toLowerCase()
  if (!email) return { ok: false, error: 'Email obrigatório.' }
  if (input.createNew && !input.password) {
    return { ok: false, error: 'Password obrigatória para criar conta.' }
  }

  const edge = await invokePadel1EdgeFunction<{
    user_id?: string
    found?: boolean
    is_new?: boolean
  }>('create-club-owner', {
    email,
    password: input.password || undefined,
    mode: input.createNew ? 'create' : 'lookup',
  })
  if (edge.error) return { ok: false, error: edge.error }
  const userId = edge.data?.user_id
  if (!userId) {
    return {
      ok: false,
      error: input.createNew
        ? 'Falha a criar owner.'
        : 'Utilizador não encontrado com este email.',
    }
  }

  try {
    const client = requirePadel1Client()
    const { error } = await client
      .from('clubs')
      .update({ owner_id: userId, is_managed: true })
      .eq('id', input.clubId)
    if (error) return { ok: false, error: error.message }
    revalidatePadel1(['/produtos/padel1/clubes'])
    return {
      ok: true,
      message: edge.data?.is_new
        ? 'Owner criado e atribuído.'
        : 'Owner atribuído.',
      data: { user_id: userId },
    }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Erro' }
  }
}

export async function removeClubOwner(clubId: string): Promise<ActionResult> {
  const g = await guardWrite()
  if (!g.ok) return g
  try {
    const client = requirePadel1Client()
    const { error } = await client
      .from('clubs')
      .update({ owner_id: null, is_managed: false })
      .eq('id', clubId)
    if (error) return { ok: false, error: error.message }
    revalidatePadel1(['/produtos/padel1/clubes'])
    return { ok: true, message: 'Owner removido.' }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Erro' }
  }
}

export async function generateLicenseKey(input: {
  clubId: string
  ownerId?: string | null
  planName: string
  durationMonths: number
  customPrice?: number | null
}): Promise<ActionResult> {
  const g = await guardWrite()
  if (!g.ok) return g
  try {
    const client = requirePadel1Client()
    const key = randomLicenseKey()
    const { error } = await client.from('license_keys').insert({
      license_key: key,
      target_type: 'club',
      plan_name: input.planName,
      duration_months: input.durationMonths,
      target_entity_id: input.clubId,
      target_user_id: input.ownerId || null,
      custom_price: input.customPrice ?? null,
      status: 'active',
    })
    if (error) return { ok: false, error: error.message }
    revalidatePadel1(['/produtos/padel1/clubes'])
    return { ok: true, message: `Chave: ${key}`, data: { license_key: key } }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Erro' }
  }
}

export async function createPlatformCheckout(input: {
  clubId: string
  planName: string
  durationMonths: number
  billingInterval: 'month' | 'year'
  payerEmail: string
}): Promise<ActionResult> {
  const g = await guardWrite()
  if (!g.ok) return g
  const origin =
    process.env.NEXT_PUBLIC_PADEL1_HQ_URL?.replace(/#.*$/, '') ||
    'https://manager.padel1.app'
  const edge = await invokePadel1EdgeFunction<{ ok?: boolean; url?: string }>(
    'create-platform-checkout',
    {
      target_type: 'club',
      plan_name: input.planName,
      duration_months: input.durationMonths,
      billing_interval: input.billingInterval,
      target_entity_id: input.clubId,
      payer_email: input.payerEmail,
      success_url: `${origin}/?payment=success`,
      cancel_url: `${origin}/?payment=cancelled`,
    }
  )
  if (edge.error) return { ok: false, error: edge.error }
  if (!edge.data?.url) return { ok: false, error: 'Checkout sem URL.' }
  return {
    ok: true,
    message: 'Link de checkout gerado.',
    data: { url: edge.data.url },
  }
}

export async function sendCheckoutEmail(input: {
  toEmail: string
  toName: string
  checkoutUrl: string
  planName: string
}): Promise<ActionResult> {
  const g = await guardWrite()
  if (!g.ok) return g
  const edge = await invokePadel1EdgeFunction('send-checkout-email', {
    to_email: input.toEmail,
    to_name: input.toName,
    checkout_url: input.checkoutUrl,
    plan_name: input.planName,
    target_type: 'club',
  })
  if (edge.error) return { ok: false, error: edge.error }
  return { ok: true, message: 'Email de checkout enviado.' }
}

export async function loadClientModulesAction(input: {
  entityType: 'club' | 'organizer'
  entityId: string
}) {
  const auth = await requirePadel1Module()
  if (!auth.user) return { ok: false as const, error: 'Não autenticado' }
  if (auth.error && !auth.isBootstrap) {
    return { ok: false as const, error: auth.error }
  }
  return getClientModules(input.entityType, input.entityId)
}

export async function loadClubKeysAction(clubId: string) {
  const auth = await requirePadel1Module()
  if (!auth.user) return { ok: false as const, error: 'Não autenticado' }
  if (auth.error && !auth.isBootstrap) {
    return { ok: false as const, error: auth.error }
  }
  return listClubLicenseKeys(clubId)
}

/** Upload logo/fotos — bucket `club-photos`, path `hq/…` (paridade HQClubManagement). */
export async function uploadPadel1ClubPhoto(
  formData: FormData
): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  const g = await guardWrite()
  if (!g.ok) return g

  try {
    const file = formData.get('file')
    if (!(file instanceof File) || file.size === 0) {
      return { ok: false, error: 'Ficheiro em falta' }
    }
    if (!file.type.startsWith('image/')) {
      return { ok: false, error: 'Erro upload: tipo inválido' }
    }

    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
    const path = `hq/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

    const client = requirePadel1Client()
    const buffer = Buffer.from(await file.arrayBuffer())
    const { error } = await client.storage.from('club-photos').upload(path, buffer, {
      contentType: file.type,
      upsert: true,
    })
    if (error) return { ok: false, error: `Erro upload: ${error.message}` }

    const { data } = client.storage.from('club-photos').getPublicUrl(path)
    return { ok: true, url: data.publicUrl }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Erro upload' }
  }
}

export async function deleteClub(clubId: string): Promise<ActionResult> {
  const g = await guardWrite()
  if (!g.ok) return g
  try {
    const client = requirePadel1Client()
    const { error } = await client.from('clubs').delete().eq('id', clubId)
    if (error) return { ok: false, error: error.message }
    revalidatePadel1(['/produtos/padel1/clubes'])
    return { ok: true, message: 'Clube eliminado.' }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Erro' }
  }
}

export async function setClientModule(input: {
  entityType: 'club' | 'organizer'
  entityId: string
  moduleCode: string
  enabled: boolean
}): Promise<ActionResult> {
  const g = await guardWrite()
  if (!g.ok) return g
  try {
    const client = requirePadel1Client()
    const { error } = await client.rpc('set_client_module', {
      p_entity_type: input.entityType,
      p_entity_id: input.entityId,
      p_module_code: input.moduleCode,
      p_enabled: input.enabled,
      p_expires_at: null,
      p_notes: null,
    })
    if (error) return { ok: false, error: error.message }
    revalidatePadel1(['/produtos/padel1/clubes'])
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Erro' }
  }
}
