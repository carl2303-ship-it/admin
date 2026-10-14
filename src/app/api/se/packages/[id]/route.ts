import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/admin'
import { requireSeStaff } from '@/lib/sportsevents/auth'
import {
  rowToView,
  sanitizePackagePayload,
} from '@/lib/sportsevents/hub-packages-admin'
import type { HubPackageRow } from '@/lib/sportsevents/hub-packages'

type Ctx = { params: Promise<{ id: string }> }

export async function PUT(request: Request, context: Ctx) {
  const auth = await requireSeStaff()
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const { id } = await context.params
  const body = await request.json()
  const payload = sanitizePackagePayload(body)
  if ('error' in payload) {
    return NextResponse.json({ error: payload.error }, { status: 400 })
  }

  const supabase = createServiceClient() || (await createClient())
  const { data, error } = await supabase
    .from('hub_packages')
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('*, destinations(id, code, name)')
    .single()

  if (error) {
    const msg =
      error.code === '23505'
        ? 'Já existe este pacote neste destino.'
        : error.message
    return NextResponse.json({ error: msg }, { status: 400 })
  }

  return NextResponse.json({ package: rowToView(data as HubPackageRow) })
}

export async function DELETE(_request: Request, context: Ctx) {
  const auth = await requireSeStaff()
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const { id } = await context.params
  const supabase = createServiceClient() || (await createClient())
  const { error } = await supabase.from('hub_packages').delete().eq('id', id)
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}
