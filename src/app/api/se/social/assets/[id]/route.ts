import { NextResponse } from 'next/server'
import { requireSeStaff } from '@/lib/sportsevents/auth'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'

type Ctx = { params: Promise<{ id: string }> }

export async function DELETE(_request: Request, ctx: Ctx) {
  const auth = await requireSeStaff()
  if (auth.error || !auth.user) {
    return NextResponse.json(
      { error: auth.error || 'Não autenticado' },
      { status: auth.status || 401 }
    )
  }

  const { id } = await ctx.params
  if (!id) {
    return NextResponse.json({ error: 'id em falta' }, { status: 400 })
  }

  const service = createServiceClient()
  const client = service || (await createClient())

  const { error } = await client.from('social_assets').delete().eq('id', id)
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}
