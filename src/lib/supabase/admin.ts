import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const SE_SUPABASE_URL = 'https://tprbpeacicadsbmvxcqk.supabase.co'
const LEGACY_BOOST_HOST = 'gmpyjnufuvsoewbtirsg.supabase.co'

function serverOnlyClient(
  url: string | undefined,
  key: string | undefined,
  options?: { schema?: string }
): SupabaseClient | null {
  if (!url || !key) return null
  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    ...(options?.schema ? { db: { schema: options.schema } } : {}),
  })
}

/**
 * Service role do projeto SportsEvents (= Auth do hub + hub_staff + dados SE).
 * Nunca no browser.
 */
export function createHubServiceClient() {
  return serverOnlyClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )
}

/** Alias: KPIs / bridge SE usam o mesmo projeto que o Auth do hub. */
export function createSportsEventsServiceClient() {
  return createHubServiceClient()
}

/** Alias legado SportsEvents (`createServiceClient` nas APIs/libs SE). */
export function createServiceClient() {
  return createHubServiceClient()
}

/**
 * Dados Boost (loja/SaaS) — pós-cutover no mesmo projecto SE, schema `boost`.
 * Se Netlify ainda tiver BOOST_* a apontar ao projecto legado, remapeia para SE
 * e usa SUPABASE_SERVICE_ROLE_KEY.
 */
export function createBoostServiceClient() {
  const rawUrl =
    process.env.BOOST_SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    SE_SUPABASE_URL
  const legacy = rawUrl.includes(LEGACY_BOOST_HOST)
  const url = legacy
    ? process.env.NEXT_PUBLIC_SUPABASE_URL || SE_SUPABASE_URL
    : rawUrl
  const key = legacy
    ? process.env.SUPABASE_SERVICE_ROLE_KEY
    : process.env.BOOST_SUPABASE_SERVICE_ROLE_KEY ||
      process.env.SUPABASE_SERVICE_ROLE_KEY
  return serverOnlyClient(url, key, { schema: 'boost' })
}

/** URL API usada pelo módulo Boost (Edge + clients). */
export function resolveBoostApiUrl(): string {
  const raw =
    process.env.BOOST_SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    SE_SUPABASE_URL
  if (raw.includes(LEGACY_BOOST_HOST)) {
    return process.env.NEXT_PUBLIC_SUPABASE_URL || SE_SUPABASE_URL
  }
  return raw
}

/** Anon key para invoke Edge no projecto SE. */
export function resolveBoostAnonKey(): string | undefined {
  const rawUrl = process.env.BOOST_SUPABASE_URL || ''
  if (rawUrl.includes(LEGACY_BOOST_HOST) || !process.env.BOOST_SUPABASE_ANON_KEY) {
    return (
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      process.env.BOOST_SUPABASE_ANON_KEY
    )
  }
  return process.env.BOOST_SUPABASE_ANON_KEY
}

/** Read-only / bridge Padel1 — projecto Supabase separado; service role só no servidor. */
export function createPadel1ServiceClient() {
  return serverOnlyClient(
    process.env.PADEL1_SUPABASE_URL,
    process.env.PADEL1_SUPABASE_SERVICE_ROLE_KEY
  )
}
