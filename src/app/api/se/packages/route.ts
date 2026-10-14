import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/admin'
import { requireSeStaff } from '@/lib/sportsevents/auth'
import {
  rowToView,
  sanitizePackagePayload,
} from '@/lib/sportsevents/hub-packages-admin'
import type { HubPackageRow } from '@/lib/sportsevents/hub-packages'

export async function GET() {
  const auth = await requireSeStaff()
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const supabase = createServiceClient() || (await createClient())
  const [
    { data: packages, error },
    { data: destinations },
    { data: partners },
  ] = await Promise.all([
    supabase
      .from('hub_packages')
      .select('*, destinations(id, code, name)')
      .order('sort_order', { ascending: true }),
    supabase
      .from('destinations')
      .select('id, code, name')
      .in('code', ['ALG', 'BCN', 'MAR'])
      .order('name'),
    supabase
      .from('partners')
      .select('id, name, type, stripe_account_id, stripe_connect_status')
      .in('type', ['HOTEL', 'TRANSPORTES'])
      .order('name'),
  ])

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    packages: ((packages || []) as HubPackageRow[]).map((row) =>
      rowToView(row, 'pt')
    ),
    destinations: destinations || [],
    connectPartners: partners || [],
  })
}

export async function POST(request: Request) {
  const auth = await requireSeStaff()
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const body = await request.json()
  const payload = sanitizePackagePayload(body)
  if ('error' in payload) {
    return NextResponse.json({ error: payload.error }, { status: 400 })
  }

  const supabase = createServiceClient() || (await createClient())
  const { data, error } = await supabase
    .from('hub_packages')
    .insert({ ...payload, updated_at: new Date().toISOString() })
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
