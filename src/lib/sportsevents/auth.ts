import { requireHubAccess, type HubStaff } from '@/lib/auth/hub-auth'
import type { HubRole } from '@/lib/auth/roles'

/** Escrita operacional SE (calendário, CRM, pacotes, parceiros, blog, social…). */
const SE_WRITE_ROLES: HubRole[] = ['owner', 'ops', 'commerce']

/** Settings sensíveis + staff_members SE. */
const SE_ADMIN_ROLES: HubRole[] = ['owner']

export function canWriteSportsEvents(
  role: HubRole | 'bootstrap' | undefined
): boolean {
  if (role === 'bootstrap') return true
  if (!role) return false
  return SE_WRITE_ROLES.includes(role)
}

export function canAdminSportsEvents(
  role: HubRole | 'bootstrap' | undefined
): boolean {
  if (role === 'bootstrap') return true
  if (!role) return false
  return SE_ADMIN_ROLES.includes(role)
}

export async function requireSportsEventsModule() {
  return requireHubAccess('sportsevents')
}

export function staffRole(
  staff: HubStaff | null,
  isBootstrap: boolean
): HubRole | 'bootstrap' {
  if (isBootstrap) return 'bootstrap'
  return staff?.role ?? 'readonly'
}

/**
 * Gate para Route Handlers `/api/se/*`.
 * Substitui requireStaffUser do legado (staff_members → hub_staff).
 */
export async function requireSeStaff() {
  const auth = await requireSportsEventsModule()
  if (auth.error || !auth.user) {
    return {
      error: auth.error || 'Não autenticado',
      status: auth.status || (401 as const),
      user: auth.user,
      staff: auth.staff,
      isBootstrap: auth.isBootstrap,
    }
  }
  if (!auth.isBootstrap && !canWriteSportsEvents(staffRole(auth.staff, false))) {
    return {
      ...auth,
      error: 'Sem permissão de escrita SportsEvents.',
      status: 403 as const,
    }
  }
  return {
    error: null as string | null,
    status: 200 as const,
    user: auth.user,
    staff: auth.staff,
    isBootstrap: auth.isBootstrap,
  }
}

/** Gate admin (definições / staff_members) — owner hub. */
export async function requireSeAdmin() {
  const auth = await requireSportsEventsModule()
  if (auth.error || !auth.user) {
    return {
      error: auth.error || 'Não autenticado',
      status: auth.status || (401 as const),
      user: auth.user,
      staff: auth.staff,
      isBootstrap: auth.isBootstrap,
    }
  }
  if (!auth.isBootstrap && !canAdminSportsEvents(staffRole(auth.staff, false))) {
    return {
      ...auth,
      error: 'Apenas owner pode gerir definições sensíveis SE.',
      status: 403 as const,
    }
  }
  return {
    error: null as string | null,
    status: 200 as const,
    user: auth.user,
    staff: auth.staff,
    isBootstrap: auth.isBootstrap,
  }
}

export function maskSecret(value: string | null | undefined) {
  if (!value) return ''
  if (value.length <= 8) return '••••••••'
  return `${value.slice(0, 4)}••••${value.slice(-4)}`
}

/** Compat legado StaffRole (CRUD staff_members no site SE). */
export type StaffRole = 'ADMIN' | 'STAFF' | 'OPERACOES' | 'COMERCIAL'
