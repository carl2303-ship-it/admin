import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import {
  createBoostServiceClient,
  resolveBoostAnonKey,
  resolveBoostApiUrl,
} from '@/lib/supabase/admin'

export class BoostConfigError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'BoostConfigError'
  }
}

/** Service role Boost (SE schema `boost`) — só no servidor. */
export function requireBoostClient(): SupabaseClient {
  const client = createBoostServiceClient()
  if (!client) {
    throw new BoostConfigError(
      'Service role SE em falta (SUPABASE_SERVICE_ROLE_KEY / BOOST_SUPABASE_*). Dados Boost estão no schema boost do projecto SportsEvents.'
    )
  }
  return client
}

/**
 * JWT para invocar Edge Functions no projecto SE
 * (`provision-saas-license` exige getUser()).
 *
 * Ordem: BOOST_EDGE_AUTH_EMAIL+PASSWORD → userId (staff.boost_user_id / BOOST_EDGE_USER_ID)
 * via generateLink + verifyOtp. Auth = SE (mesmo projecto).
 */
export async function getBoostEdgeAccessToken(
  preferredUserId?: string | null
): Promise<{ token: string | null; error?: string }> {
  const url = resolveBoostApiUrl()
  const anonKey = resolveBoostAnonKey()
  if (!url || !anonKey) {
    return {
      token: null,
      error:
        'ANON key SE em falta (NEXT_PUBLIC_SUPABASE_ANON_KEY / BOOST_SUPABASE_ANON_KEY) para Edge.',
    }
  }

  if (
    process.env.BOOST_EDGE_AUTH_EMAIL &&
    process.env.BOOST_EDGE_AUTH_PASSWORD
  ) {
    const anon = createClient(url, anonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
    const { data, error } = await anon.auth.signInWithPassword({
      email: process.env.BOOST_EDGE_AUTH_EMAIL,
      password: process.env.BOOST_EDGE_AUTH_PASSWORD,
    })
    if (error || !data.session?.access_token) {
      return {
        token: null,
        error: `Login BOOST_EDGE_AUTH falhou: ${error?.message || 'sem session'}`,
      }
    }
    return { token: data.session.access_token }
  }

  const service = createBoostServiceClient()
  if (!service) {
    return { token: null, error: 'Service role SE/Boost em falta.' }
  }

  const userId = preferredUserId || process.env.BOOST_EDGE_USER_ID || null
  if (!userId) {
    return {
      token: null,
      error:
        'Sem JWT: define BOOST_EDGE_AUTH_EMAIL/PASSWORD (user Auth SE), BOOST_EDGE_USER_ID, ou mapeia boost_user_id no hub_staff.',
    }
  }

  const { data: userData, error: userError } =
    await service.auth.admin.getUserById(userId)
  if (userError || !userData.user?.email) {
    return {
      token: null,
      error: `User ${userId}: ${userError?.message || 'sem email'}`,
    }
  }

  const { data: linkData, error: linkError } =
    await service.auth.admin.generateLink({
      type: 'magiclink',
      email: userData.user.email,
    })

  const tokenHash = linkData?.properties?.hashed_token
  if (linkError || !tokenHash) {
    return {
      token: null,
      error: `generateLink falhou: ${linkError?.message || 'sem hashed_token'}`,
    }
  }

  const anon = createClient(url, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  const { data: otpData, error: otpError } = await anon.auth.verifyOtp({
    token_hash: tokenHash,
    type: 'email',
  })

  if (otpError || !otpData.session?.access_token) {
    return {
      token: null,
      error: `verifyOtp falhou: ${otpError?.message || 'sem session'}`,
    }
  }

  return { token: otpData.session.access_token }
}

/** Invoca Edge Function no projecto SE (Stripe/SaaS). Requer deploy + secrets no SE. */
export async function invokeBoostEdgeFunction<
  T = unknown
>(
  functionName: string,
  body: Record<string, unknown>,
  options?: { accessToken?: string | null; preferUserId?: string | null }
): Promise<{ data: T | null; error: string | null }> {
  const url = resolveBoostApiUrl()
  const anonKey = resolveBoostAnonKey()
  if (!url || !anonKey) {
    return {
      data: null,
      error: 'URL/ANON SE em falta para Edge Functions.',
    }
  }

  let token = options?.accessToken ?? null
  if (!token) {
    const got = await getBoostEdgeAccessToken(options?.preferUserId)
    if (!got.token) {
      if (functionName === 'stripe-checkout') {
        token = anonKey
      } else {
        return { data: null, error: got.error || 'Sem token Edge' }
      }
    } else {
      token = got.token
    }
  }

  const res = await fetch(`${url}/functions/v1/${functionName}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      apikey: anonKey,
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
