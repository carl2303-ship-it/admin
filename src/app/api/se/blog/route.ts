import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/admin'
import { requireSeStaff } from '@/lib/sportsevents/auth'
import { BLOG_CATEGORIES, isBlogCategory } from '@/lib/sportsevents/blog-shared'
import { ensureBlogHtml } from '@/lib/sportsevents/blog-html'

function slugify(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120)
}

function sanitizeBody(body: Record<string, unknown>) {
  const title = String(body.title || '').trim()
  if (!title) return { error: 'Título é obrigatório.' }

  let slug = String(body.slug || '').trim() || slugify(title)
  slug = slugify(slug)
  if (!slug) return { error: 'Slug inválido.' }

  const category = String(body.category || 'Guides')
  if (!isBlogCategory(category)) {
    return { error: `Categoria inválida. Use: ${BLOG_CATEGORIES.join(', ')}` }
  }

  const published = body.published === true || body.published === 'true'
  let published_at: string | null = null
  if (published) {
    const raw = body.published_at ? String(body.published_at) : ''
    published_at = raw
      ? new Date(raw).toISOString()
      : new Date().toISOString()
  }

  return {
    title,
    slug,
    excerpt: String(body.excerpt || '').trim(),
    content: ensureBlogHtml(String(body.content || '').trim()),
    cover_image: String(body.cover_image || '').trim() || null,
    category,
    meta_title: String(body.meta_title || '').trim() || null,
    meta_description: String(body.meta_description || '').trim() || null,
    author_name: String(body.author_name || 'SportsEvents Team').trim(),
    published_at,
    updated_at: new Date().toISOString(),
  }
}

export async function GET() {
  const auth = await requireSeStaff()
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const supabase = createServiceClient() || (await createClient())
  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .order('updated_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    posts: data || [],
    categories: BLOG_CATEGORIES,
  })
}

export async function POST(request: Request) {
  const auth = await requireSeStaff()
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const body = await request.json()
  const payload = sanitizeBody(body)
  if ('error' in payload) {
    return NextResponse.json({ error: payload.error }, { status: 400 })
  }

  const supabase = createServiceClient() || (await createClient())
  const { data, error } = await supabase
    .from('posts')
    .insert(payload)
    .select('*')
    .single()

  if (error) {
    const msg =
      error.code === '23505' ? 'Já existe um post com este slug.' : error.message
    return NextResponse.json({ error: msg }, { status: 400 })
  }

  return NextResponse.json({ post: data })
}
