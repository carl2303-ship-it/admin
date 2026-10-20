import type { SupabaseClient } from '@supabase/supabase-js'
import { EUROPEAN_PADEL_CLUBS } from '@/lib/sportsevents/european-padel-clubs'
import { createServiceClient } from '@/lib/supabase/admin'

const DEFAULT_LANG: Record<string, string> = {
  IT: 'it',
  FR: 'fr',
  GB: 'en',
  CH: 'de',
  BE: 'fr',
  DE: 'de',
  NL: 'nl',
  SE: 'sv',
  DK: 'da',
  PT: 'pt',
  ES: 'es',
}

function partnerKey(name: string, countryCode: string) {
  return `${countryCode.trim().toUpperCase()}::${name.trim().toLowerCase()}`
}

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
}

/**
 * Idempotente: garante os 37 clubes europeus do legado em `partners`.
 * Exige service role — NÃO faz fallback para o client cookie (RLS bloqueia insert).
 */
export async function ensureEuropeanPadelClubs(
  db?: SupabaseClient | null
): Promise<EnsureClubsResult> {
  const totalSeed = EUROPEAN_PADEL_CLUBS.length
  const client = db ?? createServiceClient()

  if (!client) {
    return {
      ok: false,
      inserted: 0,
      skipped: 0,
      totalSeed,
      existingClubs: 0,
      clubesPadelAfter: 0,
      errors: [],
      serviceRole: false,
      error:
        'SUPABASE_SERVICE_ROLE_KEY em falta no Netlify do admin — não dá para importar clubes. Corre o SQL em docs/migrations/20261020090000_seed_european_padel_clubs.sql no projecto SportsEvents.',
    }
  }

  const { data: existing, error: listError } = await client
    .from('partners')
    .select('id, name, country_code, type')
    .eq('type', 'CLUBE_PADEL')

  if (listError) {
    return {
      ok: false,
      inserted: 0,
      skipped: 0,
      totalSeed,
      existingClubs: 0,
      clubesPadelAfter: 0,
      errors: [listError.message],
      serviceRole: true,
      error: `Falha a listar partners: ${listError.message}`,
    }
  }

  const known = new Set(
    (existing || []).map((p) =>
      partnerKey(String(p.name || ''), String(p.country_code || ''))
    )
  )

  const missing = EUROPEAN_PADEL_CLUBS.filter(
    (club) => !known.has(partnerKey(club.name, club.country_code))
  )

  const errors: string[] = []
  let inserted = 0

  // Um a um: se um falhar (schema), os outros ainda entram e o erro fica explícito.
  for (const club of missing) {
    const row = {
      name: club.name,
      type: 'CLUBE_PADEL',
      contact_name: 'Clube',
      email: club.email || null,
      phone: club.phone || null,
      status: 'PROSPECAO',
      rating: 5,
      country_code: club.country_code,
      country_name: club.country_name,
      city: club.city || null,
      region: club.region || null,
      address: club.address || null,
      courts_info: club.courts_info || null,
      infrastructure:
        'infrastructure' in club ? club.infrastructure || null : null,
      preferred_language: DEFAULT_LANG[club.country_code] || 'en',
      notes: 'Seed europeu — lista legado sportsevents.app/admin',
    }

    const { error: insertError } = await client.from('partners').insert(row)
    if (insertError) {
      errors.push(`${club.name} (${club.country_code}): ${insertError.message}`)
    } else {
      inserted += 1
    }
  }

  const { count } = await client
    .from('partners')
    .select('id', { count: 'exact', head: true })
    .eq('type', 'CLUBE_PADEL')

  const clubesPadelAfter = count ?? (existing?.length || 0) + inserted
  const ok = errors.length === 0 && clubesPadelAfter >= totalSeed

  return {
    ok,
    inserted,
    skipped: totalSeed - missing.length,
    totalSeed,
    existingClubs: existing?.length || 0,
    clubesPadelAfter,
    errors,
    serviceRole: true,
    error: errors.length
      ? `Import parcial: ${inserted} ok, ${errors.length} erros. Primeiro: ${errors[0]}`
      : clubesPadelAfter < totalSeed
        ? `Só ${clubesPadelAfter}/${totalSeed} clubes CLUBE_PADEL na DB após ensure.`
        : undefined,
  }
}
