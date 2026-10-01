/**
 * Read-only integration status for Configuração.
 * Never returns secret values — only presence / public URLs.
 */

export type IntegrationStatus = {
  id: string
  label: string
  connected: boolean
  detail: string
  /** Public URL safe to show (never a secret). */
  publicUrl?: string | null
  /** Where to fix if missing. */
  fixHint: string
}

export type ProductConfigStatus = {
  product: 'boost' | 'padel1' | 'sportsevents' | 'hub'
  label: string
  integrations: IntegrationStatus[]
  connectedCount: number
  totalCount: number
}

function present(value: string | undefined | null): boolean {
  return Boolean(value && String(value).trim())
}

function publicOrMissing(value: string | undefined, fallback: string): string {
  return present(value) ? String(value) : fallback
}

/** Project ref from https://xxxx.supabase.co */
export function parseSupabaseProjectRef(
  url: string | undefined
): string | null {
  if (!url) return null
  try {
    const host = new URL(url).hostname
    const match = /^([a-z0-9]+)\.supabase\.co$/i.exec(host)
    return match?.[1] ?? null
  } catch {
    return null
  }
}

export function getBoostProjectRef(): string | null {
  return (
    process.env.BOOST_SUPABASE_PROJECT_REF?.trim() ||
    parseSupabaseProjectRef(process.env.BOOST_SUPABASE_URL) ||
    null
  )
}

/** Management API token for writing Boost Edge secrets (server-only). */
export function getSupabaseManagementToken(): string | null {
  const token =
    process.env.BOOST_SUPABASE_ACCESS_TOKEN?.trim() ||
    process.env.SUPABASE_ACCESS_TOKEN?.trim() ||
    null
  return token || null
}

export function managementApiConfigured(): boolean {
  return Boolean(getSupabaseManagementToken() && getBoostProjectRef())
}

function item(
  partial: Omit<IntegrationStatus, 'connected'> & { connected: boolean }
): IntegrationStatus {
  return partial
}

export function getBoostConfigStatus(): ProductConfigStatus {
  const storeUrl = publicOrMissing(
    process.env.NEXT_PUBLIC_BOOST_STORE_URL,
    'https://boostpadel.store'
  )
  const adminUrl = publicOrMissing(
    process.env.NEXT_PUBLIC_BOOST_ADMIN_URL,
    'https://boostpadel.store/admin.html'
  )
  const edgeAuth =
    present(process.env.BOOST_EDGE_AUTH_EMAIL) &&
    present(process.env.BOOST_EDGE_AUTH_PASSWORD)
  const edgeUser = present(process.env.BOOST_EDGE_USER_ID)
  const edgeOk =
    present(process.env.BOOST_SUPABASE_URL) &&
    present(process.env.BOOST_SUPABASE_ANON_KEY) &&
    (edgeAuth || edgeUser)

  const integrations: IntegrationStatus[] = [
    item({
      id: 'boost-supabase-url',
      label: 'Boost Supabase URL',
      connected: present(process.env.BOOST_SUPABASE_URL),
      detail: present(process.env.BOOST_SUPABASE_URL)
        ? 'BOOST_SUPABASE_URL definido'
        : 'BOOST_SUPABASE_URL em falta',
      fixHint: 'Netlify admin → env BOOST_SUPABASE_URL',
    }),
    item({
      id: 'boost-service-role',
      label: 'Boost service role',
      connected: present(process.env.BOOST_SUPABASE_SERVICE_ROLE_KEY),
      detail: present(process.env.BOOST_SUPABASE_SERVICE_ROLE_KEY)
        ? 'Service role presente (server-only)'
        : 'BOOST_SUPABASE_SERVICE_ROLE_KEY em falta',
      fixHint: 'Netlify admin → env BOOST_SUPABASE_SERVICE_ROLE_KEY',
    }),
    item({
      id: 'boost-anon',
      label: 'Boost anon key',
      connected: present(process.env.BOOST_SUPABASE_ANON_KEY),
      detail: present(process.env.BOOST_SUPABASE_ANON_KEY)
        ? 'Anon key presente (Edge invoke)'
        : 'BOOST_SUPABASE_ANON_KEY em falta',
      fixHint: 'Netlify admin → env BOOST_SUPABASE_ANON_KEY',
    }),
    item({
      id: 'boost-edge-auth',
      label: 'Edge invoke credentials',
      connected: edgeOk,
      detail: edgeOk
        ? edgeAuth
          ? 'BOOST_EDGE_AUTH_EMAIL/PASSWORD OK'
          : 'BOOST_EDGE_USER_ID OK'
        : 'Falta BOOST_EDGE_AUTH_* ou BOOST_EDGE_USER_ID (+ URL/anon)',
      fixHint: 'Netlify admin → BOOST_EDGE_AUTH_EMAIL+PASSWORD ou BOOST_EDGE_USER_ID',
    }),
    item({
      id: 'boost-store-url',
      label: 'Store URL',
      connected: present(process.env.NEXT_PUBLIC_BOOST_STORE_URL),
      detail: storeUrl,
      publicUrl: storeUrl,
      fixHint: 'Netlify admin → NEXT_PUBLIC_BOOST_STORE_URL',
    }),
    item({
      id: 'boost-admin-deeplink',
      label: 'Admin legacy deep-link',
      connected: present(process.env.NEXT_PUBLIC_BOOST_ADMIN_URL),
      detail: adminUrl,
      publicUrl: adminUrl,
      fixHint: 'Netlify admin → NEXT_PUBLIC_BOOST_ADMIN_URL',
    }),
    item({
      id: 'boost-mgmt-api',
      label: 'Management API (Edge secrets)',
      connected: managementApiConfigured(),
      detail: managementApiConfigured()
        ? 'Token + project ref OK — hub pode actualizar secrets Edge'
        : 'Sem SUPABASE_ACCESS_TOKEN / BOOST_SUPABASE_ACCESS_TOKEN ou project ref',
      fixHint:
        'Netlify admin → SUPABASE_ACCESS_TOKEN (PAT) + BOOST_SUPABASE_PROJECT_REF opcional',
    }),
  ]

  return {
    product: 'boost',
    label: 'Boost Store',
    integrations,
    connectedCount: integrations.filter((i) => i.connected).length,
    totalCount: integrations.length,
  }
}

export function getPadel1ConfigStatus(): ProductConfigStatus {
  const hq = publicOrMissing(
    process.env.NEXT_PUBLIC_PADEL1_HQ_URL,
    'https://manager.padel1.app/#super-admin'
  )
  const integrations: IntegrationStatus[] = [
    item({
      id: 'padel1-url',
      label: 'Padel1 Supabase URL',
      connected: present(process.env.PADEL1_SUPABASE_URL),
      detail: present(process.env.PADEL1_SUPABASE_URL)
        ? 'PADEL1_SUPABASE_URL definido'
        : 'PADEL1_SUPABASE_URL em falta',
      fixHint: 'Netlify admin → PADEL1_SUPABASE_URL',
    }),
    item({
      id: 'padel1-anon',
      label: 'Padel1 anon key',
      connected: present(process.env.PADEL1_SUPABASE_ANON_KEY),
      detail: present(process.env.PADEL1_SUPABASE_ANON_KEY)
        ? 'Anon key presente'
        : 'PADEL1_SUPABASE_ANON_KEY em falta',
      fixHint: 'Netlify admin → PADEL1_SUPABASE_ANON_KEY',
    }),
    item({
      id: 'padel1-service',
      label: 'Padel1 service role',
      connected: present(process.env.PADEL1_SUPABASE_SERVICE_ROLE_KEY),
      detail: present(process.env.PADEL1_SUPABASE_SERVICE_ROLE_KEY)
        ? 'Service role presente (server-only)'
        : 'PADEL1_SUPABASE_SERVICE_ROLE_KEY em falta',
      fixHint: 'Netlify admin → PADEL1_SUPABASE_SERVICE_ROLE_KEY',
    }),
    item({
      id: 'padel1-hq',
      label: 'HQ deep-link',
      connected: present(process.env.NEXT_PUBLIC_PADEL1_HQ_URL),
      detail: hq,
      publicUrl: hq,
      fixHint: 'Netlify admin → NEXT_PUBLIC_PADEL1_HQ_URL',
    }),
  ]

  return {
    product: 'padel1',
    label: 'Padel One',
    integrations,
    connectedCount: integrations.filter((i) => i.connected).length,
    totalCount: integrations.length,
  }
}

export function getSportsEventsConfigStatus(): ProductConfigStatus {
  const adminUrl = publicOrMissing(
    process.env.NEXT_PUBLIC_SPORTSEVENTS_ADMIN_URL,
    'https://sportsevents.app/admin'
  )
  const integrations: IntegrationStatus[] = [
    item({
      id: 'se-url',
      label: 'SE Supabase URL (Auth hub)',
      connected: present(process.env.NEXT_PUBLIC_SUPABASE_URL),
      detail: present(process.env.NEXT_PUBLIC_SUPABASE_URL)
        ? 'NEXT_PUBLIC_SUPABASE_URL definido'
        : 'NEXT_PUBLIC_SUPABASE_URL em falta',
      fixHint: 'Netlify admin → NEXT_PUBLIC_SUPABASE_URL',
    }),
    item({
      id: 'se-anon',
      label: 'SE anon key',
      connected: present(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
      detail: present(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
        ? 'Anon key presente'
        : 'NEXT_PUBLIC_SUPABASE_ANON_KEY em falta',
      fixHint: 'Netlify admin → NEXT_PUBLIC_SUPABASE_ANON_KEY',
    }),
    item({
      id: 'se-service',
      label: 'SE service role',
      connected: present(process.env.SUPABASE_SERVICE_ROLE_KEY),
      detail: present(process.env.SUPABASE_SERVICE_ROLE_KEY)
        ? 'Service role presente (hub_staff / intents)'
        : 'SUPABASE_SERVICE_ROLE_KEY em falta',
      fixHint: 'Netlify admin → SUPABASE_SERVICE_ROLE_KEY',
    }),
    item({
      id: 'se-admin',
      label: 'ERP deep-link',
      connected: present(process.env.NEXT_PUBLIC_SPORTSEVENTS_ADMIN_URL),
      detail: adminUrl,
      publicUrl: adminUrl,
      fixHint: 'Netlify admin → NEXT_PUBLIC_SPORTSEVENTS_ADMIN_URL',
    }),
    item({
      id: 'se-stripe-external',
      label: 'Stripe / Meta / AI (site SE)',
      connected: false,
      detail:
        'Secrets do site público vivem no Netlify sportsevents.app — fora do env do hub',
      fixHint: 'Netlify sportsevents.app ou ERP /admin/definicoes (Fase 4)',
    }),
  ]

  return {
    product: 'sportsevents',
    label: 'SportsEvents',
    integrations,
    connectedCount: integrations.filter((i) => i.connected).length,
    totalCount: integrations.length,
  }
}

export function getHubConfigStatus(): ProductConfigStatus {
  const site = publicOrMissing(
    process.env.NEXT_PUBLIC_SITE_URL,
    'https://admin.sportsevents.app'
  )
  const integrations: IntegrationStatus[] = [
    item({
      id: 'hub-site',
      label: 'Site URL',
      connected: present(process.env.NEXT_PUBLIC_SITE_URL),
      detail: site,
      publicUrl: site,
      fixHint: 'Netlify admin → NEXT_PUBLIC_SITE_URL',
    }),
    item({
      id: 'hub-auth',
      label: 'Auth SE (login hub)',
      connected:
        present(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
        present(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
      detail: 'Mesmo projeto Supabase SportsEvents',
      fixHint: 'NEXT_PUBLIC_SUPABASE_URL + ANON_KEY',
    }),
    item({
      id: 'hub-service',
      label: 'Service role (hub_staff)',
      connected: present(process.env.SUPABASE_SERVICE_ROLE_KEY),
      detail: present(process.env.SUPABASE_SERVICE_ROLE_KEY)
        ? 'OK para staff + config intents'
        : 'SUPABASE_SERVICE_ROLE_KEY em falta',
      fixHint: 'Netlify admin → SUPABASE_SERVICE_ROLE_KEY',
    }),
    item({
      id: 'hub-bridge-ttl',
      label: 'Bridge link TTL',
      connected: present(process.env.BRIDGE_LINK_TTL_SECONDS),
      detail: present(process.env.BRIDGE_LINK_TTL_SECONDS)
        ? `${process.env.BRIDGE_LINK_TTL_SECONDS}s`
        : 'Default 300s (opcional)',
      fixHint: 'Netlify admin → BRIDGE_LINK_TTL_SECONDS (opcional)',
    }),
    item({
      id: 'hub-mgmt',
      label: 'Supabase Management token',
      connected: present(
        process.env.BOOST_SUPABASE_ACCESS_TOKEN ||
          process.env.SUPABASE_ACCESS_TOKEN
      ),
      detail: present(
        process.env.BOOST_SUPABASE_ACCESS_TOKEN ||
          process.env.SUPABASE_ACCESS_TOKEN
      )
        ? 'Token presente (server-only)'
        : 'Ausente — rotação Edge Boost só via checklist',
      fixHint: 'PAT em SUPABASE_ACCESS_TOKEN ou BOOST_SUPABASE_ACCESS_TOKEN',
    }),
  ]

  return {
    product: 'hub',
    label: 'Hub (staff / env)',
    integrations,
    connectedCount: integrations.filter((i) => i.connected).length,
    totalCount: integrations.length,
  }
}

export function getAllConfigStatuses(): ProductConfigStatus[] {
  return [
    getBoostConfigStatus(),
    getPadel1ConfigStatus(),
    getSportsEventsConfigStatus(),
    getHubConfigStatus(),
  ]
}
