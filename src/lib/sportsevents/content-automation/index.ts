export type {
  ContentDestination,
  GenerateAndPublishInput,
  GenerateAndPublishResult,
  GeneratedArticle,
  MetaPublishResult,
} from '@/lib/sportsevents/content-automation/types'
export { CONTENT_DESTINATIONS, isContentDestination } from '@/lib/sportsevents/content-automation/types'
export { generateArticleContent } from '@/lib/sportsevents/content-automation/generate'
export { saveGeneratedPost } from '@/lib/sportsevents/content-automation/save-post'
export {
  publishSocialBundle,
  publishToFacebook,
  publishToInstagram,
  publicShareUrl,
} from '@/lib/sportsevents/content-automation/meta-publish'
export { coverImageForDestination, siteOrigin } from '@/lib/sportsevents/content-automation/covers'
export {
  FACEBOOK_CAPTION_MAX,
  INSTAGRAM_CAPTION_MAX,
  buildSocialCaption,
  htmlOrMarkdownToPlain,
} from '@/lib/sportsevents/content-automation/social-caption'
export {
  SOCIAL_HUBS,
  buildSloganCaption,
  isSocialHub,
  type SocialHub,
} from '@/lib/sportsevents/content-automation/social-hubs'
