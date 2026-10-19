import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/admin'
import { requireSeStaff } from '@/lib/sportsevents/auth'
import { EUROPEAN_PADEL_CLUBS } from '@/lib/sportsevents/european-padel-clubs'

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

/** Idempotente: garante os 37 clubes europeus do legado em `partners`. */
export async function POST() {
  const auth = await requireSeStaff()
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const db = createServiceClient() || (await createClient())

  const { data: existing, error: listError } = await db
    .from('partners')
    .select('id, name, country_code, type')
    .eq('type', 'CLUBE_PADEL')

  if (listError) {
    return NextResponse.json({ error: listError.message }, { status: 500 })
  }

  const known = new Set(
    (existing || []).map((p) =>
      partnerKey(String(p.name || ''), String(p.country_code || ''))
    )
  )

  const missing = EUROPEAN_PADEL_CLUBS.filter(
    (club) => !known.has(partnerKey(club.name, club.country_code))
  )

  if (missing.length === 0) {
    return NextResponse.json({
      inserted: 0,
      skipped: EUROPEAN_PADEL_CLUBS.length,
      totalSeed: EUROPEAN_PADEL_CLUBS.length,
      existingClubs: existing?.length || 0,
    })
  }

  const rows = missing.map((club) => ({
    name: club.name,
    type: 'CLUBE_PADEL' as const,
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
    infrastructure: 'infrastructure' in club ? club.infrastructure || null : null,
    preferred_language: DEFAULT_LANG[club.country_code] || 'en',
    notes: 'Seed europeu — lista legado sportsevents.app/admin',
  }))

  const { data: inserted, error: insertError } = await db
    .from('partners')
    .insert(rows)
    .select('id')

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 400 })
  }

  return NextResponse.json({
    inserted: inserted?.length || 0,
    skipped: EUROPEAN_PADEL_CLUBS.length - missing.length,
    totalSeed: EUROPEAN_PADEL_CLUBS.length,
    existingClubs: (existing?.length || 0) + (inserted?.length || 0),
  })
}
