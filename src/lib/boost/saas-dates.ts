import type { BoostOrganization } from './types'

const ptDate: Intl.DateTimeFormatOptions = {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
}

/** Formata ISO para pt-PT; null/invalid → "—". */
export function formatSaasDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('pt-PT', ptDate)
}

/**
 * Início do período do plano.
 * Preferência: `contract_start` → senão `created_at` (derivado) → null.
 */
export function resolveSaasPlanStart(org: Pick<
  BoostOrganization,
  'contract_start' | 'created_at'
>): { iso: string | null; derived: boolean } {
  if (org.contract_start) {
    return { iso: org.contract_start, derived: false }
  }
  if (org.created_at) {
    return { iso: org.created_at, derived: true }
  }
  return { iso: null, derived: false }
}

/** Fim do período: `subscription_expires_at` ou null. */
export function resolveSaasPlanEnd(
  org: Pick<BoostOrganization, 'subscription_expires_at'>
): string | null {
  return org.subscription_expires_at || null
}

export function isSaasExpired(
  org: Pick<BoostOrganization, 'subscription_expires_at'>
): boolean {
  const end = resolveSaasPlanEnd(org)
  if (!end) return false
  return new Date(end).getTime() < Date.now()
}

export function isSaasActiveCard(
  org: Pick<BoostOrganization, 'status' | 'subscription_expires_at'>
): boolean {
  return org.status === 'active' && !isSaasExpired(org)
}

/**
 * Infere mensal vs anual pela duração do contrato quando não há campo dedicado.
 */
export function inferBillingPeriod(
  org: Pick<
    BoostOrganization,
    'contract_start' | 'created_at' | 'subscription_expires_at'
  >
): 'mensal' | 'anual' {
  const start = resolveSaasPlanStart(org).iso
  const end = resolveSaasPlanEnd(org)
  if (!start || !end) return 'mensal'
  const days =
    (new Date(end).getTime() - new Date(start).getTime()) / 86_400_000
  return days >= 180 ? 'anual' : 'mensal'
}
