import { NextResponse } from 'next/server'
import { requireSeStaff } from '@/lib/sportsevents/auth'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/admin'
import {
  publishToFacebook,
  publishToInstagram,
  publicShareUrl,
} from '@/lib/sportsevents/content-automation/meta-publish'
import { siteOrigin } from '@/lib/sportsevents/content-automation/covers'
import {
  FACEBOOK_CAPTION_MAX,
  INSTAGRAM_CAPTION_MAX,
  buildSocialCaption,
} from '@/lib/sportsevents/content-automation/social-caption'

export const runtime = 'nodejs'
export const maxDuration = 60

/**
 * Republica um post existente no Instagram e/ou Facebook.
 * Body: { "slug": "…", "platforms"?: ["instagram","facebook"] }
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
    slug?: string
    post_id?: string
    caption?: string
    platforms?: Array<'instagram' | 'facebook'>
  }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'JSON inválido.' }, { status: 400 })
  }

  const service = createServiceClient()
  const client = service || (await createClient())

  let query = client
    .from('posts')
    .select('id, slug, title, excerpt, content, cover_image, meta_description')
  if (body.post_id) query = query.eq('id', body.post_id)
  else if (body.slug) query = query.eq('slug', String(body.slug).trim())
  else {
    return NextResponse.json(
      { error: 'Indica slug ou post_id.' },
      { status: 400 }
    )
  }

  const { data: post, error } = await query.maybeSingle()
  if (error || !post) {
    return NextResponse.json(
      { error: error?.message || 'Post não encontrado.' },
      { status: 404 }
    )
  }

  const wantIg =
    !body.platforms?.length || body.platforms.includes('instagram')
  const wantFb =
    !body.platforms?.length || body.platforms.includes('facebook')

  const origin = siteOrigin()
  const blogUrl = `${origin}/blog/${post.slug}`
  const shareUrl = publicShareUrl(blogUrl)
  let imageUrl =
    post.cover_image || `${origin}/brand/logo.png`
  imageUrl = publicShareUrl(imageUrl)
  if (!/^https:\/\//i.test(imageUrl)) {
    imageUrl = `https://sportsevents.app/brand/logo.png`
  }

  const captionBase = {
    title: post.title,
    excerpt: post.excerpt,
    content: post.content,
    meta_description: post.meta_description,
    blogUrl: shareUrl,
    preferredCaption: body.caption,
  }
  const igCaption = buildSocialCaption({
    ...captionBase,
    maxLength: INSTAGRAM_CAPTION_MAX,
  })
  const fbCaption = buildSocialCaption({
    ...captionBase,
    maxLength: FACEBOOK_CAPTION_MAX,
  })

  const missing: string[] = []
  if (!process.env.META_PAGE_ACCESS_TOKEN?.trim()) {
    missing.push('META_PAGE_ACCESS_TOKEN')
  }
  if (wantFb && !process.env.META_PAGE_ID?.trim()) missing.push('META_PAGE_ID')
  if (wantIg && !process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID?.trim()) {
    missing.push('INSTAGRAM_BUSINESS_ACCOUNT_ID')
  }

  if (missing.length) {
    const where =
      process.env.NODE_ENV === 'development'
        ? 'no ficheiro .env.local (reinicia o next dev depois)'
        : 'no Netlify → Environment variables (depois redeploy)'
    return NextResponse.json(
      {
        success: false,
        blog_post_url: shareUrl,
        instagram_published: false,
        facebook_published: false,
        errors: {
          config: `Faltam variáveis Meta ${where}: ${missing.join(', ')}`,
        },
      },
      { status: 503 }
    )
  }

  let instagram_published = false
  let facebook_published = false
  let instagram_media_id: string | null = null
  let facebook_post_id: string | null = null
  let instagram_error: string | null = null
  let facebook_error: string | null = null

  if (wantIg) {
    try {
      const ig = await publishToInstagram({ imageUrl, caption: igCaption })
      instagram_published = true
      instagram_media_id = ig.mediaId
    } catch (e) {
      instagram_error =
        e instanceof Error ? e.message : 'Erro Instagram desconhecido'
    }
  }

  if (wantFb) {
    try {
      const fb = await publishToFacebook({
        message: fbCaption,
        link: shareUrl,
        imageUrl,
      })
      facebook_published = true
      facebook_post_id = fb.postId
    } catch (e) {
      facebook_error =
        e instanceof Error ? e.message : 'Erro Facebook desconhecido'
    }
  }

  const ok = instagram_published || facebook_published
  const bothOk =
    (!wantIg || instagram_published) && (!wantFb || facebook_published)

  return NextResponse.json(
    {
      success: ok,
      blog_post_url: shareUrl,
      slug: post.slug,
      image_url: imageUrl,
      instagram_published,
      facebook_published,
      instagram_media_id,
      facebook_post_id,
      errors: {
        instagram: instagram_error,
        facebook: facebook_error,
      },
    },
    { status: ok ? (bothOk ? 200 : 207) : 502 }
  )
}
