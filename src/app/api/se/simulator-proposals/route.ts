import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/admin'
import { requireSeStaff } from '@/lib/sportsevents/auth'

export async function POST(request: Request) {
  const auth = await requireSeStaff()
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const body = await request.json()
  const db = createServiceClient() || (await createClient())
  const { data, error } = await db
    .from('simulator_proposals')
    .insert({
      ...body,
      created_at: new Date().toISOString(),
    })
    .select('*')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
  return NextResponse.json({ proposal: data })
}
