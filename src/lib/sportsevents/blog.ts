import { createPublicClient } from '@/lib/supabase/public'
import {
  absoluteUrl,
  type BlogCategory,
  type BlogPost,
  type BlogPostListItem,
} from '@/lib/sportsevents/blog-shared'

export type {
  BlogCategory,
  BlogPost,
  BlogPostListItem,
} from '@/lib/sportsevents/blog-shared'
export {
  BLOG_CATEGORIES,
  absoluteUrl,
  formatPostDate,
  isBlogCategory,
} from '@/lib/sportsevents/blog-shared'

export async function getSiteOrigin(): Promise<string> {
  const url =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.URL ||
    'https://sportsevents.app'
  return url.replace(/\/$/, '')
}

const listSelect =
  'id, title, slug, excerpt, cover_image, category, meta_title, meta_description, published_at, author_name'

export async function listPublishedPosts(opts?: {
  category?: BlogCategory | null
  q?: string | null
  limit?: number
}): Promise<BlogPostListItem[]> {
  try {
    const supabase = createPublicClient()
    let query = supabase
      .from('posts')
      .select(listSelect)
      .not('published_at', 'is', null)
      .lte('published_at', new Date().toISOString())
      .order('published_at', { ascending: false })

    if (opts?.category) {
      query = query.eq('category', opts.category)
    }

    if (opts?.q?.trim()) {
      const term = opts.q.trim().replace(/%/g, '')
      query = query.or(
        `title.ilike.%${term}%,excerpt.ilike.%${term}%,meta_description.ilike.%${term}%`
      )
    }

    if (opts?.limit) {
      query = query.limit(opts.limit)
    }

    const { data, error } = await query
    if (error) {
      console.error('[blog] listPublishedPosts', error.message)
      return []
    }
    return (data || []) as BlogPostListItem[]
  } catch (e) {
    console.error('[blog] listPublishedPosts', e)
    return []
  }
}

export async function getPostBySlug(slug: string): Promise<BlogPost | null> {
  try {
    const supabase = createPublicClient()
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .eq('slug', slug)
      .not('published_at', 'is', null)
      .lte('published_at', new Date().toISOString())
      .maybeSingle()

    if (error) {
      console.error('[blog] getPostBySlug', error.message)
      return null
    }
    return data as BlogPost | null
  } catch (e) {
    console.error('[blog] getPostBySlug', e)
    return null
  }
}

export async function getRelatedPosts(
  post: Pick<BlogPost, 'id' | 'category'>,
  limit = 3
): Promise<BlogPostListItem[]> {
  try {
    const supabase = createPublicClient()
    const { data, error } = await supabase
      .from('posts')
      .select(listSelect)
      .eq('category', post.category)
      .neq('id', post.id)
      .not('published_at', 'is', null)
      .lte('published_at', new Date().toISOString())
      .order('published_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('[blog] getRelatedPosts', error.message)
      return []
    }
    return (data || []) as BlogPostListItem[]
  } catch (e) {
    console.error('[blog] getRelatedPosts', e)
    return []
  }
}

export async function getAllPublishedSlugs(): Promise<string[]> {
  try {
    const supabase = createPublicClient()
    const { data, error } = await supabase
      .from('posts')
      .select('slug')
      .not('published_at', 'is', null)
      .lte('published_at', new Date().toISOString())

    if (error) {
      console.error('[blog] getAllPublishedSlugs', error.message)
      return []
    }
    return (data || []).map((r) => r.slug as string)
  } catch (e) {
    console.error('[blog] getAllPublishedSlugs', e)
    return []
  }
}

export function blogPostingJsonLd(opts: {
  post: BlogPost
  origin: string
  url: string
}) {
  const { post, origin, url } = opts
  const image = post.cover_image
    ? absoluteUrl(origin, post.cover_image)
    : absoluteUrl(origin, '/brand/logo.png')

  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.meta_description || post.excerpt,
    image: [image],
    datePublished: post.published_at,
    dateModified: post.published_at,
    author: {
      '@type': 'Person',
      name: post.author_name,
    },
    publisher: {
      '@type': 'Organization',
      name: 'SportsEvents.app',
      logo: {
        '@type': 'ImageObject',
        url: absoluteUrl(origin, '/brand/logo.png'),
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': url,
    },
    articleSection: post.category,
    inLanguage: 'en',
  }
}
