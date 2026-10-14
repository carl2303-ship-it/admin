import { NextResponse } from 'next/server'
import { requireSeStaff } from '@/lib/sportsevents/auth'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/admin'
import {
  publishToFacebook,
  publishToInstagram,
  publicShareUrl,
} from '@/lib/sportsevents/content-automation/meta-publish'
import {
  buildSloganCaption,
  isSocialHub,
  type SocialHub,
} from '@/lib/sportsevents/content-automation/social-hubs'
import { INSTAGRAM_CAPTION_MAX } from '@/lib/sportsevents/content-automation/social-caption'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function GET() {
  const auth = await requireSeStaff()
  if (auth.error || !auth.user) {
    return NextResponse.json(
      { error: auth.error || 'Não autenticado' },
      { status: auth.status || 401 }
    )
  }

  const service = createServiceClient()
  const client = service || (await createClient())

  const { data, error } = await client
    .from('social_posts')
    .select(
      'id, slogan, caption, hub, image_url, asset_id, instagram_published, facebook_published, instagram_media_id, facebook_post_id, errors, created_at'
    )
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ posts: data || [] })
}

/**
 * Cria post só-redes (sem blog) e publica IG/FB.
 * Body: { slogan, hub?, image_url, asset_id?, extra?, platforms?: ['instagram','facebook'] }
 */
export async function POST(request: Request) {
  const auth = await requireSeStaff()
  if (auth.error || !auth.user) {
    return NextResponse.json(
      { error: auth.error || 'Não autenticado' },
      { status: auth.status || 401 }
    )
  }

  let body: {
    slogan?: string
    extra?: string
    hub?: string
    image_url?: string
    asset_id?: string
    platforms?: Array<'instagram' | 'facebook'>
  }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'JSON inválido.' }, { status: 400 })
  }

  const slogan = String(body.slogan || '').trim()
  let imageUrl = String(body.image_url || '').trim()
  const hub: SocialHub =
    body.hub && isSocialHub(body.hub) ? body.hub : 'General'

  if (!slogan) {
    return NextResponse.json({ error: 'Slogan obrigatório.' }, { status: 400 })
  }

  const service = createServiceClient()
  const client = service || (await createClient())

  if (!imageUrl && body.asset_id) {
    const { data: asset } = await client
      .from('social_assets')
      .select('image_url')
      .eq('id', body.asset_id)
      .maybeSingle()
    imageUrl = String(asset?.image_url || '').trim()
  }

  if (!imageUrl || !/^https:\/\//i.test(imageUrl)) {
    return NextResponse.json(
      { error: 'Imagem HTTPS obrigatória (upload ou biblioteca).' },
      { status: 400 }
    )
  }

  imageUrl = publicShareUrl(imageUrl)

  const wantIg =
    !body.platforms?.length || body.platforms.includes('instagram')
  const wantFb =
    !body.platforms?.length || body.platforms.includes('facebook')

  const missing: string[] = []
  if (!process.env.META_PAGE_ACCESS_TOKEN?.trim()) {
    missing.push('META_PAGE_ACCESS_TOKEN')
  }
  if (wantFb && !process.env.META_PAGE_ID?.trim()) missing.push('META_PAGE_ID')
  if (wantIg && !process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID?.trim()) {
    missing.push('INSTAGRAM_BUSINESS_ACCOUNT_ID')
  }
  if (missing.length) {
    return NextResponse.json(
      {
        error: `Faltam env Meta: ${missing.join(', ')}`,
        missing,
      },
      { status: 503 }
    )
  }

  const caption = buildSloganCaption({
    slogan,
    hub,
    extra: body.extra,
    maxLength: INSTAGRAM_CAPTION_MAX,
  })

  let instagram_published = false
  let facebook_published = false
  let instagram_media_id: string | null = null
  let facebook_post_id: string | null = null
  const errors: Record<string, string> = {}

  if (wantIg) {
    try {
      const ig = await publishToInstagram({ imageUrl, caption })
      instagram_published = true
      instagram_media_id = ig.mediaId
    } catch (e) {
      errors.instagram =
        e instanceof Error ? e.message : 'Erro Instagram desconhecido'
    }
  }

  if (wantFb) {
    try {
      const fb = await publishToFacebook({
        message: caption,
        link: 'https://sportsevents.app',
        imageUrl,
      })
      facebook_published = true
      facebook_post_id = fb.postId
    } catch (e) {
      errors.facebook =
        e instanceof Error ? e.message : 'Erro Facebook desconhecido'
    }
  }

  const { data: saved, error: saveError } = await client
    .from('social_posts')
    .insert({
      slogan,
      caption,
      hub,
      image_url: imageUrl,
      asset_id: body.asset_id || null,
      instagram_published,
      facebook_published,
      instagram_media_id,
      facebook_post_id,
      errors: Object.keys(errors).length ? errors : null,
      created_by: auth.user.id,
    })
    .select(
      'id, slogan, caption, hub, image_url, asset_id, instagram_published, facebook_published, instagram_media_id, facebook_post_id, errors, created_at'
    )
    .single()

  if (saveError) {
    return NextResponse.json(
      {
        error: saveError.message,
        instagram_published,
        facebook_published,
        errors,
      },
      { status: 500 }
    )
  }

  const ok = instagram_published || facebook_published
  return NextResponse.json(
    {
      success: ok,
      post: saved,
      instagram_published,
      facebook_published,
      errors,
    },
    { status: ok ? 200 : 502 }
  )
}
