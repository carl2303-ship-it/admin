/**
 * @deprecated Seed inventado de ~37 clubes — DESACTIVADO.
 * Os clubes reais (~132 CLUBE_PADEL) já estão em public.partners no projecto SE.
 * Usar getPartnersDbCounts() / GET /api/se/data.
 */

export type EnsureClubsResult = {
  ok: boolean
  inserted: number
  skipped: number
  totalSeed: number
  existingClubs: number
  clubesPadelAfter: number
  errors: string[]
  serviceRole: boolean
  error?: string
  seedDisabled?: boolean
}

/** No-op: não insere seed inventado. */
export async function ensureEuropeanPadelClubs(): Promise<EnsureClubsResult> {
  return {
    ok: false,
    inserted: 0,
    skipped: 0,
    totalSeed: 0,
    existingClubs: 0,
    clubesPadelAfter: 0,
    errors: [],
    serviceRole: false,
    seedDisabled: true,
    error:
      'Seed inventado desactivado. Lê public.partners via /api/se/data (clubes reais na DB SE).',
  }
}
