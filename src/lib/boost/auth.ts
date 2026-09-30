import { requireHubAccess, type HubStaff } from '@/lib/auth/hub-auth'
import type { HubRole } from '@/lib/auth/roles'

/** Roles com escrita no módulo Boost (loja / SaaS). */
const BOOST_WRITE_ROLES: HubRole[] = ['owner', 'commerce']

export function canWriteBoost(role: HubRole | 'bootstrap' | undefined): boolean {
  if (role === 'bootstrap') return true
  if (!role) return false
  return BOOST_WRITE_ROLES.includes(role)
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
