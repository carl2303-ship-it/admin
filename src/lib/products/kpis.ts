import {
  createBoostServiceClient,
  createPadel1ServiceClient,
  createSportsEventsServiceClient,
} from '@/lib/supabase/admin'

export type ProductId = 'boost' | 'padel1' | 'sportsevents'

export type KpiResult = {
  key: string
  label: string
  product: ProductId
  value: number | null
  hint?: string
  status: 'ok' | 'degraded' | 'missing_config'
  error?: string
}

function missing(product: ProductId, key: string, label: string): KpiResult {
  return {
    key,
    label,
    product,
    value: null,
    status: 'missing_config',
    error: 'Service role / URL não configurados',
  }
}

function degraded(
  product: ProductId,
  key: string,
  label: string,
  error: string
): KpiResult {
  return {
    key,
    label,
    product,
    value: null,
    status: 'degraded',
    error,
  }
}

/** Encomendas Boost (tabela `orders`). */
export async function fetchBoostOrderCount(): Promise<KpiResult> {
  const key = 'boost_orders'
  const label = 'Encomendas Boost'
  const client = createBoostServiceClient()
  if (!client) return missing('boost', key, label)

  const { count, error } = await client
    .from('orders')
    .select('id', { count: 'exact', head: true })

  if (error) return degraded('boost', key, label, error.message)
  return { key, label, product: 'boost', value: count ?? 0, status: 'ok' }
}

/** Clubes activos Padel1 (status != suspended, ou total se coluna variar). */
export async function fetchPadel1ActiveClubs(): Promise<KpiResult> {
  const key = 'padel1_clubs'
  const label = 'Clubes Padel1'
  const client = createPadel1ServiceClient()
  if (!client) return missing('padel1', key, label)

  const { count, error } = await client
    .from('clubs')
    .select('id', { count: 'exact', head: true })
    .neq('status', 'suspended')

  if (error) {
    // Fallback: contar todos se filtro status falhar
    const fallback = await client
      .from('clubs')
      .select('id', { count: 'exact', head: true })
    if (fallback.error) {
      return degraded('padel1', key, label, error.message)
    }
    return {
      key,
      label,
      product: 'padel1',
      value: fallback.count ?? 0,
      status: 'ok',
      hint: 'Total clubes (filtro status indisponível)',
    }
  }

  return { key, label, product: 'padel1', value: count ?? 0, status: 'ok' }
}

/** Próximos estágios SportsEvents (events com start_date >= hoje). */
export async function fetchSportsEventsUpcoming(): Promise<KpiResult> {
  const key = 'se_upcoming_events'
  const label = 'Próximos estágios SE'
  const client = createSportsEventsServiceClient()
  if (!client) return missing('sportsevents', key, label)

  const today = new Date().toISOString().slice(0, 10)
  const { count, error } = await client
    .from('events')
    .select('id', { count: 'exact', head: true })
    .gte('start_date', today)

  if (error) {
    const fallback = await client
      .from('events')
      .select('id', { count: 'exact', head: true })
    if (fallback.error) {
      return degraded('sportsevents', key, label, error.message)
    }
    return {
      key,
      label,
      product: 'sportsevents',
      value: fallback.count ?? 0,
      status: 'ok',
      hint: 'Total events (filtro data indisponível)',
    }
  }

  return {
    key,
    label,
    product: 'sportsevents',
    value: count ?? 0,
    status: 'ok',
  }
}

/** Leads CRM SportsEvents. */
export async function fetchSportsEventsLeads(): Promise<KpiResult> {
  const key = 'se_leads'
  const label = 'Leads SE'
  const client = createSportsEventsServiceClient()
  if (!client) return missing('sportsevents', key, label)

  const { count, error } = await client
    .from('leads')
    .select('id', { count: 'exact', head: true })

  if (error) return degraded('sportsevents', key, label, error.message)
  return {
    key,
    label,
    product: 'sportsevents',
    value: count ?? 0,
    status: 'ok',
  }
}

/** Licenças SaaS Tour no Boost (`organizations` source=boost). */
export async function fetchBoostSaasLicenses(): Promise<KpiResult> {
  const key = 'boost_saas'
  const label = 'Licenças Tour (Boost)'
  const client = createBoostServiceClient()
  if (!client) return missing('boost', key, label)

  const { count, error } = await client
    .from('organizations')
    .select('id', { count: 'exact', head: true })
    .eq('source', 'boost')

  if (error) {
    const fallback = await client
      .from('organizations')
      .select('id', { count: 'exact', head: true })
    if (fallback.error) {
      return degraded('boost', key, label, error.message)
    }
    return {
      key,
      label,
      product: 'boost',
      value: fallback.count ?? 0,
      status: 'ok',
      hint: 'Total organizations',
    }
  }

  return { key, label, product: 'boost', value: count ?? 0, status: 'ok' }
}

export async function fetchDashboardKpis(): Promise<KpiResult[]> {
  const results = await Promise.all([
    fetchBoostOrderCount(),
    fetchBoostSaasLicenses(),
    fetchPadel1ActiveClubs(),
    fetchSportsEventsUpcoming(),
    fetchSportsEventsLeads(),
  ])
  return results
}
