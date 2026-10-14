import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/admin'
import { requireSeStaff } from '@/lib/sportsevents/auth'

/** Regista o utilizador autenticado atual como primeiro ADMIN (bootstrap). */
export async function POST(request: Request) {
  const auth = await requireSeStaff()
  if (auth.error || !auth.user) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const service = createServiceClient()
  if (!service) {
    return NextResponse.json(
      {
        error:
          'SUPABASE_SERVICE_ROLE_KEY em falta. Adiciona-a ao .env.local / Netlify.',
      },
      { status: 503 }
    )
  }

  const { count } = await service
    .from('staff_members')
    .select('id', { count: 'exact', head: true })

  if ((count || 0) > 0) {
    return NextResponse.json(
      { error: 'Já existe staff. Bootstrap indisponível.' },
      { status: 409 }
    )
  }

  const body = await request.json().catch(() => ({}))
  const fullName =
    String(body.fullName || '').trim() ||
    auth.user.user_metadata?.full_name ||
    auth.user.email?.split('@')[0] ||
    'Administrador'

  const email = auth.user.email
  if (!email) {
    return NextResponse.json(
      { error: 'Conta sem email.' },
      { status: 400 }
    )
  }

  const { data, error } = await service
    .from('staff_members')
    .insert({
      user_id: auth.user.id,
      email: email.toLowerCase(),
      full_name: fullName,
      role: 'ADMIN',
      hub: 'ALL',
      active: true,
    })
    .select('*')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  await service.auth.admin.updateUserById(auth.user.id, {
    app_metadata: { role: 'ADMIN', staff: true },
  })

  return NextResponse.json({ staff: data })
}
