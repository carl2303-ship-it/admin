import { NextResponse } from 'next/server'
import { requireSeStaff } from '@/lib/sportsevents/auth'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/admin'
import { isSocialHub, type SocialHub } from '@/lib/sportsevents/content-automation/social-hubs'

export const runtime = 'nodejs'

export async function GET(request: Request) {
  const auth = await requireSeStaff()
  if (auth.error || !auth.user) {
    return NextResponse.json(
      { error: auth.error || 'Não autenticado' },
      { status: auth.status || 401 }
    )
  }

  const hub = new URL(request.url).searchParams.get('hub')
  const service = createServiceClient()
  const client = service || (await createClient())

  let query = client
    .from('social_assets')
    .select('id, hub, title, image_url, storage_path, created_at')
    .order('created_at', { ascending: false })
    .limit(200)

  if (hub && isSocialHub(hub)) {
    query = query.eq('hub', hub)
  }

  const { data, error } = await query
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ assets: data || [] })
}

export async function POST(request: Request) {
  const auth = await requireSeStaff()
  if (auth.error || !auth.user) {
    return NextResponse.json(
      { error: auth.error || 'Não autenticado' },
      { status: auth.status || 401 }
    )
  }

  let body: {
    hub?: string
    title?: string
    image_url?: string
    storage_path?: string
  }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'JSON inválido.' }, { status: 400 })
  }

  const imageUrl = String(body.image_url || '').trim()
  if (!imageUrl || !/^https?:\/\//i.test(imageUrl)) {
    return NextResponse.json(
      { error: 'image_url HTTPS obrigatório.' },
      { status: 400 }
    )
  }

  const hub: SocialHub =
    body.hub && isSocialHub(body.hub) ? body.hub : 'General'

  const service = createServiceClient()
  const client = service || (await createClient())

  const { data, error } = await client
    .from('social_assets')
    .insert({
      hub,
      title: String(body.title || '').trim(),
      image_url: imageUrl,
      storage_path: body.storage_path || null,
      created_by: auth.user.id,
    })
    .select('id, hub, title, image_url, storage_path, created_at')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ asset: data }, { status: 201 })
}
