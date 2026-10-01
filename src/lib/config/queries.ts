import { createHubServiceClient } from '@/lib/supabase/admin'
import { requireHubStaff } from '@/lib/auth/hub-auth'
import type { HubRole } from '@/lib/auth/roles'
import { listBoostEdgeSecretNames } from './management-api'
import {
  getNetlifyEnvVisibility,
  type NetlifyEnvVisibility,
} from './netlify-env'
import {
  getAllConfigStatuses,
  managementApiConfigured,
  type ProductConfigStatus,
} from './status'

export type ConfigIntent = {
  id: string
  product: string
  secret_name: string
  status: string
  note: string | null
  requested_by: string | null
  created_at: string
  updated_at: string
  resolved_at: string | null
}

function isOwner(
  role: HubRole | 'bootstrap' | undefined,
  isBootstrap: boolean
): boolean {
  return isBootstrap || role === 'owner'
}

export async function requireConfigOwner() {
  const auth = await requireHubStaff()
  if (!auth.user) {
    return { ...auth, allowed: false as const, error: 'Não autenticado' }
  }
  if (auth.error && !auth.isBootstrap) {
    return { ...auth, allowed: false as const }
  }
  const role = auth.isBootstrap ? 'bootstrap' : auth.staff?.role
  if (!isOwner(role, auth.isBootstrap)) {
    return {
      ...auth,
      allowed: false as const,
      error: 'Só owners acedem a Configuração.',
    }
  }
  return { ...auth, allowed: true as const, error: null }
}

export async function getConfigOverview(): Promise<
  | {
      ok: true
      products: ProductConfigStatus[]
      managementConfigured: boolean
      edgeSecrets: Awaited<ReturnType<typeof listBoostEdgeSecretNames>>
      netlify: NetlifyEnvVisibility
    }
  | { ok: false; error: string }
> {
  const gate = await requireConfigOwner()
  if (!gate.allowed) return { ok: false, error: gate.error || 'Sem permissão' }

  const [edgeSecrets, netlify] = await Promise.all([
    listBoostEdgeSecretNames(),
    getNetlifyEnvVisibility(),
  ])
  return {
    ok: true,
    products: getAllConfigStatuses(),
    managementConfigured: managementApiConfigured(),
    edgeSecrets,
    netlify,
  }
}

export async function listConfigIntents(
  product?: 'boost' | 'padel1' | 'sportsevents' | 'hub'
): Promise<
  | { ok: true; data: ConfigIntent[] }
  | { ok: false; error: string; missingConfig?: boolean }
> {
  const gate = await requireConfigOwner()
  if (!gate.allowed) return { ok: false, error: gate.error || 'Sem permissão' }

  const client = createHubServiceClient()
  if (!client) {
    return {
      ok: false,
      error: 'SUPABASE_SERVICE_ROLE_KEY em falta',
      missingConfig: true,
    }
  }

  let q = client
    .from('hub_config_intents')
    .select(
      'id, product, secret_name, status, note, requested_by, created_at, updated_at, resolved_at'
    )
    .order('created_at', { ascending: false })
    .limit(40)

  if (product) q = q.eq('product', product)

  const { data, error } = await q
  if (error) {
    // Tabela ainda não migrada — mensagem clara, sem stub vazio falso
    if (
      error.message.includes('hub_config_intents') ||
      error.code === '42P01' ||
      error.message.toLowerCase().includes('does not exist')
    ) {
      return {
        ok: false,
        error:
          'Tabela hub_config_intents em falta. Corre a migration no Supabase SportsEvents.',
        missingConfig: true,
      }
    }
    return { ok: false, error: error.message }
  }

  return { ok: true, data: (data || []) as ConfigIntent[] }
}
