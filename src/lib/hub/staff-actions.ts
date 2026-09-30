'use server'

import { revalidatePath } from 'next/cache'
import { requireHubStaff } from '@/lib/auth/hub-auth'
import { createHubServiceClient } from '@/lib/supabase/admin'
import { HUB_ROLES, type HubRole } from '@/lib/auth/roles'

export type StaffActionResult =
  | { ok: true; message?: string }
  | { ok: false; error: string }

function isOwner(
  role: HubRole | 'bootstrap' | undefined,
  isBootstrap: boolean
): boolean {
  return isBootstrap || role === 'owner'
}

async function guardOwner(): Promise<
  | { ok: true; userId: string; isBootstrap: boolean }
  | { ok: false; error: string }
> {
  const auth = await requireHubStaff()
  if (!auth.user) return { ok: false, error: 'Não autenticado' }
  if (auth.error && !auth.isBootstrap) return { ok: false, error: auth.error }
  const role = auth.isBootstrap ? 'bootstrap' : auth.staff?.role
  if (!isOwner(role, auth.isBootstrap)) {
    return { ok: false, error: 'Só owners podem gerir a equipa hub.' }
  }
  return { ok: true, userId: auth.user.id, isBootstrap: auth.isBootstrap }
}

export async function listHubStaff(): Promise<
  | {
      ok: true
      data: {
        id: string
        email: string
        full_name: string | null
        role: string
        active: boolean
        boost_user_id: string | null
        padel1_user_id: string | null
        se_user_id: string | null
        user_id: string
      }[]
    }
  | { ok: false; error: string; missingConfig?: boolean }
> {
  const auth = await requireHubStaff()
  if (!auth.user) return { ok: false, error: 'Não autenticado' }
  if (auth.error && !auth.isBootstrap) return { ok: false, error: auth.error }

  const client = createHubServiceClient()
  if (!client) {
    return {
      ok: false,
      error: 'SUPABASE_SERVICE_ROLE_KEY em falta',
      missingConfig: true,
    }
  }

  const { data, error } = await client
    .from('hub_staff')
    .select(
      'id, user_id, email, full_name, role, active, boost_user_id, padel1_user_id, se_user_id'
    )
    .order('created_at', { ascending: true })

  if (error) return { ok: false, error: error.message }
  return { ok: true, data: data || [] }
}

export async function bootstrapSelfAsOwner(
  formData: FormData
): Promise<StaffActionResult> {
  const auth = await requireHubStaff()
  if (!auth.user) return { ok: false, error: 'Não autenticado' }
  if (!auth.isBootstrap) {
    return { ok: false, error: 'Bootstrap só quando hub_staff está vazio.' }
  }

  const client = createHubServiceClient()
  if (!client) return { ok: false, error: 'SUPABASE_SERVICE_ROLE_KEY em falta' }

  const fullName = String(formData.get('full_name') || '').trim() || null
  const { error } = await client.from('hub_staff').insert({
    user_id: auth.user.id,
    email: auth.user.email || '',
    full_name: fullName,
    role: 'owner',
    active: true,
  })
  if (error) return { ok: false, error: error.message }
  revalidatePath('/equipa')
  revalidatePath('/dashboard')
  return { ok: true, message: 'Registado como owner.' }
}

export async function createHubStaffMember(
  formData: FormData
): Promise<StaffActionResult> {
  const g = await guardOwner()
  if (!g.ok) return g

  const client = createHubServiceClient()
  if (!client) return { ok: false, error: 'SUPABASE_SERVICE_ROLE_KEY em falta' }

  const email = String(formData.get('email') || '')
    .trim()
    .toLowerCase()
  const password = String(formData.get('password') || '')
  const fullName = String(formData.get('full_name') || '').trim() || null
  const role = String(formData.get('role') || 'readonly') as HubRole
  const boostUserId = String(formData.get('boost_user_id') || '').trim() || null
  const padel1UserId =
    String(formData.get('padel1_user_id') || '').trim() || null

  if (!email || !password) {
    return { ok: false, error: 'Email e password obrigatórios' }
  }
  if (!HUB_ROLES.includes(role)) {
    return { ok: false, error: 'Role inválido' }
  }
  if (password.length < 8) {
    return { ok: false, error: 'Password com pelo menos 8 caracteres' }
  }

  const { data: created, error: createError } =
    await client.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    })

  if (createError || !created.user) {
    return {
      ok: false,
      error: createError?.message || 'Falha ao criar utilizador Auth',
    }
  }

  const { error } = await client.from('hub_staff').insert({
    user_id: created.user.id,
    email,
    full_name: fullName,
    role,
    active: true,
    boost_user_id: boostUserId,
    padel1_user_id: padel1UserId,
    se_user_id: created.user.id,
  })

  if (error) {
    return {
      ok: false,
      error: `Auth criado mas hub_staff falhou: ${error.message}`,
    }
  }

  revalidatePath('/equipa')
  return { ok: true, message: `Conta criada para ${email}` }
}

export async function updateHubStaffMember(
  formData: FormData
): Promise<StaffActionResult> {
  const g = await guardOwner()
  if (!g.ok) return g

  const client = createHubServiceClient()
  if (!client) return { ok: false, error: 'SUPABASE_SERVICE_ROLE_KEY em falta' }

  const id = String(formData.get('id') || '')
  if (!id) return { ok: false, error: 'ID em falta' }

  const role = String(formData.get('role') || 'readonly') as HubRole
  if (!HUB_ROLES.includes(role)) return { ok: false, error: 'Role inválido' }

  const { error } = await client
    .from('hub_staff')
    .update({
      full_name: String(formData.get('full_name') || '').trim() || null,
      role,
      active:
        formData.get('active') === 'on' || formData.get('active') === 'true',
      boost_user_id:
        String(formData.get('boost_user_id') || '').trim() || null,
      padel1_user_id:
        String(formData.get('padel1_user_id') || '').trim() || null,
    })
    .eq('id', id)

  if (error) return { ok: false, error: error.message }
  revalidatePath('/equipa')
  return { ok: true }
}

export async function toggleHubStaffActive(
  id: string
): Promise<StaffActionResult> {
  const g = await guardOwner()
  if (!g.ok) return g

  const client = createHubServiceClient()
  if (!client) return { ok: false, error: 'SUPABASE_SERVICE_ROLE_KEY em falta' }

  const { data, error } = await client
    .from('hub_staff')
    .select('active, user_id')
    .eq('id', id)
    .maybeSingle()
  if (error || !data) return { ok: false, error: error?.message || 'Não encontrado' }
  if (data.user_id === g.userId && data.active) {
    return { ok: false, error: 'Não podes desactivar a tua própria conta.' }
  }

  const { error: up } = await client
    .from('hub_staff')
    .update({ active: !data.active })
    .eq('id', id)
  if (up) return { ok: false, error: up.message }
  revalidatePath('/equipa')
  return { ok: true }
}
