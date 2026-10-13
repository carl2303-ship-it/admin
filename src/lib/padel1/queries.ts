import { requirePadel1Client, Padel1ConfigError } from './client'
import type {
  Padel1Club,
  Padel1ClientModule,
  Padel1CombinedUser,
  Padel1DashboardKpis,
  Padel1LicenseKey,
  Padel1Metrics,
  Padel1PlatformModule,
  Padel1PlatformPack,
  Padel1PlatformPayment,
  Padel1PlatformPlan,
  Padel1PlayerTransaction,
  Padel1StripeConfigStatus,
  Padel1SuperAdmin,
} from './types'
import { TXN_TYPE_LABELS } from './types'

export type QueryResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; missingConfig?: boolean }

function wrapError(err: unknown): QueryResult<never> {
  if (err instanceof Padel1ConfigError) {
    return { ok: false, error: err.message, missingConfig: true }
  }
  return {
    ok: false,
    error: err instanceof Error ? err.message : 'Erro desconhecido',
  }
}

function monthKey(iso: string) {
  const d = new Date(iso)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export async function padel1ModuleCounts(): Promise<
  QueryResult<{
    clubs: number
    modules: number
    packs: number
    players: number
  }>
> {
  try {
    const client = requirePadel1Client()
    const [clubs, modules, packs, players] = await Promise.all([
      client.from('clubs').select('id', { count: 'exact', head: true }),
      client
        .from('platform_modules')
        .select('code', { count: 'exact', head: true }),
      client.from('platform_packs').select('code', { count: 'exact', head: true }),
      client
        .from('player_accounts')
        .select('id', { count: 'exact', head: true }),
    ])
    const err =
      clubs.error || modules.error || packs.error || players.error
    if (err) return { ok: false, error: err.message }
    return {
      ok: true,
      data: {
        clubs: clubs.count ?? 0,
        modules: modules.count ?? 0,
        packs: packs.count ?? 0,
        players: players.count ?? 0,
      },
    }
  } catch (e) {
    return wrapError(e)
  }
}

export async function getDashboardKpis(): Promise<
  QueryResult<Padel1DashboardKpis>
> {
  try {
    const client = requirePadel1Client()
    const [players, activeClubs, allClubs, txns, clubsPlans, playerDates] =
      await Promise.all([
        client
          .from('player_accounts')
          .select('id', { count: 'exact', head: true }),
        client
          .from('clubs')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'active'),
        client.from('clubs').select('id', { count: 'exact', head: true }),
        client.from('player_transactions').select('transaction_type, amount'),
        client.from('clubs').select('plan_type'),
        client.from('player_accounts').select('created_at').order('created_at'),
      ])

    const err =
      players.error ||
      activeClubs.error ||
      allClubs.error ||
      txns.error ||
      clubsPlans.error ||
      playerDates.error
    if (err) return { ok: false, error: err.message }

    const txnVolume = (txns.data || []).reduce(
      (sum, t) => sum + Number(t.amount || 0),
      0
    )

    const byType: Record<string, number> = {}
    for (const row of txns.data || []) {
      const t = row.transaction_type || 'other'
      byType[t] = (byType[t] || 0) + Number(row.amount || 0)
    }

    const planCounts = { bronze: 0, silver: 0, gold: 0 }
    for (const c of clubsPlans.data || []) {
      const p = String(c.plan_type || '').toLowerCase()
      if (p === 'bronze') planCounts.bronze += 1
      else if (p === 'silver') planCounts.silver += 1
      else if (p === 'gold') planCounts.gold += 1
    }

    const byMonth: Record<string, number> = {}
    for (const row of playerDates.data || []) {
      if (!row.created_at) continue
      const key = monthKey(row.created_at)
      byMonth[key] = (byMonth[key] || 0) + 1
    }
    const monthlyPlayers = Object.entries(byMonth)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-12)
      .map(([month, count]) => ({ month, count }))

    return {
      ok: true,
      data: {
        players: players.count ?? 0,
        activeClubs: activeClubs.count ?? 0,
        totalClubs: allClubs.count ?? 0,
        txnVolume,
        planCounts,
        txnsByType: Object.entries(byType).map(([type, total]) => ({
          type: TXN_TYPE_LABELS[type] || type,
          total: Math.round(total),
        })),
        monthlyPlayers,
      },
    }
  } catch (e) {
    return wrapError(e)
  }
}

export async function listClubs(): Promise<QueryResult<Padel1Club[]>> {
  try {
    const client = requirePadel1Client()
    const { data, error } = await client
      .from('clubs')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) return { ok: false, error: error.message }
    return { ok: true, data: (data || []) as Padel1Club[] }
  } catch (e) {
    return wrapError(e)
  }
}

export async function getClubDetail(club: Padel1Club): Promise<
  QueryResult<{
    courtsCount: number
    membersCount: number
    staffCount: number
  }>
> {
  try {
    if (!club.owner_id) {
      return {
        ok: true,
        data: { courtsCount: 0, membersCount: 0, staffCount: 0 },
      }
    }
    const client = requirePadel1Client()
    const [courts, members, staff] = await Promise.all([
      client
        .from('club_courts')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', club.owner_id),
      client
        .from('member_subscriptions')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', club.owner_id),
      client
        .from('club_staff')
        .select('id', { count: 'exact', head: true })
        .eq('club_owner_id', club.owner_id),
    ])
    return {
      ok: true,
      data: {
        courtsCount: courts.count ?? 0,
        membersCount: members.count ?? 0,
        staffCount: staff.count ?? 0,
      },
    }
  } catch (e) {
    return wrapError(e)
  }
}

export async function listClubLicenseKeys(
  clubId: string
): Promise<QueryResult<Padel1LicenseKey[]>> {
  try {
    const client = requirePadel1Client()
    const { data, error } = await client
      .from('license_keys')
      .select(
        'id, license_key, plan_name, duration_months, status, custom_price, created_at, activated_at, target_entity_id'
      )
      .eq('target_type', 'club')
      .eq('target_entity_id', clubId)
      .order('created_at', { ascending: false })
    if (error) return { ok: false, error: error.message }
    return { ok: true, data: (data || []) as Padel1LicenseKey[] }
  } catch (e) {
    return wrapError(e)
  }
}

export async function listPlatformModules(): Promise<
  QueryResult<Padel1PlatformModule[]>
> {
  try {
    const client = requirePadel1Client()
    const { data, error } = await client
      .from('platform_modules')
      .select('*')
      .order('sort_order', { ascending: true })
    if (error) return { ok: false, error: error.message }
    return { ok: true, data: (data || []) as Padel1PlatformModule[] }
  } catch (e) {
    return wrapError(e)
  }
}

export async function listPlatformPacks(): Promise<
  QueryResult<Padel1PlatformPack[]>
> {
  try {
    const client = requirePadel1Client()
    const { data, error } = await client
      .from('platform_packs')
      .select('*')
    if (error) return { ok: false, error: error.message }
    return { ok: true, data: (data || []) as Padel1PlatformPack[] }
  } catch (e) {
    return wrapError(e)
  }
}
