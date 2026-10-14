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

type Ctx = { params: Promise<{ id: string }> }

export async function PUT(request: Request, context: Ctx) {
  const auth = await requireSeStaff()
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const { id } = await context.params
  const body = (await request.json()) as CardWritePayload
  const slug = normalizeSlug(body.slug || '')
  const full_name = String(body.full_name || '').trim()

  if (!full_name) {
    return NextResponse.json({ error: 'Nome é obrigatório.' }, { status: 400 })
  }
  if (!isValidCardSlug(slug)) {
    return NextResponse.json(
      { error: 'Slug inválido ou reservado.' },
      { status: 400 }
    )
  }

  const patch = {
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

  const supabase = createServiceClient() || (await createClient())
  const { data, error } = await supabase
    .from('digital_cards')
    .update(patch)
    .eq('id', id)
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

export async function DELETE(_request: Request, context: Ctx) {
  const auth = await requireSeStaff()
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const { id } = await context.params
  const supabase = createServiceClient() || (await createClient())
  const { error } = await supabase.from('digital_cards').delete().eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
