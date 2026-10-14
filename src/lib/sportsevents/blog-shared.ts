export const BLOG_CATEGORIES = [
  'Destinations',
  'Guides',
  'Coaching',
  'Case Studies',
] as const

export type BlogCategory = (typeof BLOG_CATEGORIES)[number]

export type BlogPost = {
  id: string
  title: string
  slug: string
  excerpt: string
  content: string
  cover_image: string | null
  category: BlogCategory
  meta_title: string | null
  meta_description: string | null
  published_at: string
  author_name: string
}

export type BlogPostListItem = Omit<BlogPost, 'content'>

export function isBlogCategory(
  value: string | null | undefined
): value is BlogCategory {
  return BLOG_CATEGORIES.includes(value as BlogCategory)
}

export function formatPostDate(iso: string, locale = 'en-GB'): string {
  try {
    return new Intl.DateTimeFormat(locale, {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(new Date(iso))
  } catch {
    return iso.slice(0, 10)
  }
}

export function absoluteUrl(origin: string, path: string): string {
  if (path.startsWith('http')) return path
  return `${origin}${path.startsWith('/') ? path : `/${path}`}`
}
