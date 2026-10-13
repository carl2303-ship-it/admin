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

export async function getClientModules(
  entityType: 'club' | 'organizer',
  entityId: string
): Promise<
  QueryResult<{
    catalog: Padel1PlatformModule[]
    client: Padel1ClientModule[]
  }>
> {
  try {
    const client = requirePadel1Client()
    const [catRes, modsRes] = await Promise.all([
      client
        .from('platform_modules')
        .select(
          'code, name, description, price_monthly, price_annual, target_types, requires_modules, player_app_mode, landing_features, sort_order, is_active'
        )
        .eq('is_active', true)
        .order('sort_order'),
      client
        .from('client_modules')
        .select('module_code, enabled, expires_at')
        .eq('entity_type', entityType)
        .eq('entity_id', entityId),
    ])
    if (catRes.error) return { ok: false, error: catRes.error.message }
    if (modsRes.error) return { ok: false, error: modsRes.error.message }
    const catalog = ((catRes.data || []) as Padel1PlatformModule[]).filter(
      (m) => (m.target_types || []).includes(entityType)
    )
    return {
      ok: true,
      data: {
        catalog,
        client: (modsRes.data || []) as Padel1ClientModule[],
      },
    }
  } catch (e) {
    return wrapError(e)
  }
}

export async function listPlayerTransactions(): Promise<
  QueryResult<Padel1PlayerTransaction[]>
> {
  try {
    const client = requirePadel1Client()
    const { data, error } = await client
      .from('player_transactions')
      .select('*')
      .order('transaction_date', { ascending: false })
      .limit(500)
    if (error) return { ok: false, error: error.message }
    return { ok: true, data: (data || []) as Padel1PlayerTransaction[] }
  } catch (e) {
    return wrapError(e)
  }
}

export async function listPlatformPayments(): Promise<
  QueryResult<Padel1PlatformPayment[]>
> {
  try {
    const client = requirePadel1Client()
    const { data, error } = await client
      .from('platform_payments')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200)
    if (error) return { ok: false, error: error.message }
    return { ok: true, data: (data || []) as Padel1PlatformPayment[] }
  } catch (e) {
    return wrapError(e)
  }
}

export async function listClubsForSelect(): Promise<
  QueryResult<{ id: string; owner_id: string | null; name: string }[]>
> {
  try {
    const client = requirePadel1Client()
    const { data, error } = await client
      .from('clubs')
      .select('id, owner_id, name')
      .order('name')
    if (error) return { ok: false, error: error.message }
    return { ok: true, data: data || [] }
  } catch (e) {
    return wrapError(e)
  }
}

export async function getMetrics(): Promise<QueryResult<Padel1Metrics>> {
  try {
    const client = requirePadel1Client()
    const [clubs, players, payments, licenses] = await Promise.all([
      client
        .from('clubs')
        .select('id, status, plan_type, created_at, contract_expires_at'),
      client
        .from('player_accounts')
        .select('id', { count: 'exact', head: true }),
      client
        .from('platform_payments')
        .select('amount, status, target_type, created_at'),
      client
        .from('license_keys')
        .select('status')
        .eq('target_type', 'club'),
    ])
    const err =
      clubs.error || players.error || payments.error || licenses.error
    if (err) return { ok: false, error: err.message }

    const clubRows = clubs.data || []
    const activeClubs = clubRows.filter((c) => c.status === 'active').length
    const planCounts = { bronze: 0, silver: 0, gold: 0 }
    for (const c of clubRows) {
      const p = String(c.plan_type || '').toLowerCase()
      if (p === 'bronze') planCounts.bronze += 1
      else if (p === 'silver') planCounts.silver += 1
      else if (p === 'gold') planCounts.gold += 1
    }

    const now = Date.now()
    const in30 = now + 30 * 24 * 60 * 60 * 1000
    const expiringSoon = clubRows.filter((c) => {
      if (!c.contract_expires_at) return false
      const t = new Date(c.contract_expires_at).getTime()
      return t >= now && t <= in30
    }).length

    const completedClub = (payments.data || []).filter(
      (p) => p.status === 'completed' && p.target_type === 'club'
    )
    const clubRevenue = completedClub.reduce(
      (s, p) => s + Number(p.amount || 0),
      0
    )

    const revByMonth: Record<string, number> = {}
    for (const p of completedClub) {
      if (!p.created_at) continue
      const key = monthKey(p.created_at)
      revByMonth[key] = (revByMonth[key] || 0) + Number(p.amount || 0)
    }

    const growth: Record<string, number> = {}
    for (const c of clubRows) {
      if (!c.created_at) continue
      const key = monthKey(c.created_at)
      growth[key] = (growth[key] || 0) + 1
    }

    const lic = { total: 0, active: 0, used: 0, expired: 0 }
    for (const row of licenses.data || []) {
      lic.total += 1
      const s = (row.status || '').toLowerCase()
      if (s === 'active') lic.active += 1
      else if (s === 'used') lic.used += 1
      else if (s === 'expired') lic.expired += 1
    }

    return {
      ok: true,
      data: {
        totalClubs: clubRows.length,
        activeClubs,
        totalPlayers: players.count ?? 0,
        clubRevenue,
        licenses: lic,
        expiringSoon,
        planCounts,
        monthlyRevenue: Object.entries(revByMonth)
          .sort(([a], [b]) => a.localeCompare(b))
          .slice(-12)
          .map(([month, total]) => ({ month, total: Math.round(total) })),
        monthlyClubGrowth: Object.entries(growth)
          .sort(([a], [b]) => a.localeCompare(b))
          .slice(-12)
          .map(([month, count]) => ({ month, count })),
      },
    }
  } catch (e) {
    return wrapError(e)
  }
}

export async function listCombinedUsers(): Promise<
  QueryResult<{ users: Padel1CombinedUser[]; superAdmins: Padel1SuperAdmin[] }>
> {
  try {
    const client = requirePadel1Client()
    const [playersRes, settingsRes, superRes, clubsRes] = await Promise.all([
      client
        .from('player_accounts')
        .select(
          'id, name, phone_number, phone, email, user_id, total_reward_points, created_at'
        )
        .order('created_at', { ascending: false })
        .limit(1000),
      client
        .from('user_logo_settings')
        .select('user_id, role, is_paid_organizer'),
      client.from('super_admins').select('*').order('created_at', {
        ascending: false,
      }),
      client.from('clubs').select('owner_id'),
    ])
    const err =
      playersRes.error ||
      settingsRes.error ||
      superRes.error ||
      clubsRes.error
    if (err) return { ok: false, error: err.message }

    const superAdminIds = new Set(
      (superRes.data || []).map((s) => s.user_id as string)
    )
    const clubOwnerIds = new Set(
      (clubsRes.data || [])
        .map((c) => c.owner_id as string | null)
        .filter(Boolean) as string[]
    )
    const settingsByUserId = new Map(
      (settingsRes.data || []).map((s) => [s.user_id as string, s])
    )

    const users: Padel1CombinedUser[] = (playersRes.data || []).map((p) => {
      let role: Padel1CombinedUser['role'] = 'player'
      const uid = p.user_id as string | null
      if (uid && superAdminIds.has(uid)) role = 'super_admin'
      else if (uid && clubOwnerIds.has(uid)) role = 'manager'
      else if (uid) {
        const setting = settingsByUserId.get(uid)
        if (
          setting?.role === 'organizer' ||
          setting?.is_paid_organizer
        ) {
          role = 'organizer'
        }
      }
      return {
        id: p.id as string,
        name: (p.name as string) || '—',
        phone:
          (p.phone_number as string) || (p.phone as string) || '—',
        email: (p.email as string) || '—',
        role,
        rewardPoints: Number(p.total_reward_points || 0),
        createdAt: p.created_at as string,
        userId: uid,
      }
    })

    return {
      ok: true,
      data: {
        users,
        superAdmins: (superRes.data || []) as Padel1SuperAdmin[],
      },
    }
  } catch (e) {
    return wrapError(e)
  }
}

export async function getSettings(): Promise<
  QueryResult<{
    stripe: Padel1StripeConfigStatus | null
    plans: Padel1PlatformPlan[]
  }>
> {
  try {
    const client = requirePadel1Client()
    const [configRes, plansRes] = await Promise.all([
      client.from('platform_stripe_config').select('*').limit(1).maybeSingle(),
      client
        .from('platform_plans')
        .select('*')
        .order('target_type')
        .order('price_monthly', { ascending: true }),
    ])
    if (configRes.error) return { ok: false, error: configRes.error.message }
    if (plansRes.error) return { ok: false, error: plansRes.error.message }

    let stripe: Padel1StripeConfigStatus | null = null
    if (configRes.data) {
      const pk = (configRes.data.stripe_publishable_key as string) || ''
      const sk = (configRes.data.stripe_secret_key as string) || ''
      const wh = (configRes.data.webhook_secret as string) || ''
      stripe = {
        id: configRes.data.id as string,
        hasPublishable: Boolean(pk.trim()),
        hasSecret: Boolean(sk.trim()),
        hasWebhook: Boolean(wh.trim()),
        publishablePreview: pk
          ? `${pk.slice(0, 8)}…${pk.slice(-4)}`
          : null,
        updated_at: (configRes.data.updated_at as string) || null,
      }
    }

    return {
      ok: true,
      data: {
        stripe,
        plans: (plansRes.data || []) as Padel1PlatformPlan[],
      },
    }
  } catch (e) {
    return wrapError(e)
  }
}
