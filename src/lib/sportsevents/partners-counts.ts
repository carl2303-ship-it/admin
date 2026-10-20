import { createServiceClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export type PartnersDbCounts = {
  ok: boolean
  total: number
  clubesPadel: number
  byType: Record<string, number>
  serviceRole: boolean
  error?: string
}

/**
 * Contagens reais de `public.partners` no projecto SportsEvents.
 * Não insere nem altera dados.
 */
export async function getPartnersDbCounts(): Promise<PartnersDbCounts> {
  const service = createServiceClient()
  const db = service || (await createClient())
  const serviceRole = Boolean(service)

  if (!db) {
    return {
      ok: false,
      total: 0,
      clubesPadel: 0,
      byType: {},
      serviceRole: false,
      error: 'Cliente Supabase SE indisponível',
    }
  }

  const { data, error, count } = await db
    .from('partners')
    .select('type', { count: 'exact' })

  if (error) {
    return {
      ok: false,
      total: 0,
      clubesPadel: 0,
      byType: {},
      serviceRole,
      error: error.message,
    }
  }

  const byType: Record<string, number> = {}
  for (const row of data || []) {
    const t = String(row.type || 'UNKNOWN')
    byType[t] = (byType[t] || 0) + 1
  }

  const clubesPadel = byType.CLUBE_PADEL || 0
  const total = count ?? (data?.length || 0)

  return {
    ok: true,
    total,
    clubesPadel,
    byType,
    serviceRole,
  }
}
