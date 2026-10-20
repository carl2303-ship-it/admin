import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/admin'
import { requireSeStaff } from '@/lib/sportsevents/auth'
import { EUROPEAN_PADEL_CLUBS } from '@/lib/sportsevents/european-padel-clubs'
import { ensureEuropeanPadelClubs } from '@/lib/sportsevents/ensure-european-clubs'

/** Diagnóstico: contagens sem inserir. */
export async function GET() {
  const auth = await requireSeStaff()
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const db = createServiceClient()
  if (!db) {
    return NextResponse.json(
      {
        error: 'SUPABASE_SERVICE_ROLE_KEY em falta',
        serviceRole: false,
        totalSeed: EUROPEAN_PADEL_CLUBS.length,
        clubesPadel: null,
      },
      { status: 503 }
    )
  }

  const { count, error } = await db
    .from('partners')
    .select('id', { count: 'exact', head: true })
    .eq('type', 'CLUBE_PADEL')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    serviceRole: true,
    totalSeed: EUROPEAN_PADEL_CLUBS.length,
    clubesPadel: count ?? 0,
    missing: Math.max(0, EUROPEAN_PADEL_CLUBS.length - (count ?? 0)),
    ok: (count ?? 0) >= EUROPEAN_PADEL_CLUBS.length,
  })
}

/** Idempotente: garante os 37 clubes europeus do legado em `partners`. */
export async function POST() {
  const auth = await requireSeStaff()
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const result = await ensureEuropeanPadelClubs()
  const status = !result.serviceRole
    ? 503
    : result.errors.length && result.inserted === 0
      ? 400
      : 200

  return NextResponse.json(result, { status })
}
