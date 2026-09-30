import { createClient, type SupabaseClient } from '@supabase/supabase-js'

function serverOnlyClient(
  url: string | undefined,
  key: string | undefined
): SupabaseClient | null {
  if (!url || !key) return null
  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
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

/** Read-only / bridge Boost — projeto Supabase separado; service role só no servidor. */
export function createBoostServiceClient() {
  return serverOnlyClient(
    process.env.BOOST_SUPABASE_URL,
    process.env.BOOST_SUPABASE_SERVICE_ROLE_KEY
  )
}

/** Read-only / bridge Padel1 — projeto Supabase separado; service role só no servidor. */
export function createPadel1ServiceClient() {
  return serverOnlyClient(
    process.env.PADEL1_SUPABASE_URL,
    process.env.PADEL1_SUPABASE_SERVICE_ROLE_KEY
  )
}
