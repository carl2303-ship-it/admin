import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const SE_SUPABASE_URL = 'https://tprbpeacicadsbmvxcqk.supabase.co'
/** Projecto Boost legado — só override / referência histórica. */
export const BOOST_LEGACY_SUPABASE_URL =
  'https://gmpyjnufuvsoewbtirsg.supabase.co'
const LEGACY_BOOST_HOST = 'gmpyjnufuvsoewbtirsg.supabase.co'

/** Anon pública Boost (só se override Edge apontar ao legado). */
const BOOST_LEGACY_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdtcHlqbnVmdXZzb2V3YnRpcnNnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA0NjQ0NTYsImV4cCI6MjA3NjA0MDQ1Nn0.Uoe0xGYkQteD0nnHxeM5euGvBdeMbD64VbhBFQcGkX8'

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
 * Dados Boost (loja/SaaS) + Storage (`product-images`, `ebook-materials`, …)
 * — SEMPRE no projecto SportsEvents, schema `boost`.
 *
 * Nunca usa BOOST_SUPABASE_URL / BOOST_SUPABASE_SERVICE_ROLE_KEY:
 * esses envs podem ainda apontar ao projecto Boost legado e
 * faziam uploads de fotos irem para o Storage Boost.
 */
export function createBoostServiceClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  return serverOnlyClient(SE_SUPABASE_URL, key, { schema: 'boost' })
}

/**
 * URL do projecto onde corre a Edge `stripe-checkout`.
 * Canónico: SportsEvents. Override: BOOST_EDGE_URL / NEXT_PUBLIC_BOOST_EDGE_URL.
 */
export function resolveBoostApiUrl(): string {
  const override =
    process.env.BOOST_EDGE_URL || process.env.NEXT_PUBLIC_BOOST_EDGE_URL
  if (override) return override.replace(/\/$/, '')
  return SE_SUPABASE_URL
}

/**
 * Anon key do projecto Edge (SE por defeito).
 * Override: BOOST_EDGE_ANON_KEY / NEXT_PUBLIC_BOOST_EDGE_ANON_KEY.
 */
export function resolveBoostAnonKey(): string | undefined {
  const edgeAnon =
    process.env.BOOST_EDGE_ANON_KEY ||
    process.env.NEXT_PUBLIC_BOOST_EDGE_ANON_KEY
  if (edgeAnon) return edgeAnon

  const edgeUrl = resolveBoostApiUrl()
  if (edgeUrl.includes(LEGACY_BOOST_HOST)) {
    return (
      process.env.BOOST_SUPABASE_ANON_KEY ||
      BOOST_LEGACY_ANON_KEY
    )
  }

  return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
}

/**
 * Service role só para Auth admin no projecto Edge (magiclink JWT).
 * SE por defeito; se Edge override = Boost legado, usa BOOST_* service role.
 */
export function createBoostEdgeAuthAdminClient(): SupabaseClient | null {
  const edgeUrl = resolveBoostApiUrl()
  const onLegacyBoost = edgeUrl.includes(LEGACY_BOOST_HOST)
  const key = onLegacyBoost
    ? process.env.BOOST_EDGE_SERVICE_ROLE_KEY ||
      process.env.BOOST_SUPABASE_SERVICE_ROLE_KEY
    : process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.BOOST_SUPABASE_SERVICE_ROLE_KEY
  return serverOnlyClient(edgeUrl, key)
}

/** Read-only / bridge Padel1 — projecto Supabase separado; service role só no servidor. */
export function createPadel1ServiceClient() {
  return serverOnlyClient(
    process.env.PADEL1_SUPABASE_URL,
    process.env.PADEL1_SUPABASE_SERVICE_ROLE_KEY
  )
}
