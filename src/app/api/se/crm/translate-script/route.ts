import { NextResponse } from 'next/server'
import OpenAI from 'openai'

export const runtime = 'nodejs'

const TARGET_LANGS = [
  { code: 'en', label: 'English' },
  { code: 'fr', label: 'Français' },
  { code: 'it', label: 'Italiano' },
  { code: 'de', label: 'Deutsch' },
  { code: 'nl', label: 'Nederlands' },
  { code: 'sv', label: 'Svenska' },
  { code: 'da', label: 'Dansk' },
] as const

type TranslateBody = {
  subject: string
  body: string
}

type TranslatedScript = {
  lang_code: string
  lang_label: string
  subject: string
  body: string
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as TranslateBody
    const subject = (payload.subject || '').trim()
    const body = (payload.body || '').trim()

    if (!subject || !body) {
      return NextResponse.json(
        { error: 'Assunto e corpo em português são obrigatórios.' },
        { status: 400 }
      )
    }

    const translations =
      (await translateWithOpenAI(subject, body)) ||
      (await translateWithMyMemory(subject, body))

    if (!translations?.length) {
      return NextResponse.json(
        {
          error:
            'Não foi possível traduzir. Verifica a ligação à AI Gateway / internet e tenta de novo.',
        },
        { status: 502 }
      )
    }

    return NextResponse.json({
      source: { lang_code: 'pt', subject, body },
      translations,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

async function translateWithOpenAI(
  subject: string,
  body: string
): Promise<TranslatedScript[] | null> {
  const apiKey = process.env.OPENAI_API_KEY || process.env.NETLIFY_AI_GATEWAY_KEY
  if (!apiKey) return null

  try {
    const openai = new OpenAI({
      apiKey,
      baseURL:
        process.env.OPENAI_BASE_URL ||
        process.env.NETLIFY_AI_GATEWAY_BASE_URL ||
        undefined,
    })

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.2,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: `You translate B2B outreach email scripts for SportsEvents.app (padel club partnerships in Algarve/Spain).
Return ONLY valid JSON with this shape:
{
  "en": { "subject": "...", "body": "..." },
  "fr": { "subject": "...", "body": "..." },
  "it": { "subject": "...", "body": "..." },
  "de": { "subject": "...", "body": "..." },
  "nl": { "subject": "...", "body": "..." },
  "sv": { "subject": "...", "body": "..." },
  "da": { "subject": "...", "body": "..." }
}
Keep tone professional, warm and concise. Preserve meaning, brand name SportsEvents.app and Padel Club Challenge. Keep line breaks in body.`,
        },
        {
          role: 'user',
          content: `Portuguese source script:\nSUBJECT:\n${subject}\n\nBODY:\n${body}`,
        },
      ],
    })

    const raw = completion.choices[0]?.message?.content
    if (!raw) return null

    const parsed = JSON.parse(raw) as Record<
      string,
      { subject?: string; body?: string }
    >

    return TARGET_LANGS.map((lang) => ({
      lang_code: lang.code,
      lang_label: lang.label,
      subject: (parsed[lang.code]?.subject || '').trim(),
      body: (parsed[lang.code]?.body || '').trim(),
    })).filter((t) => t.subject && t.body)
  } catch {
    return null
  }
}

async function translateWithMyMemory(
  subject: string,
  body: string
): Promise<TranslatedScript[] | null> {
  const results: TranslatedScript[] = []

  for (const lang of TARGET_LANGS) {
    try {
      const [translatedSubject, translatedBody] = await Promise.all([
        myMemoryTranslate(subject, lang.code),
        myMemoryTranslate(body, lang.code),
      ])
      if (!translatedSubject || !translatedBody) continue
      results.push({
        lang_code: lang.code,
        lang_label: lang.label,
        subject: translatedSubject,
        body: translatedBody,
      })
    } catch {
      // skip language
    }
  }

  return results.length ? results : null
}

async function myMemoryTranslate(text: string, target: string) {
  // MyMemory soft limit ~500 chars; chunk long scripts.
  const chunks = chunkText(text, 450)
  const translated: string[] = []

  for (const chunk of chunks) {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(chunk)}&langpair=pt|${target}`
    const res = await fetch(url)
    if (!res.ok) return null
    const data = (await res.json()) as {
      responseData?: { translatedText?: string }
      responseStatus?: number
    }
    const out = data.responseData?.translatedText
    if (!out || data.responseStatus !== 200) return null
    // MyMemory sometimes returns QUOTA EXCEEDED in the text
    if (/MYMEMORY WARNING|QUERY LENGTH LIMIT/i.test(out)) return null
    translated.push(out)
  }

  return translated.join('')
}

function chunkText(text: string, maxLen: number) {
  if (text.length <= maxLen) return [text]
  const parts: string[] = []
  let remaining = text
  while (remaining.length > maxLen) {
    let cut = remaining.lastIndexOf('\n', maxLen)
    if (cut < maxLen * 0.4) cut = remaining.lastIndexOf(' ', maxLen)
    if (cut < maxLen * 0.4) cut = maxLen
    parts.push(remaining.slice(0, cut))
    remaining = remaining.slice(cut).trimStart()
  }
  if (remaining) parts.push(remaining)
  return parts
}
