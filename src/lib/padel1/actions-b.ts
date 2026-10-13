'use server'

import { revalidatePath } from 'next/cache'
import { requirePadel1Client, invokePadel1EdgeFunction } from './client'
import {
  requirePadel1Module,
  canWritePadel1,
  staffRole,
} from './auth'
import { getClientModules, listClubLicenseKeys } from './queries'
import type { Padel1ClubForm } from './types'

export type ActionResult =
  | { ok: true; message?: string; data?: Record<string, unknown> }
  | { ok: false; error: string }

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

export async function bulkEnableModules(input: {
  entityType: 'club' | 'organizer'
  entityId: string
}): Promise<ActionResult> {
  const g = await guardWrite()
  if (!g.ok) return g
  try {
    const client = requirePadel1Client()
    const { error } = await client.rpc('bulk_enable_all_modules', {
      p_entity_type: input.entityType,
      p_entity_id: input.entityId,
      p_expires_at: null,
    })
    if (error) return { ok: false, error: error.message }
    revalidatePadel1(['/produtos/padel1/clubes'])
    return { ok: true, message: 'Todos os módulos activados.' }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Erro' }
  }
}

export async function applyClientPack(input: {
  entityType: 'club' | 'organizer'
  entityId: string
  packCode: string
}): Promise<ActionResult> {
  const g = await guardWrite()
  if (!g.ok) return g
  try {
    const client = requirePadel1Client()
    const { error } = await client.rpc('apply_client_pack', {
      p_entity_type: input.entityType,
      p_entity_id: input.entityId,
      p_pack_code: input.packCode,
    })
    if (error) return { ok: false, error: error.message }
    revalidatePadel1(['/produtos/padel1/clubes'])
    return { ok: true, message: `Pack ${input.packCode} aplicado.` }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Erro' }
  }
}

export async function savePlatformModule(input: {
  code: string
  name: string
  description: string
  priceMonthly: number | null
  priceAnnual: number | null
  targetTypes: string[]
  requiresModules: string[]
  landingFeatures: string[]
  playerAppMode: string
  sortOrder: number
  isNew?: boolean
}): Promise<ActionResult> {
  const g = await guardWrite()
  if (!g.ok) return g
  try {
    const client = requirePadel1Client()
    const payload = {
      code: input.code,
      name: input.name.trim(),
      description: input.description.trim() || null,
      price_monthly: input.priceMonthly,
      price_annual: input.priceAnnual,
      target_types: input.targetTypes,
      requires_modules: input.requiresModules,
      landing_features: input.landingFeatures,
      player_app_mode: input.playerAppMode,
      sort_order: input.sortOrder,
      is_active: true,
    }
    const { error } = input.isNew
      ? await client.from('platform_modules').insert(payload)
      : await client
          .from('platform_modules')
          .update(payload)
          .eq('code', input.code)
    if (error) return { ok: false, error: error.message }
    revalidatePadel1(['/produtos/padel1/modulos'])
    return { ok: true, message: 'Módulo guardado.' }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Erro' }
  }
}

export async function togglePlatformModule(
  code: string,
  isActive: boolean
): Promise<ActionResult> {
  const g = await guardWrite()
  if (!g.ok) return g
  try {
    const client = requirePadel1Client()
    const { error } = await client
      .from('platform_modules')
      .update({ is_active: isActive })
      .eq('code', code)
    if (error) return { ok: false, error: error.message }
    revalidatePadel1(['/produtos/padel1/modulos'])
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Erro' }
  }
}

export async function updatePlatformPack(input: {
  code: string
  name: string
  priceMonthly: number | null
  priceAnnual: number | null
  comparePriceMonthly: number | null
  moduleCodes: string[]
  isPopular: boolean
  landingFeatures: string[]
}): Promise<ActionResult> {
  const g = await guardWrite()
  if (!g.ok) return g
  try {
    const client = requirePadel1Client()
    const { error } = await client
      .from('platform_packs')
      .update({
        name: input.name.trim(),
        price_monthly: input.priceMonthly,
        price_annual: input.priceAnnual,
        compare_price_monthly: input.comparePriceMonthly,
        module_codes: input.moduleCodes,
        is_popular: input.isPopular,
        landing_features: input.landingFeatures,
      })
      .eq('code', input.code)
    if (error) return { ok: false, error: error.message }
    revalidatePadel1(['/produtos/padel1/packs'])
    return { ok: true, message: 'Pack actualizado.' }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Erro' }
  }
}

export async function togglePlatformPack(
  code: string,
  isActive: boolean
): Promise<ActionResult> {
  const g = await guardWrite()
  if (!g.ok) return g
  try {
    const client = requirePadel1Client()
    const { error } = await client
      .from('platform_packs')
      .update({ is_active: isActive })
      .eq('code', code)
    if (error) return { ok: false, error: error.message }
    revalidatePadel1(['/produtos/padel1/packs'])
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Erro' }
  }
}

export async function injectPlayerTransaction(input: {
  clubOwnerId: string
  playerName: string
  playerPhone: string
  amount: number
  notes: string
}): Promise<ActionResult> {
  const g = await guardWrite()
  if (!g.ok) return g
  if (!input.clubOwnerId) return { ok: false, error: 'Clube sem owner.' }
  if (!input.playerName.trim()) return { ok: false, error: 'Nome obrigatório.' }
  try {
    const client = requirePadel1Client()
    const { error } = await client.from('player_transactions').insert({
      club_owner_id: input.clubOwnerId,
      player_name: input.playerName.trim(),
      player_phone: input.playerPhone.trim() || '',
      transaction_type: 'adjustment',
      amount: input.amount,
      notes: input.notes.trim() || null,
      transaction_date: new Date().toISOString(),
    })
    if (error) return { ok: false, error: error.message }
    revalidatePadel1(['/produtos/padel1/transacoes'])
    return { ok: true, message: 'Ajuste injectado.' }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Erro' }
  }
}

export async function addSuperAdmin(input: {
  email: string
  name: string
}): Promise<ActionResult> {
  const g = await guardWrite()
  if (!g.ok) return g
  const email = input.email.trim().toLowerCase()
  const name = input.name.trim()
  if (!email || !name) return { ok: false, error: 'Email e nome obrigatórios.' }
  try {
    const client = requirePadel1Client()
    let userId: string | null = null
    const { data: account } = await client
      .from('player_accounts')
      .select('user_id')
      .eq('email', email)
      .maybeSingle()
    userId = (account?.user_id as string) || null
    if (!userId) {
      const { data: player } = await client
        .from('players')
        .select('user_id')
        .eq('email', email)
        .maybeSingle()
      userId = (player?.user_id as string) || null
    }
    if (!userId) {
      return {
        ok: false,
        error:
          'Utilizador não encontrado. Precisa de conta registada no Padel1.',
      }
    }
    const { error } = await client
      .from('super_admins')
      .insert({ user_id: userId, name })
    if (error) {
      if (error.code === '23505') {
        return { ok: false, error: 'Já é super admin.' }
      }
      return { ok: false, error: error.message }
    }
    revalidatePadel1(['/produtos/padel1/utilizadores'])
    return { ok: true, message: 'Super admin adicionado.' }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Erro' }
  }
}

export async function removeSuperAdmin(id: string): Promise<ActionResult> {
  const g = await guardWrite()
  if (!g.ok) return g
  try {
    const client = requirePadel1Client()
    const { error } = await client.from('super_admins').delete().eq('id', id)
    if (error) return { ok: false, error: error.message }
    revalidatePadel1(['/produtos/padel1/utilizadores'])
    return { ok: true, message: 'Super admin removido.' }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Erro' }
  }
}

export async function saveStripeConfig(input: {
  publishableKey: string
  secretKey: string
  webhookSecret: string
}): Promise<ActionResult> {
  const g = await guardWrite()
  if (!g.ok) return g
  const pk = input.publishableKey.trim()
  const sk = input.secretKey.trim()
  if (!pk || !sk) {
    return { ok: false, error: 'Publishable e Secret Key obrigatórias.' }
  }
  try {
    const client = requirePadel1Client()
    const { data: existing } = await client
      .from('platform_stripe_config')
      .select('id')
      .limit(1)
      .maybeSingle()
    const payload = {
      stripe_publishable_key: pk,
      stripe_secret_key: sk,
      webhook_secret: input.webhookSecret.trim() || null,
      updated_at: new Date().toISOString(),
    }
    const { error } = existing?.id
      ? await client
          .from('platform_stripe_config')
          .update(payload)
          .eq('id', existing.id)
      : await client.from('platform_stripe_config').insert(payload)
    if (error) return { ok: false, error: error.message }
    revalidatePadel1(['/produtos/padel1/configuracoes'])
    return { ok: true, message: 'Stripe plataforma actualizado.' }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Erro' }
  }
}

export async function savePlatformPlan(input: {
  id?: string
  name: string
  priceMonthly: number | null
  priceAnnual: number | null
  featuresJson: string
}): Promise<ActionResult> {
  const g = await guardWrite()
  if (!g.ok) return g
  if (!input.name.trim()) return { ok: false, error: 'Nome obrigatório.' }
  let features: Record<string, unknown> = {}
  try {
    features = JSON.parse(input.featuresJson || '{}') as Record<
      string,
      unknown
    >
  } catch {
    return { ok: false, error: 'features JSON inválido.' }
  }
  try {
    const client = requirePadel1Client()
    const payload = {
      name: input.name.trim(),
      target_type: 'club' as const,
      price_monthly: input.priceMonthly,
      price_annual: input.priceAnnual,
      features,
      is_active: true,
    }
    const { error } = input.id
      ? await client.from('platform_plans').update(payload).eq('id', input.id)
      : await client.from('platform_plans').insert(payload)
    if (error) return { ok: false, error: error.message }
    revalidatePadel1(['/produtos/padel1/configuracoes'])
    return { ok: true, message: 'Plano guardado.' }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Erro' }
  }
}

export async function togglePlatformPlan(
  id: string,
  isActive: boolean
): Promise<ActionResult> {
  const g = await guardWrite()
  if (!g.ok) return g
  try {
    const client = requirePadel1Client()
    const { error } = await client
      .from('platform_plans')
      .update({ is_active: isActive })
      .eq('id', id)
    if (error) return { ok: false, error: error.message }
    revalidatePadel1(['/produtos/padel1/configuracoes'])
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Erro' }
  }
}

export async function deletePlatformPlan(id: string): Promise<ActionResult> {
  const g = await guardWrite()
  if (!g.ok) return g
  try {
    const client = requirePadel1Client()
    const { error } = await client.from('platform_plans').delete().eq('id', id)
    if (error) return { ok: false, error: error.message }
    revalidatePadel1(['/produtos/padel1/configuracoes'])
    return { ok: true, message: 'Plano apagado.' }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Erro' }
  }
}
