export const CONTENT_DESTINATIONS = ['Marbella', 'Algarve', 'Barcelona'] as const

export type ContentDestination = (typeof CONTENT_DESTINATIONS)[number]

export type GenerateAndPublishInput = {
  topic: string
  target_destination: ContentDestination
  auto_publish_social?: boolean
}

export type GeneratedArticle = {
  title: string
  slug: string
  excerpt: string
  content: string
  meta_title: string
  meta_description: string
  social_caption: string
  category?: string
}

export type MetaPublishResult = {
  instagram_published: boolean
  facebook_published: boolean
  instagram_media_id?: string | null
  facebook_post_id?: string | null
  instagram_error?: string | null
  facebook_error?: string | null
}

export type GenerateAndPublishResult = {
  success: boolean
  blog_post_id?: string
  blog_post_url?: string
  slug?: string
  instagram_published: boolean
  facebook_published: boolean
  social_caption?: string
  errors?: {
    generation?: string
    blog?: string
    instagram?: string
    facebook?: string
  }
}

export function isContentDestination(
  value: string
): value is ContentDestination {
  return (CONTENT_DESTINATIONS as readonly string[]).includes(value)
}
