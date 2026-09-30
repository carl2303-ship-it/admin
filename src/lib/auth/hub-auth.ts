import { createClient } from '@/lib/supabase/server'
import { createHubServiceClient } from '@/lib/supabase/admin'
import { HUB_ROLES, type HubProduct, type HubRole, roleCanAccess } from './roles'

export type HubStaff = {
  id: string
  user_id: string
  email: string
  full_name: string | null
  role: HubRole
  active: boolean
  boost_user_id: string | null
  padel1_user_id: string | null
  se_user_id: string | null
}

function isHubRole(value: string): value is HubRole {
  return (HUB_ROLES as readonly string[]).includes(value)
}

export async function requireHubStaff() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return {
      error: 'Não autenticado',
      status: 401 as const,
      user: null,
      staff: null as HubStaff | null,
      isBootstrap: false,
    }
  }

  const service = createHubServiceClient()
  const client = service || supabase

  const { data: staffRow } = await client
    .from('hub_staff')
    .select(
      'id, user_id, email, full_name, role, active, boost_user_id, padel1_user_id, se_user_id'
    )
    .eq('user_id', user.id)
    .maybeSingle()

  if (!staffRow) {
    const { count } = await client
      .from('hub_staff')
      .select('id', { count: 'exact', head: true })

    if ((count || 0) === 0) {
      return {
        error: null,
        status: 200 as const,
        user,
        staff: null,
        isBootstrap: true,
      }
    }

    return {
      error: 'Sem perfil hub_staff. Pede a um owner para te adicionar.',
      status: 403 as const,
      user,
      staff: null,
      isBootstrap: false,
    }
  }

  if (!isHubRole(staffRow.role)) {
    return {
      error: 'Role inválido em hub_staff.',
      status: 403 as const,
      user,
      staff: null,
      isBootstrap: false,
    }
  }

  const staff: HubStaff = {
    ...staffRow,
    role: staffRow.role,
  }

  if (!staff.active) {
    return {
      error: 'Conta desativada.',
      status: 403 as const,
      user,
      staff,
      isBootstrap: false,
    }
  }

  return {
    error: null,
    status: 200 as const,
    user,
    staff,
    isBootstrap: false,
  }
}

export async function requireHubAccess(product: HubProduct) {
  const auth = await requireHubStaff()
  if (auth.error || !auth.user) return auth

  if (auth.isBootstrap) return auth

  if (!auth.staff || !roleCanAccess(auth.staff.role, product)) {
    return {
      ...auth,
      error: 'Sem permissão para esta área.',
      status: 403 as const,
    }
  }

  return auth
}
