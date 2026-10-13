import { requirePadel1Client, Padel1ConfigError } from './client'
import type {
  Padel1Club,
  Padel1ClientModule,
  Padel1CombinedUser,
  Padel1DashboardKpis,
  Padel1LicenseKey,
  Padel1Metrics,
  Padel1PlatformModule,
  Padel1PlatformPack,
  Padel1PlatformPayment,
  Padel1PlatformPlan,
  Padel1PlayerTransaction,
  Padel1StripeConfigStatus,
  Padel1SuperAdmin,
} from './types'
import { TXN_TYPE_LABELS } from './types'

export type QueryResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; missingConfig?: boolean }

function wrapError(err: unknown): QueryResult<never> {
  if (err instanceof Padel1ConfigError) {
    return { ok: false, error: err.message, missingConfig: true }
  }
  return {
    ok: false,
    error: err instanceof Error ? err.message : 'Erro desconhecido',
  }
}

export async function padel1ModuleCounts() {
  return { ok: false as const, error: 'STUB_PENDING_FULL_PUSH' }
}
export async function getDashboardKpis() {
  return { ok: false as const, error: 'STUB_PENDING_FULL_PUSH' }
}
export async function listClubs() {
  return { ok: false as const, error: 'STUB_PENDING_FULL_PUSH' }
}
export async function getClubDetail(_club: Padel1Club) {
  return { ok: false as const, error: 'STUB_PENDING_FULL_PUSH' }
}
export async function listClubLicenseKeys(_clubId: string) {
  return { ok: false as const, error: 'STUB_PENDING_FULL_PUSH' }
}
export async function listPlatformModules() {
  return { ok: false as const, error: 'STUB_PENDING_FULL_PUSH' }
}
export async function listPlatformPacks() {
  return { ok: false as const, error: 'STUB_PENDING_FULL_PUSH' }
}
export async function getClientModules(_a: 'club' | 'organizer', _b: string) {
  return { ok: false as const, error: 'STUB_PENDING_FULL_PUSH' }
}
export async function listPlayerTransactions() {
  return { ok: false as const, error: 'STUB_PENDING_FULL_PUSH' }
}
export async function listPlatformPayments() {
  return { ok: false as const, error: 'STUB_PENDING_FULL_PUSH' }
}
export async function listClubsForSelect() {
  return { ok: false as const, error: 'STUB_PENDING_FULL_PUSH' }
}
export async function getMetrics() {
  return { ok: false as const, error: 'STUB_PENDING_FULL_PUSH' }
}
export async function listCombinedUsers() {
  return { ok: false as const, error: 'STUB_PENDING_FULL_PUSH' }
}
export async function getSettings() {
  return { ok: false as const, error: 'STUB_PENDING_FULL_PUSH' }
}
