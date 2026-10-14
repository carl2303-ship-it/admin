import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/admin'
import { requireSeStaff } from '@/lib/sportsevents/auth'

export async function GET() {
  const auth = await requireSeStaff()
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const db = createServiceClient() || (await createClient())
  const { data, error } = await db.from('crm_outreach_scripts').select('*')
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ scripts: data || [] })
}

export async function PUT(request: Request) {
  const auth = await requireSeStaff()
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const body = await request.json()
  const rows = Array.isArray(body) ? body : [body]
  const db = createServiceClient() || (await createClient())

  const { data, error } = await db
    .from('crm_outreach_scripts')
    .upsert(rows, { onConflict: 'lang_code' })
    .select('*')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
  return NextResponse.json({ scripts: data || [] })
}
