import { requireHubAccess, type HubStaff } from '@/lib/auth/hub-auth'
import type { HubRole } from '@/lib/auth/roles'

/** Roles com escrita no módulo Boost (loja / SaaS / marketing). */
const BOOST_WRITE_ROLES: HubRole[] = ['owner', 'commerce']

/** Blog / conteúdo no módulo Boost. */
const BOOST_CONTENT_WRITE_ROLES: HubRole[] = ['owner', 'commerce', 'content']

export function canWriteBoost(role: HubRole | 'bootstrap' | undefined): boolean {
  if (role === 'bootstrap') return true
  if (!role) return false
  return BOOST_WRITE_ROLES.includes(role)
}

export function canWriteBoostContent(
  role: HubRole | 'bootstrap' | undefined
): boolean {
  if (role === 'bootstrap') return true
  if (!role) return false
  return BOOST_CONTENT_WRITE_ROLES.includes(role)
}

export async function requireBoostModule() {
  return requireHubAccess('boost')
}

export function staffRole(
  staff: HubStaff | null,
  isBootstrap: boolean
): HubRole | 'bootstrap' {
  if (isBootstrap) return 'bootstrap'
  return staff?.role ?? 'readonly'
}
