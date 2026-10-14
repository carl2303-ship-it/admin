import OpenAI from 'openai'
import type {
  ContentDestination,
  GeneratedArticle,
} from '@/lib/sportsevents/content-automation/types'

const SYSTEM_PROMPT = `You are the editorial voice of SportsEvents.app — Iberian padel training camps for clubs and academies (Algarve, Marbella, Barcelona).

Brand tone: confident, direct, premium B2B. Use rhythmic triads when natural (e.g. "Mornings of Evolution. Afternoons of Competition. Nights of Connection.").

Write the article in English (SEO). Return ONLY valid JSON with these keys:
- title (string, compelling, SEO-friendly)
- slug (string, lowercase kebab-case, no leading/trailing dashes)
- excerpt (string, 1–2 sentences for cards + meta)
- content (string, long-form Markdown: ## headings, paragraphs, lists; no H1; include a clear CTA to /construir or /contacto)
- meta_title (string, ≤60 chars ideal)
- meta_description (string, ≤155 chars)
- social_caption (string for Instagram/Facebook: long-form caption ≈1500–2100 characters — not a teaser. Brand voice, 1–3 emojis max, several short paragraphs from the article angle, CTA, then 8–15 padel/travel hashtags at the end)
- category (one of: Destinations, Guides, Coaching, Case Studies)

Do not wrap JSON in markdown fences.`

function buildUserPrompt(topic: string, destination: ContentDestination): string {
  return `Topic: ${topic}
Target destination hub: ${destination}

Constraints:
- Anchor the piece in ${destination} while staying useful for European club coaches.
- Mention SportsEvents.app immersion model without sounding spammy.
- content must be substantial (800–1400 words equivalent in Markdown).
- social_caption must stand alone and be substantial (aim for ~1800 characters, max 2200): hook + 3–6 short paragraphs of value from the article + soft CTA + hashtags at the end.`
}

function slugify(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120)
}

function parseJsonLoose(raw: string): unknown {
  const trimmed = raw.trim()
  try {
    return JSON.parse(trimmed)
  } catch {
    const match = trimmed.match(/\{[\s\S]*\}/)
    if (!match) throw new Error('Resposta da IA não contém JSON válido.')
    return JSON.parse(match[0])
  }
}

function normalizeArticle(data: Record<string, unknown>): GeneratedArticle {
  const title = String(data.title || '').trim()
  if (!title) throw new Error('IA não devolveu title.')

  const slug = slugify(String(data.slug || title))
  if (!slug) throw new Error('Slug inválido gerado pela IA.')

  const excerpt = String(data.excerpt || '').trim()
  const content = String(data.content || '').trim()
  if (!content) throw new Error('IA não devolveu content.')

  return {
    title,
    slug,
    excerpt: excerpt || title,
    content,
    meta_title: String(data.meta_title || title).trim().slice(0, 70),
    meta_description: String(
      data.meta_description || excerpt || title
    )
      .trim()
      .slice(0, 170),
    social_caption: String(data.social_caption || '').trim(),
    category: String(data.category || 'Destinations').trim(),
  }
}

export async function generateArticleContent(opts: {
  topic: string
  destination: ContentDestination
}): Promise<GeneratedArticle> {
  const openai = new OpenAI()
  // Netlify AI Gateway injects OPENAI_API_KEY + OPENAI_BASE_URL when AI is enabled.
  // Locally you may set OPENAI_API_KEY (and optionally OPENAI_BASE_URL).

  const model =
    process.env.CONTENT_OPENAI_MODEL ||
    process.env.OPENAI_CONTENT_MODEL ||
    'gpt-4o-mini'

  const completion = await openai.chat.completions.create({
    model,
    temperature: 0.7,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      {
        role: 'user',
        content: buildUserPrompt(opts.topic, opts.destination),
      },
    ],
  })

  const raw = completion.choices[0]?.message?.content
  if (!raw) throw new Error('IA não devolveu conteúdo.')

  const parsed = parseJsonLoose(raw)
  if (!parsed || typeof parsed !== 'object') {
    throw new Error('JSON da IA inválido.')
  }

  return normalizeArticle(parsed as Record<string, unknown>)
}
