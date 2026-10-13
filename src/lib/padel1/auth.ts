import { requireHubAccess, type HubStaff } from '@/lib/auth/hub-auth'
import type { HubRole } from '@/lib/auth/roles'

/** Roles com escrita no HQ Padel1 (clubes, módulos, users, settings). */
const PADEL1_WRITE_ROLES: HubRole[] = ['owner', 'platform']

export function canWritePadel1(
  role: HubRole | 'bootstrap' | undefined
): boolean {
  if (role === 'bootstrap') return true
  if (!role) return false
  return PADEL1_WRITE_ROLES.includes(role)
}

export async function requirePadel1Module() {
  return requireHubAccess('padel1')
}

export function staffRole(
  staff: HubStaff | null,
  isBootstrap: boolean
): HubRole | 'bootstrap' {
  if (isBootstrap) return 'bootstrap'
  return staff?.role ?? 'readonly'
}
