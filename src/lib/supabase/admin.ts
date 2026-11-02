import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const SE_SUPABASE_URL = 'https://tprbpeacicadsbmvxcqk.supabase.co'
/** Projecto Boost legado — Edge stripe-checkout + webhook ainda aqui até cutover SE. */
export const BOOST_LEGACY_SUPABASE_URL =
  'https://gmpyjnufuvsoewbtirsg.supabase.co'
const LEGACY_BOOST_HOST = 'gmpyjnufuvsoewbtirsg.supabase.co'

/** Anon pública Boost (Edge). Não usar a anon SE para invocar Edge Boost. */
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
 * Dados Boost (loja/SaaS) — no projecto SE, schema `boost`.
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

/**
 * URL do projecto onde corre a Edge `stripe-checkout`.
 * Hold: Boost legado até SE Edge + webhook Stripe prontos.
 * Override: BOOST_EDGE_URL / NEXT_PUBLIC_BOOST_EDGE_URL.
 */
export function resolveBoostApiUrl(): string {
  const override =
    process.env.BOOST_EDGE_URL || process.env.NEXT_PUBLIC_BOOST_EDGE_URL
  if (override) return override.replace(/\/$/, '')
  return BOOST_LEGACY_SUPABASE_URL
}

/**
 * Anon key do projecto Edge (Boost enquanto hold).
 * Override: BOOST_EDGE_ANON_KEY / NEXT_PUBLIC_BOOST_EDGE_ANON_KEY.
 * Se BOOST_SUPABASE_* ainda aponta ao host legado, usa essa anon.
 */
export function resolveBoostAnonKey(): string | undefined {
  const edgeAnon =
    process.env.BOOST_EDGE_ANON_KEY ||
    process.env.NEXT_PUBLIC_BOOST_EDGE_ANON_KEY
  if (edgeAnon) return edgeAnon

  const rawUrl = process.env.BOOST_SUPABASE_URL || ''
  if (rawUrl.includes(LEGACY_BOOST_HOST) && process.env.BOOST_SUPABASE_ANON_KEY) {
    return process.env.BOOST_SUPABASE_ANON_KEY
  }

  return BOOST_LEGACY_ANON_KEY
}

/**
 * Service role só para Auth admin no projecto Edge (magiclink JWT).
 * Hold = Boost; após cutover = SE service role.
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
