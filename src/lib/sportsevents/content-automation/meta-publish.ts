import type { MetaPublishResult } from '@/lib/sportsevents/content-automation/types'

const GRAPH = 'https://graph.facebook.com/v19.0'
const PUBLIC_ORIGIN = 'https://sportsevents.app'

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function metaConfig() {
  const pageToken = process.env.META_PAGE_ACCESS_TOKEN?.trim()
  const pageId = process.env.META_PAGE_ID?.trim()
  const igUserId = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID?.trim()

  return {
    pageToken,
    pageId,
    igUserId,
    ok: Boolean(pageToken && pageId),
    igOk: Boolean(pageToken && igUserId),
  }
}

/** Facebook não consegue scrapar localhost — usa o domínio público. */
export function publicShareUrl(url: string): string {
  try {
    const u = new URL(url)
    if (u.hostname === 'localhost' || u.hostname === '127.0.0.1') {
      return `${PUBLIC_ORIGIN}${u.pathname}${u.search}`
    }
    return url
  } catch {
    return url
  }
}

function formatGraphError(data: Record<string, unknown>, status: number): string {
  const err = data.error as
    | {
        message?: string
        type?: string
        code?: number
        error_subcode?: number
        error_user_msg?: string
      }
    | undefined
  if (!err) return `Meta Graph error (${status})`
  const msg = err.error_user_msg || err.message || ''
  if (
    err.code === 200 ||
    /pages_manage_posts/i.test(msg) ||
    /pages_read_engagement/i.test(msg) ||
    /Permissions error/i.test(msg)
  ) {
    return (
      'Facebook (#200): o token não pode publicar nesta Página. ' +
      'Confirma que META_PAGE_ACCESS_TOKEN é o Page token de META_PAGE_ID ' +
      '(Sports Events), obtido com a conta admin dessa Página + pages_manage_posts. ' +
      'Se geraste o token com outra conta FB, me/accounts não inclui Sports Events.'
    )
  }
  const parts = [
    msg,
    err.code != null ? `code=${err.code}` : null,
    err.error_subcode != null ? `sub=${err.error_subcode}` : null,
    err.type || null,
  ].filter(Boolean)
  return parts.join(' · ')
}

/**
 * Garante Page Access Token para o META_PAGE_ID configurado.
 * Se META_PAGE_ACCESS_TOKEN for USER token, troca via /me/accounts.
 */
async function resolvePageAccessToken(
  token: string,
  pageId: string
): Promise<string> {
  // Já é token da página correcta?
  try {
    const meRes = await fetch(
      `${GRAPH}/me?fields=id&access_token=${encodeURIComponent(token)}`
    )
    const me = (await meRes.json()) as { id?: string; error?: { message?: string } }
    if (me.id && String(me.id) === String(pageId)) {
      return token
    }
  } catch {
    // continua
  }

  // USER token → page token
  const accRes = await fetch(
    `${GRAPH}/me/accounts?fields=id,name,access_token&access_token=${encodeURIComponent(token)}`
  )
  const acc = (await accRes.json()) as {
    data?: Array<{ id: string; name?: string; access_token?: string }>
    error?: { message?: string }
  }
  if (acc.error?.message) {
    // Token de outra página — não listar accounts
    throw new Error(
      `Facebook: o token actual não é da Página ${pageId}. ` +
        `Gera um Page token em Graph API Explorer com a conta admin de Sports Events ` +
        `(GET me/accounts → access_token da página com id ${pageId}).`
    )
  }

  const match = (acc.data || []).find((p) => String(p.id) === String(pageId))
  if (!match?.access_token) {
    const names = (acc.data || [])
      .map((p) => `${p.name || '?'} (${p.id})`)
      .join(', ')
    throw new Error(
      `Facebook: a conta deste token não gere a Página ${pageId}. ` +
        `Páginas disponíveis: ${names || '(nenhuma)'}. ` +
        `Entra no Explorer com o Facebook admin de Sports Events e volta a gerar o token.`
    )
  }
  return match.access_token
}

async function graphPost(
  path: string,
  body: Record<string, string>
): Promise<Record<string, unknown>> {
  const res = await fetch(`${GRAPH}/${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(body),
  })
  const data = (await res.json()) as Record<string, unknown>
  if (!res.ok || data.error) {
    throw new Error(formatGraphError(data, res.status))
  }
  return data
}

async function waitForIgContainer(
  creationId: string,
  accessToken: string
): Promise<void> {
  for (let attempt = 0; attempt < 12; attempt++) {
    const res = await fetch(
      `${GRAPH}/${creationId}?fields=status_code&access_token=${encodeURIComponent(accessToken)}`
    )
    const data = (await res.json()) as {
      status_code?: string
      error?: { message?: string }
    }
    if (data.error?.message) throw new Error(data.error.message)
    if (data.status_code === 'FINISHED') return
    if (data.status_code === 'ERROR') {
      throw new Error('Instagram media container failed processing.')
    }
    await sleep(2000)
  }
}

export async function publishToInstagram(opts: {
  imageUrl: string
  caption: string
}): Promise<{ mediaId: string }> {
  const { pageToken, igUserId, igOk } = metaConfig()
  if (!igOk || !pageToken || !igUserId) {
    throw new Error(
      'Meta Instagram incompleto: META_PAGE_ACCESS_TOKEN + INSTAGRAM_BUSINESS_ACCOUNT_ID.'
    )
  }

  const created = await graphPost(`${igUserId}/media`, {
    image_url: opts.imageUrl,
    caption: opts.caption.slice(0, 2200),
    access_token: pageToken,
  })

  const creationId = String(created.id || '')
  if (!creationId) throw new Error('Instagram não devolveu creation_id.')

  await waitForIgContainer(creationId, pageToken)

  const published = await graphPost(`${igUserId}/media_publish`, {
    creation_id: creationId,
    access_token: pageToken,
  })

  const mediaId = String(published.id || '')
  if (!mediaId) throw new Error('Instagram media_publish sem id.')
  return { mediaId }
}

/**
 * Publica na Página Facebook.
 * Preferência: foto com caption (mais fiável). Fallback: feed com link público.
 */
export async function publishToFacebook(opts: {
  message: string
  link: string
  imageUrl?: string
}): Promise<{ postId: string }> {
  const { pageToken, pageId, ok } = metaConfig()
  if (!ok || !pageToken || !pageId) {
    throw new Error(
      'Meta Facebook incompleto: META_PAGE_ACCESS_TOKEN + META_PAGE_ID.'
    )
  }

  const accessToken = await resolvePageAccessToken(pageToken, pageId)

  const shareLink = publicShareUrl(opts.link)
  const message = opts.message.slice(0, 5000)
  const imageUrl = opts.imageUrl?.trim()

  // 1) Foto na página (mesma imagem do IG) — evita scrape de link
  if (imageUrl && /^https:\/\//i.test(imageUrl)) {
    try {
      const caption = message.includes(shareLink)
        ? message
        : `${message}\n\n${shareLink}`
      const photo = await graphPost(`${pageId}/photos`, {
        url: imageUrl,
        caption: caption.slice(0, 5000),
        published: 'true',
        access_token: accessToken,
      })
      const postId = String(photo.post_id || photo.id || '')
      if (postId) return { postId }
    } catch (photoErr) {
      const photoMsg =
        photoErr instanceof Error ? photoErr.message : String(photoErr)
      try {
        const posted = await graphPost(`${pageId}/feed`, {
          message,
          link: shareLink,
          access_token: accessToken,
        })
        const postId = String(posted.id || '')
        if (!postId) throw new Error('Facebook feed sem id.')
        return { postId }
      } catch (feedErr) {
        const feedMsg =
          feedErr instanceof Error ? feedErr.message : String(feedErr)
        throw new Error(`FB photo: ${photoMsg} | FB feed: ${feedMsg}`)
      }
    }
  }

  const posted = await graphPost(`${pageId}/feed`, {
    message,
    link: shareLink,
    access_token: accessToken,
  })

  const postId = String(posted.id || '')
  if (!postId) throw new Error('Facebook feed sem id.')
  return { postId }
}

export async function publishSocialBundle(opts: {
  caption: string
  imageUrl: string
  blogUrl: string
  /** Caption mais longa só para Facebook (opcional). */
  facebookCaption?: string
}): Promise<MetaPublishResult> {
  const result: MetaPublishResult = {
    instagram_published: false,
    facebook_published: false,
    instagram_media_id: null,
    facebook_post_id: null,
    instagram_error: null,
    facebook_error: null,
  }

  const shareUrl = publicShareUrl(opts.blogUrl)
  const fixUrl = (text: string) =>
    text.includes(opts.blogUrl) ? text.split(opts.blogUrl).join(shareUrl) : text

  const igCaption = fixUrl(opts.caption)
  const fbCaption = fixUrl(opts.facebookCaption || opts.caption)

  try {
    const ig = await publishToInstagram({
      imageUrl: opts.imageUrl,
      caption: igCaption,
    })
    result.instagram_published = true
    result.instagram_media_id = ig.mediaId
  } catch (e) {
    result.instagram_error =
      e instanceof Error ? e.message : 'Erro Instagram desconhecido'
  }

  try {
    const fb = await publishToFacebook({
      message: fbCaption,
      link: shareUrl,
      imageUrl: opts.imageUrl,
    })
    result.facebook_published = true
    result.facebook_post_id = fb.postId
  } catch (e) {
    result.facebook_error =
      e instanceof Error ? e.message : 'Erro Facebook desconhecido'
  }

  return result
}
