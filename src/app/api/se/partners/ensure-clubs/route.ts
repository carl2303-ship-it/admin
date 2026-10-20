import { NextResponse } from 'next/server'
import { requireSeStaff } from '@/lib/sportsevents/auth'
import { getPartnersDbCounts } from '@/lib/sportsevents/partners-counts'

/**
 * Diagnóstico: contagens reais na DB SE.
 * O seed inventado de ~37 clubes foi desactivado — os clubes já existem em partners.
 */
export async function GET() {
  const auth = await requireSeStaff()
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const counts = await getPartnersDbCounts()
  if (!counts.ok) {
    return NextResponse.json(counts, {
      status: counts.serviceRole ? 500 : 503,
    })
  }

  return NextResponse.json({
    ok: true,
    serviceRole: counts.serviceRole,
    total: counts.total,
    clubesPadel: counts.clubesPadel,
    byType: counts.byType,
    seedDisabled: true,
  })
}

/** Seed desactivado — devolve só contagens (não insere). */
export async function POST() {
  const auth = await requireSeStaff()
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const counts = await getPartnersDbCounts()
  return NextResponse.json(
    {
      ...counts,
      inserted: 0,
      skipped: 0,
      seedDisabled: true,
      message:
        'Seed inventado desactivado. Os clubes já estão em public.partners — usa GET /api/se/data.',
    },
    { status: 200 }
  )
}
