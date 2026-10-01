/**
 * Visibilidade de env Netlify do admin (só nomes / presença).
 * Nunca devolve valores de secrets.
 */

export type NetlifyEnvKeyStatus = {
  key: string
  label: string
  product: 'boost' | 'padel1' | 'sportsevents' | 'hub' | 'shared'
  /** Presente no process.env deste runtime (deploy actual). */
  presentInRuntime: boolean
  /** Presente na API Netlify (só se token configurado). */
  presentInNetlify: boolean | null
  secret: boolean
}

export type NetlifyEnvVisibility = {
  apiConfigured: boolean
  siteId: string | null
  accountId: string | null
  siteUiUrl: string | null
  keys: NetlifyEnvKeyStatus[]
  apiError?: string
  /** Contagem só das keys do catálogo. */
  presentCount: number
  totalCount: number
}

function present(value: string | undefined | null): boolean {
  return Boolean(value && String(value).trim())
}

/** Catálogo de env do site admin.sportsevents.app (não inclui secrets Stripe Edge Boost). */
export const ADMIN_NETLIFY_ENV_CATALOG: Omit<
  NetlifyEnvKeyStatus,
  'presentInRuntime' | 'presentInNetlify'
>[] = [
  {
    key: 'NEXT_PUBLIC_SITE_URL',
    label: 'Site URL do hub',
    product: 'hub',
    secret: false,
  },
  {
    key: 'NEXT_PUBLIC_SUPABASE_URL',
    label: 'SE Supabase URL',
    product: 'sportsevents',
    secret: false,
  },
  {
    key: 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    label: 'SE anon key',
    product: 'sportsevents',
    secret: true,
  },
  {
    key: 'SUPABASE_SERVICE_ROLE_KEY',
    label: 'SE service role',
    product: 'sportsevents',
    secret: true,
  },
  {
    key: 'SUPABASE_ACCESS_TOKEN',
    label: 'Supabase Management PAT',
    product: 'hub',
    secret: true,
  },
  {
    key: 'BOOST_SUPABASE_ACCESS_TOKEN',
    label: 'Boost Management PAT (alt)',
    product: 'boost',
    secret: true,
  },
  {
    key: 'BOOST_SUPABASE_URL',
    label: 'Boost Supabase URL',
    product: 'boost',
    secret: false,
  },
  {
    key: 'BOOST_SUPABASE_ANON_KEY',
    label: 'Boost anon key',
    product: 'boost',
    secret: true,
  },
  {
    key: 'BOOST_SUPABASE_SERVICE_ROLE_KEY',
    label: 'Boost service role',
    product: 'boost',
    secret: true,
  },
  {
    key: 'BOOST_SUPABASE_PROJECT_REF',
    label: 'Boost project ref',
    product: 'boost',
    secret: false,
  },
  {
    key: 'BOOST_EDGE_AUTH_EMAIL',
    label: 'Boost Edge auth email',
    product: 'boost',
    secret: false,
  },
  {
    key: 'BOOST_EDGE_AUTH_PASSWORD',
    label: 'Boost Edge auth password',
    product: 'boost',
    secret: true,
  },
  {
    key: 'BOOST_EDGE_USER_ID',
    label: 'Boost Edge user id',
    product: 'boost',
    secret: false,
  },
  {
    key: 'NEXT_PUBLIC_BOOST_STORE_URL',
    label: 'Boost store URL',
    product: 'boost',
    secret: false,
  },
  {
    key: 'NEXT_PUBLIC_BOOST_ADMIN_URL',
    label: 'Boost admin deep-link',
    product: 'boost',
    secret: false,
  },
  {
    key: 'PADEL1_SUPABASE_URL',
    label: 'Padel1 Supabase URL',
    product: 'padel1',
    secret: false,
  },
  {
    key: 'PADEL1_SUPABASE_ANON_KEY',
    label: 'Padel1 anon key',
    product: 'padel1',
    secret: true,
  },
  {
    key: 'PADEL1_SUPABASE_SERVICE_ROLE_KEY',
    label: 'Padel1 service role',
    product: 'padel1',
    secret: true,
  },
  {
    key: 'NEXT_PUBLIC_PADEL1_HQ_URL',
    label: 'Padel1 HQ deep-link',
    product: 'padel1',
    secret: false,
  },
  {
    key: 'NEXT_PUBLIC_SPORTSEVENTS_ADMIN_URL',
    label: 'SE ERP deep-link',
    product: 'sportsevents',
    secret: false,
  },
  {
    key: 'BRIDGE_LINK_TTL_SECONDS',
    label: 'Bridge TTL',
    product: 'hub',
    secret: false,
  },
  {
    key: 'NETLIFY_AUTH_TOKEN',
    label: 'Netlify API token',
    product: 'hub',
    secret: true,
  },
  {
    key: 'NETLIFY_SITE_ID',
    label: 'Netlify site id (admin)',
    product: 'hub',
    secret: false,
  },
  {
    key: 'NETLIFY_ACCOUNT_ID',
    label: 'Netlify account id',
    product: 'hub',
    secret: false,
  },
]

export function getNetlifyAuthToken(): string | null {
  return process.env.NETLIFY_AUTH_TOKEN?.trim() || null
}

export function getNetlifySiteId(): string | null {
  return process.env.NETLIFY_SITE_ID?.trim() || null
}

export function getNetlifyAccountId(): string | null {
  return process.env.NETLIFY_ACCOUNT_ID?.trim() || null
}

export function getNetlifySiteUiUrl(): string | null {
  const name = process.env.NETLIFY_SITE_NAME?.trim()
  if (name) {
    return `https://app.netlify.com/projects/${encodeURIComponent(name)}/configuration/env`
  }
  const siteId = getNetlifySiteId()
  if (siteId) {
    return `https://app.netlify.com/sites/${encodeURIComponent(siteId)}/configuration/env`
  }
  return 'https://app.netlify.com'
}

function netlifyApiConfigured(): boolean {
  return Boolean(getNetlifyAuthToken() && getNetlifyAccountId())
}

/**
 * Lista nomes de env vars no account Netlify (filtrado ao site se NETLIFY_SITE_ID).
 * Nunca inclui valores.
 */
async function listNetlifyEnvKeyNames(): Promise<
  { ok: true; keys: string[] } | { ok: false; error: string }
> {
  const token = getNetlifyAuthToken()
  const accountId = getNetlifyAccountId()
  const siteId = getNetlifySiteId()
  if (!token || !accountId) {
    return {
      ok: false,
      error:
        'Falta NETLIFY_AUTH_TOKEN e/ou NETLIFY_ACCOUNT_ID — só visibilidade runtime.',
    }
  }

  const url = new URL(
    `https://api.netlify.com/api/v1/accounts/${encodeURIComponent(accountId)}/env`
  )
  if (siteId) url.searchParams.set('site_id', siteId)

  const res = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
    cache: 'no-store',
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    return {
      ok: false,
      error: `Netlify API HTTP ${res.status}${text ? `: ${text.slice(0, 120)}` : ''}`,
    }
  }

  let payload: unknown
  try {
    payload = await res.json()
  } catch {
    return { ok: false, error: 'Resposta Netlify inválida' }
  }

  const keys: string[] = []
  if (Array.isArray(payload)) {
    for (const entry of payload) {
      if (
        entry &&
        typeof entry === 'object' &&
        'key' in entry &&
        typeof (entry as { key: unknown }).key === 'string'
      ) {
        keys.push((entry as { key: string }).key)
      }
    }
  }

  return { ok: true, keys }
}

export async function getNetlifyEnvVisibility(options?: {
  product?: NetlifyEnvKeyStatus['product']
}): Promise<NetlifyEnvVisibility> {
  const apiConfigured = netlifyApiConfigured()
  let netlifyKeys: Set<string> | null = null
  let apiError: string | undefined

  if (apiConfigured) {
    const listed = await listNetlifyEnvKeyNames()
    if (listed.ok) {
      netlifyKeys = new Set(listed.keys)
    } else {
      apiError = listed.error
    }
  }

  const catalog = options?.product
    ? ADMIN_NETLIFY_ENV_CATALOG.filter(
        (k) => k.product === options.product || k.product === 'shared'
      )
    : ADMIN_NETLIFY_ENV_CATALOG

  const keys: NetlifyEnvKeyStatus[] = catalog.map((entry) => {
    const presentInRuntime = present(process.env[entry.key])
    const presentInNetlify =
      netlifyKeys === null ? null : netlifyKeys.has(entry.key)
    return {
      ...entry,
      presentInRuntime,
      presentInNetlify,
    }
  })

  return {
    apiConfigured,
    siteId: getNetlifySiteId(),
    accountId: getNetlifyAccountId(),
    siteUiUrl: getNetlifySiteUiUrl(),
    keys,
    apiError,
    presentCount: keys.filter((k) => k.presentInRuntime).length,
    totalCount: keys.length,
  }
}
