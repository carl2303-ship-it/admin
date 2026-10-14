import { createClient } from '@/lib/supabase/server'
import {
  HUB_ID_TO_CODE,
  rowToView,
  type HubId,
  type HubPackageRow,
  type HubPackageView,
} from '@/lib/sportsevents/hub-packages'
import type { Locale } from '@/lib/sportsevents/locale'

/** Server-only: uses next/headers via Supabase SSR client. */
export async function fetchPublishedPackagesForHub(
  hubId: HubId,
  locale: Locale = 'en'
): Promise<HubPackageView[]> {
  const code = HUB_ID_TO_CODE[hubId]
  const supabase = await createClient()
  const { data: dest } = await supabase
    .from('destinations')
    .select('id, code, name')
    .eq('code', code)
    .maybeSingle()

  if (!dest) return []

  const { data, error } = await supabase
    .from('hub_packages')
    .select('*, destinations(id, code, name)')
    .eq('destination_id', dest.id)
    .eq('published', true)
    .order('sort_order', { ascending: true })

  if (error || !data) return []
  return (data as HubPackageRow[]).map((row) => rowToView(row, locale))
}

export async function fetchAllPackagesAdmin(): Promise<HubPackageView[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('hub_packages')
    .select('*, destinations(id, code, name)')
    .order('sort_order', { ascending: true })

  if (error || !data) return []
  return (data as HubPackageRow[]).map((row) => rowToView(row, 'pt'))
}
