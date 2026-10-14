import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/admin'
import { requireSeAdmin, type StaffRole } from '@/lib/sportsevents/auth'

export async function GET() {
  const auth = await requireSeAdmin()
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const service = createServiceClient()
  const client = service
  if (!client) {
    // Fallback: authenticated client can read staff via RLS
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = createServiceClient() || (await createClient())
    const { data, error } = await supabase
      .from('staff_members')
      .select('*')
      .order('created_at', { ascending: true })
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({
      staff: data || [],
      serviceRoleConfigured: false,
      isBootstrap: auth.isBootstrap,
    })
  }

  const { data, error } = await client
    .from('staff_members')
    .select('*')
    .order('created_at', { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    staff: data || [],
    serviceRoleConfigured: true,
    isBootstrap: auth.isBootstrap,
  })
}

export async function POST(request: Request) {
  const auth = await requireSeAdmin()
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const service = createServiceClient()
  if (!service) {
    return NextResponse.json(
      {
        error:
          'SUPABASE_SERVICE_ROLE_KEY em falta no servidor. Sem ela não é possível criar logins Auth.',
      },
      { status: 503 }
    )
  }

  const body = await request.json()
  const fullName = String(body.fullName || '').trim()
  const email = String(body.email || '').trim().toLowerCase()
  const password = String(body.password || '')
  const role = (body.role || 'STAFF') as StaffRole
  const hub = body.hub || 'ALL'
  const phone = body.phone ? String(body.phone).trim() : null

  if (!fullName || !email || !password) {
    return NextResponse.json(
      { error: 'Nome, email e password são obrigatórios.' },
      { status: 400 }
    )
  }
  if (password.length < 8) {
    return NextResponse.json(
      { error: 'Password com mínimo de 8 caracteres.' },
      { status: 400 }
    )
  }
  if (!['ADMIN', 'STAFF', 'OPERACOES', 'COMERCIAL'].includes(role)) {
    return NextResponse.json({ error: 'Role inválida.' }, { status: 400 })
  }

  const { data: created, error: createError } =
    await service.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName },
      app_metadata: { role, staff: true },
    })

  if (createError || !created.user) {
    return NextResponse.json(
      { error: createError?.message || 'Erro ao criar utilizador Auth.' },
      { status: 400 }
    )
  }

  const { data: member, error: insertError } = await service
    .from('staff_members')
    .insert({
      user_id: created.user.id,
      email,
      full_name: fullName,
      role,
      hub: hub === 'ALL' ? 'ALL' : hub,
      phone,
      active: true,
    })
    .select('*')
    .single()

  if (insertError) {
    // rollback auth user if profile insert fails
    await service.auth.admin.deleteUser(created.user.id)
    return NextResponse.json({ error: insertError.message }, { status: 500 })
  }

  return NextResponse.json({ staff: member })
}

export async function PATCH(request: Request) {
  const auth = await requireSeAdmin()
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const service = createServiceClient()
  const { createClient } = await import('@/lib/supabase/server')
  const client = service || (await createClient())

  const body = await request.json()
  const id = body.id as string
  if (!id) {
    return NextResponse.json({ error: 'id em falta' }, { status: 400 })
  }

  const patch: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  }
  if (typeof body.active === 'boolean') patch.active = body.active
  if (body.role) patch.role = body.role
  if (body.hub !== undefined) patch.hub = body.hub
  if (body.fullName) patch.full_name = String(body.fullName).trim()
  if (body.phone !== undefined) patch.phone = body.phone || null

  const { data, error } = await client
    .from('staff_members')
    .update(patch)
    .eq('id', id)
    .select('*')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (service && data?.user_id && body.role) {
    await service.auth.admin.updateUserById(data.user_id, {
      app_metadata: { role: body.role, staff: true },
    })
  }

  return NextResponse.json({ staff: data })
}
