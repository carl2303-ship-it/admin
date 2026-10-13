import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { createPadel1ServiceClient } from '@/lib/supabase/admin'

export class Padel1ConfigError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'Padel1ConfigError'
  }
}

/** Service role Padel1 — só no servidor. */
export function requirePadel1Client(): SupabaseClient {
  const client = createPadel1ServiceClient()
  if (!client) {
    throw new Padel1ConfigError(
      'PADEL1_SUPABASE_URL / PADEL1_SUPABASE_SERVICE_ROLE_KEY não configurados.'
    )
  }
  return client
}

/**
 * Invoca Edge Function no projeto Padel1.
 * create-club-owner / create-platform-checkout / send-checkout-email
 * usam service role internamente — anon JWT basta para o gateway.
 */
export async function invokePadel1EdgeFunction<T = unknown>(
  functionName: string,
  body: Record<string, unknown>
): Promise<{ data: T | null; error: string | null }> {
  const url = process.env.PADEL1_SUPABASE_URL
  const anonKey = process.env.PADEL1_SUPABASE_ANON_KEY
  const serviceKey = process.env.PADEL1_SUPABASE_SERVICE_ROLE_KEY
  if (!url) {
    return { data: null, error: 'PADEL1_SUPABASE_URL em falta.' }
  }
  if (!anonKey && !serviceKey) {
    return {
      data: null,
      error: 'PADEL1_SUPABASE_ANON_KEY ou SERVICE_ROLE_KEY em falta para Edge.',
    }
  }

  const token = serviceKey || anonKey!
  const apikey = anonKey || serviceKey!

  const res = await fetch(`${url}/functions/v1/${functionName}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      apikey,
    },
    body: JSON.stringify(body),
  })

  let payload: Record<string, unknown> = {}
  try {
    payload = (await res.json()) as Record<string, unknown>
  } catch {
    payload = {}
  }

  if (!res.ok) {
    const msg =
      (typeof payload.error === 'string' && payload.error) ||
      `Edge ${functionName} HTTP ${res.status}`
    return { data: null, error: msg }
  }

  if (typeof payload.error === 'string' && payload.error) {
    return { data: null, error: payload.error }
  }

  return { data: payload as T, error: null }
}
