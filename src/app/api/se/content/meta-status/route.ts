import { NextResponse } from 'next/server'
import { requireSeStaff } from '@/lib/sportsevents/auth'

export const runtime = 'nodejs'

const GRAPH = 'https://graph.facebook.com/v19.0'

/** Diagnóstico (sem revelar secrets): env Meta + scopes reais do token. */
export async function GET() {
  const auth = await requireSeStaff()
  if (auth.error || !auth.user) {
    return NextResponse.json(
      { error: auth.error || 'Não autenticado' },
      { status: auth.status || 401 }
    )
  }

  const present = (key: string) => Boolean(process.env[key]?.trim())
  const token = process.env.META_PAGE_ACCESS_TOKEN?.trim() || ''

  let token_valid: boolean | null = null
  let token_type: string | null = null
  let token_page_id: string | null = null
  let token_page_name: string | null = null
  let scopes: string[] = []
  let has_pages_manage_posts = false
  let has_pages_read_engagement = false
  let token_debug_error: string | null = null
  let page_id_matches_token = false

  const configuredPageId = process.env.META_PAGE_ID?.trim() || ''

  if (token) {
    try {
      const res = await fetch(
        `${GRAPH}/debug_token?input_token=${encodeURIComponent(token)}&access_token=${encodeURIComponent(token)}`
      )
      const data = (await res.json()) as {
        data?: {
          is_valid?: boolean
          type?: string
          scopes?: string[]
          profile_id?: string
        }
        error?: { message?: string }
      }
      if (data.error?.message) {
        token_debug_error = data.error.message
      } else {
        token_valid = Boolean(data.data?.is_valid)
        token_type = data.data?.type || null
        scopes = data.data?.scopes || []
        has_pages_manage_posts = scopes.includes('pages_manage_posts')
        has_pages_read_engagement = scopes.includes('pages_read_engagement')
        token_page_id = data.data?.profile_id || null
      }

      const meRes = await fetch(
        `${GRAPH}/me?fields=id,name&access_token=${encodeURIComponent(token)}`
      )
      const me = (await meRes.json()) as {
        id?: string
        name?: string
      }
      if (me.id) {
        token_page_id = me.id
        token_page_name = me.name || null
      }
      page_id_matches_token = Boolean(
        configuredPageId &&
          token_page_id &&
          String(configuredPageId) === String(token_page_id)
      )
    } catch (e) {
      token_debug_error =
        e instanceof Error ? e.message : 'Falha ao contactar Graph API'
    }
  }

  const env_ok =
    present('META_PAGE_ACCESS_TOKEN') && present('META_PAGE_ID')

  return NextResponse.json({
    openai: present('OPENAI_API_KEY') || present('OPENAI_BASE_URL'),
    meta_page_token: present('META_PAGE_ACCESS_TOKEN'),
    meta_page_id: present('META_PAGE_ID'),
    configured_page_id: configuredPageId || null,
    instagram_business_id: present('INSTAGRAM_BUSINESS_ACCOUNT_ID'),
    site_url: process.env.NEXT_PUBLIC_SITE_URL || process.env.URL || null,
    token_valid,
    token_type,
    token_page_id,
    token_page_name,
    page_id_matches_token,
    scopes,
    has_pages_manage_posts,
    has_pages_read_engagement,
    token_debug_error,
    ready_for_facebook:
      env_ok && has_pages_manage_posts && page_id_matches_token,
    ready_for_instagram:
      present('META_PAGE_ACCESS_TOKEN') &&
      present('INSTAGRAM_BUSINESS_ACCOUNT_ID'),
  })
}
