/** Limite Instagram (caracteres, não palavras). */
export const INSTAGRAM_CAPTION_MAX = 2200
/** Limite prático para caption/foto Facebook. */
export const FACEBOOK_CAPTION_MAX = 5000

const DEFAULT_HASHTAGS =
  '#padel #Sportsevents #padelcamp #padeltraining #padeltrip #Algarve #Marbella #Barcelona #padellife #clubcoach'

/** HTML ou Markdown leve → texto plano para redes. */
export function htmlOrMarkdownToPlain(input: string): string {
  let s = String(input || '')
  s = s.replace(/<script[\s\S]*?<\/script>/gi, ' ')
  s = s.replace(/<style[\s\S]*?<\/style>/gi, ' ')
  s = s.replace(/<\/(p|div|h[1-6]|li|tr|blockquote|br)\s*>/gi, '\n')
  s = s.replace(/<br\s*\/?>/gi, '\n')
  s = s.replace(/<\/?(ul|ol|table|thead|tbody|tr)>/gi, '\n')
  s = s.replace(/<li[^>]*>/gi, '• ')
  s = s.replace(/<h[1-6][^>]*>/gi, '')
  s = s.replace(/<a[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi, '$2')
  s = s.replace(/<[^>]+>/g, '')
  s = s
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
  // Markdown
  s = s.replace(/^#{1,6}\s+/gm, '')
  s = s.replace(/\*\*([^*]+)\*\*/g, '$1')
  s = s.replace(/\*([^*]+)\*/g, '$1')
  s = s.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
  s = s.replace(/^\s*[-*+]\s+/gm, '• ')
  s = s.replace(/^\s*\d+\.\s+/gm, '• ')
  s = s.replace(/\r\n/g, '\n')
  s = s.replace(/[ \t]+\n/g, '\n')
  s = s.replace(/\n{3,}/g, '\n\n')
  return s.trim()
}

function truncateAtWord(text: string, max: number): string {
  const t = text.trim()
  if (t.length <= max) return t
  const slice = t.slice(0, Math.max(0, max - 1))
  const cut = Math.max(slice.lastIndexOf('\n'), slice.lastIndexOf(' '))
  const base = (cut > max * 0.5 ? slice.slice(0, cut) : slice).trimEnd()
  return `${base}…`
}

export type SocialCaptionInput = {
  title: string
  excerpt?: string | null
  content?: string | null
  meta_description?: string | null
  blogUrl: string
  /** Caption pré-feita (IA); se for curta, completa-se com o artigo. */
  preferredCaption?: string | null
  hashtags?: string
  maxLength?: number
}

/**
 * Monta caption longa a partir do artigo (até maxLength, default IG 2200).
 * Estrutura: título → lead → corpo do artigo → link → hashtags.
 */
export function buildSocialCaption(opts: SocialCaptionInput): string {
  const max = opts.maxLength ?? INSTAGRAM_CAPTION_MAX
  const hashtags = (opts.hashtags || DEFAULT_HASHTAGS).trim()
  const shareLine = `Read more: ${opts.blogUrl}`
  const footer = `\n\n${shareLine}\n\n${hashtags}`
  const footerLen = footer.length
  const bodyBudget = Math.max(200, max - footerLen)

  const title = String(opts.title || '').trim()
  const lead = String(
    opts.excerpt || opts.meta_description || ''
  ).trim()
  const articlePlain = htmlOrMarkdownToPlain(opts.content || '')

  const preferred = String(opts.preferredCaption || '').trim()
  // Se a IA já deu uma caption substancial (≥ 600 chars), usa-a (com footer se faltar link)
  if (preferred.length >= 600) {
    let cap = preferred
    if (!cap.includes(opts.blogUrl) && !/Read more:/i.test(cap)) {
      const room = max - footerLen - 2
      cap = `${truncateAtWord(cap, room)}${footer}`
    } else {
      cap = truncateAtWord(cap, max)
    }
    return cap.slice(0, max)
  }

  const parts: string[] = []
  if (title) parts.push(title)
  if (lead && lead !== title) parts.push(lead)

  let head = parts.join('\n\n').trim()
  let remaining = bodyBudget - head.length - (head ? 2 : 0)

  if (articlePlain && remaining > 120) {
    // Evita repetir o excerpt no início do corpo
    let body = articlePlain
    if (lead && body.startsWith(lead)) {
      body = body.slice(lead.length).trim()
    }
    if (title && body.startsWith(title)) {
      body = body.slice(title.length).trim()
    }
    body = truncateAtWord(body, remaining)
    if (body) {
      head = head ? `${head}\n\n${body}` : body
    }
  } else if (preferred && preferred.length > 0) {
    // Caption curta da IA: usa como corpo extra
    const room = bodyBudget - head.length - 2
    if (room > 40) {
      const extra = truncateAtWord(preferred, room)
      if (extra && !head.includes(extra.slice(0, 40))) {
        head = head ? `${head}\n\n${extra}` : extra
      }
    }
  }

  if (!head) head = title || 'SportsEvents.app'

  head = truncateAtWord(head, bodyBudget)
  const full = `${head}${footer}`
  return full.slice(0, max)
}
