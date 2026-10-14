import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/admin'
import { ensureBlogHtml } from '@/lib/sportsevents/blog-html'
import {
  isBlogCategory,
  type BlogCategory,
} from '@/lib/sportsevents/blog-shared'
import { coverImageForDestination } from '@/lib/sportsevents/content-automation/covers'
import type {
  ContentDestination,
  GeneratedArticle,
} from '@/lib/sportsevents/content-automation/types'

export type SavedPost = {
  id: string
  slug: string
  title: string
  cover_image: string | null
  published_at: string | null
}

async function uniqueSlug(
  client: Awaited<ReturnType<typeof createClient>>,
  base: string
): Promise<string> {
  let slug = base
  for (let i = 0; i < 8; i++) {
    const { data } = await client
      .from('posts')
      .select('id')
      .eq('slug', slug)
      .maybeSingle()
    if (!data) return slug
    slug = `${base}-${i + 2}`
  }
  return `${base}-${Date.now().toString(36)}`
}

function resolveCategory(article: GeneratedArticle): BlogCategory {
  if (article.category && isBlogCategory(article.category)) {
    return article.category
  }
  return 'Destinations'
}

export async function saveGeneratedPost(opts: {
  article: GeneratedArticle
  destination: ContentDestination
  coverImageUrl?: string | null
}): Promise<SavedPost> {
  const service = createServiceClient()
  const client = service || (await createClient())

  const slug = await uniqueSlug(client, opts.article.slug)
  const now = new Date().toISOString()
  const cover =
    opts.coverImageUrl || coverImageForDestination(opts.destination)

  const payload = {
    title: opts.article.title,
    slug,
    excerpt: opts.article.excerpt,
    content: ensureBlogHtml(opts.article.content),
    cover_image: cover,
    category: resolveCategory(opts.article),
    meta_title: opts.article.meta_title,
    meta_description: opts.article.meta_description,
    author_name: 'SportsEvents Team',
    published_at: now,
    updated_at: now,
  }

  const { data, error } = await client
    .from('posts')
    .insert(payload)
    .select('id, slug, title, cover_image, published_at')
    .single()

  if (error || !data) {
    throw new Error(error?.message || 'Falha ao inserir post no Supabase.')
  }

  return data as SavedPost
}
