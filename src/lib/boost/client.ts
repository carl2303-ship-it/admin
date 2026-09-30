import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { createBoostServiceClient } from '@/lib/supabase/admin'

export class BoostConfigError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'BoostConfigError'
  }
}

/** Service role Boost — só no servidor. Falha se env em falta. */
export function requireBoostClient(): SupabaseClient {
  const client = createBoostServiceClient()
  if (!client) {
    throw new BoostConfigError(
      'BOOST_SUPABASE_URL / BOOST_SUPABASE_SERVICE_ROLE_KEY não configurados.'
    )
  }
  return client
}

/**
 * Obtém JWT de um user Auth Boost para invocar Edge Functions
 * (`provision-saas-license` exige getUser()).
 *
 * Ordem: BOOST_EDGE_AUTH_EMAIL+PASSWORD → userId (staff.boost_user_id / BOOST_EDGE_USER_ID)
 * via generateLink + verifyOtp.
 */
export async function getBoostEdgeAccessToken(
  preferredUserId?: string | null
): Promise<{ token: string | null; error?: string }> {
  const url = process.env.BOOST_SUPABASE_URL
  const anonKey = process.env.BOOST_SUPABASE_ANON_KEY
  if (!url || !anonKey) {
    return {
      token: null,
      error: 'BOOST_SUPABASE_ANON_KEY em falta (necessário para Edge Functions).',
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
    return { token: null, error: 'Service role Boost em falta.' }
  }

  const userId = preferredUserId || process.env.BOOST_EDGE_USER_ID || null
  if (!userId) {
    return {
      token: null,
      error:
        'Sem JWT Boost: define BOOST_EDGE_AUTH_EMAIL/PASSWORD, BOOST_EDGE_USER_ID, ou mapeia boost_user_id no hub_staff.',
    }
  }

  const { data: userData, error: userError } =
    await service.auth.admin.getUserById(userId)
  if (userError || !userData.user?.email) {
    return {
      token: null,
      error: `User Boost ${userId}: ${userError?.message || 'sem email'}`,
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

/** Invoca Edge Function no projeto Boost (reutiliza lógica Stripe/SaaS). */
export async function invokeBoostEdgeFunction<T = unknown>(
  functionName: string,
  body: Record<string, unknown>,
  options?: { accessToken?: string | null; preferUserId?: string | null }
): Promise<{ data: T | null; error: string | null }> {
  const url = process.env.BOOST_SUPABASE_URL
  const anonKey = process.env.BOOST_SUPABASE_ANON_KEY
  if (!url || !anonKey) {
    return {
      data: null,
      error: 'BOOST_SUPABASE_URL / BOOST_SUPABASE_ANON_KEY em falta.',
    }
  }

  let token = options?.accessToken ?? null
  if (!token) {
    const got = await getBoostEdgeAccessToken(options?.preferUserId)
    if (!got.token) {
      // stripe-checkout saas é público — tenta com anon
      if (functionName === 'stripe-checkout') {
        token = anonKey
      } else {
        return { data: null, error: got.error || 'Sem token Boost' }
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
