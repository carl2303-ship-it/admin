import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/admin'
import { requireSeStaff } from '@/lib/sportsevents/auth'
import {
  isValidCardSlug,
  normalizeSlug,
  sanitizeBrochures,
  type CardWritePayload,
  type DigitalCardRow,
} from '@/lib/sportsevents/cards'

async function adminDb() {
  return createClient()
}

export async function GET() {
  const auth = await requireSeStaff()
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const supabase = await adminDb()
  const { data, error } = await supabase
    .from('digital_cards')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('full_name', { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ cards: (data || []) as DigitalCardRow[] })
}

export async function POST(request: Request) {
  const auth = await requireSeStaff()
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const body = (await request.json()) as CardWritePayload
  const slug = normalizeSlug(body.slug || '')
  const full_name = String(body.full_name || '').trim()

  if (!full_name) {
    return NextResponse.json({ error: 'Nome é obrigatório.' }, { status: 400 })
  }
  if (!isValidCardSlug(slug)) {
    return NextResponse.json(
      { error: 'Slug inválido ou reservado. Usa só letras minúsculas, números e hífens.' },
      { status: 400 }
    )
  }

  const row = {
    slug,
    full_name,
    title: String(body.title || '').trim(),
    hub: body.hub?.trim() || null,
    email: body.email?.trim() || null,
    phone: body.phone?.trim() || null,
    phone_display: body.phone_display?.trim() || null,
    address_line: body.address_line?.trim() || null,
    city: body.city?.trim() || null,
    postal_code: body.postal_code?.trim() || null,
    country: body.country?.trim() || null,
    photo_url: body.photo_url?.trim() || null,
    brochures: sanitizeBrochures(body.brochures),
    active: body.active !== false,
    sort_order: Number.isFinite(body.sort_order) ? Number(body.sort_order) : 0,
    updated_at: new Date().toISOString(),
  }

  const supabase = await adminDb()
  const { data, error } = await supabase
    .from('digital_cards')
    .insert(row)
    .select('*')
    .single()

  if (error) {
    const msg =
      error.code === '23505'
        ? 'Já existe um cartão com este slug.'
        : error.message
    return NextResponse.json({ error: msg }, { status: 400 })
  }

  return NextResponse.json({ card: data as DigitalCardRow })
}
