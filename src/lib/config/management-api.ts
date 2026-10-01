import {
  getBoostProjectRef,
  getSupabaseManagementToken,
} from './status'

export type EdgeSecretNameStatus = {
  names: string[]
  stripeSecretPresent: boolean
  stripeWebhookPresent: boolean
  error?: string
  managementConfigured: boolean
}

/**
 * Lista nomes de secrets Edge do project Boost (Management API).
 * Nunca devolve valores.
 */
export async function listBoostEdgeSecretNames(): Promise<EdgeSecretNameStatus> {
  const token = getSupabaseManagementToken()
  const ref = getBoostProjectRef()
  if (!token || !ref) {
    return {
      names: [],
      stripeSecretPresent: false,
      stripeWebhookPresent: false,
      managementConfigured: false,
      error:
        'Management API não configurada (falta SUPABASE_ACCESS_TOKEN / BOOST_SUPABASE_ACCESS_TOKEN ou project ref).',
    }
  }

  const res = await fetch(
    `https://api.supabase.com/v1/projects/${ref}/secrets`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
      cache: 'no-store',
    }
  )

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    return {
      names: [],
      stripeSecretPresent: false,
      stripeWebhookPresent: false,
      managementConfigured: true,
      error: `Management API HTTP ${res.status}${text ? `: ${text.slice(0, 120)}` : ''}`,
    }
  }

  let payload: unknown
  try {
    payload = await res.json()
  } catch {
    payload = []
  }

  const names: string[] = []
  if (Array.isArray(payload)) {
    for (const entry of payload) {
      if (typeof entry === 'string') names.push(entry)
      else if (
        entry &&
        typeof entry === 'object' &&
        'name' in entry &&
        typeof (entry as { name: unknown }).name === 'string'
      ) {
        names.push((entry as { name: string }).name)
      }
    }
  }

  return {
    names,
    stripeSecretPresent: names.includes('STRIPE_SECRET_KEY'),
    stripeWebhookPresent: names.includes('STRIPE_WEBHOOK_SECRET'),
    managementConfigured: true,
  }
}

/**
 * Actualiza secrets Edge no project Boost.
 * Não loga valores. Retorna erro tipado se falhar.
 */
export async function upsertBoostEdgeSecrets(
  secrets: { name: string; value: string }[]
): Promise<{ ok: true } | { ok: false; error: string }> {
  const token = getSupabaseManagementToken()
  const ref = getBoostProjectRef()
  if (!token || !ref) {
    return {
      ok: false,
      error:
        'Bloqueador: falta SUPABASE_ACCESS_TOKEN (ou BOOST_SUPABASE_ACCESS_TOKEN) e/ou project ref Boost. O service role não consegue escrever Edge secrets.',
    }
  }

  const cleaned = secrets
    .map((s) => ({
      name: s.name.trim(),
      value: s.value.trim(),
    }))
    .filter((s) => s.name && s.value)

  if (cleaned.length === 0) {
    return { ok: false, error: 'Nenhum secret com valor para actualizar.' }
  }

  const res = await fetch(
    `https://api.supabase.com/v1/projects/${ref}/secrets`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(cleaned),
    }
  )

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    return {
      ok: false,
      error: `Falha ao actualizar secrets (HTTP ${res.status}). ${text ? text.slice(0, 160) : 'Verifica o PAT e permissões do project.'}`,
    }
  }

  return { ok: true }
}
