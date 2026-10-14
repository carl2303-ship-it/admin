import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/admin'
import { maskSecret, requireSeAdmin } from '@/lib/sportsevents/auth'

const ALLOWED_KEYS = [
  'stripe_secret_key',
  'stripe_publishable_key',
  'stripe_webhook_secret',
  'site_url',
  'support_email',
  'company_name',
] as const

type SettingKey = (typeof ALLOWED_KEYS)[number]

const SETTING_META: Record<
  SettingKey,
  { label: string; is_secret: boolean }
> = {
  stripe_secret_key: { label: 'Stripe Secret Key', is_secret: true },
  stripe_publishable_key: {
    label: 'Stripe Publishable Key',
    is_secret: false,
  },
  stripe_webhook_secret: {
    label: 'Stripe Webhook Secret',
    is_secret: true,
  },
  site_url: { label: 'URL pública do site', is_secret: false },
  support_email: { label: 'Email de suporte', is_secret: false },
  company_name: { label: 'Nome da empresa', is_secret: false },
}

function envStatus() {
  return {
    stripe_secret_key: Boolean(process.env.STRIPE_SECRET_KEY),
    stripe_publishable_key: Boolean(
      process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
    ),
    stripe_webhook_secret: Boolean(process.env.STRIPE_WEBHOOK_SECRET),
    site_url: Boolean(
      process.env.NEXT_PUBLIC_SITE_URL || process.env.URL
    ),
    service_role: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
  }
}

export async function GET() {
  const auth = await requireSeAdmin()
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const client = createServiceClient() || (await createClient())
  const { data, error } = await client.from('app_settings').select('*')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const byKey = new Map((data || []).map((row) => [row.key as string, row]))

  const settings = ALLOWED_KEYS.map((key) => {
    const row = byKey.get(key)
    const meta = SETTING_META[key]
    const isSecret = row?.is_secret ?? meta.is_secret
    const value = row?.value || null
    return {
      key,
      label: row?.label || meta.label,
      is_secret: isSecret,
      value: isSecret ? '' : value || '',
      masked: isSecret ? maskSecret(value) : null,
      has_value: Boolean(value),
      updated_at: row?.updated_at || null,
    }
  })

  return NextResponse.json({
    settings,
    env: envStatus(),
    isBootstrap: auth.isBootstrap,
  })
}

export async function PUT(request: Request) {
  const auth = await requireSeAdmin()
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const body = await request.json()
  const values = (body.values || {}) as Partial<Record<SettingKey, string>>

  const client = createServiceClient() || (await createClient())
  const now = new Date().toISOString()
  const upserts: {
    key: SettingKey
    value: string | null
    updated_at: string
    updated_by: string
  }[] = []

  for (const key of ALLOWED_KEYS) {
    if (!(key in values)) continue
    const raw = values[key]
    // Empty secret field = keep existing (don't wipe accidentally)
    if (
      (key === 'stripe_secret_key' ||
        key === 'stripe_publishable_key' ||
        key === 'stripe_webhook_secret') &&
      (raw === undefined || raw === '')
    ) {
      continue
    }
    upserts.push({
      key,
      value: raw?.trim() ? raw.trim() : null,
      updated_at: now,
      updated_by: auth.user!.id,
    })
  }

  if (upserts.length === 0) {
    return NextResponse.json({ ok: true, updated: 0 })
  }

  for (const row of upserts) {
    const meta = SETTING_META[row.key]
    const { error } = await client.from('app_settings').upsert(
      {
        key: row.key,
        value: row.value,
        updated_at: row.updated_at,
        updated_by: row.updated_by,
        is_secret: meta.is_secret,
        label: meta.label,
      },
      { onConflict: 'key' }
    )
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
  }

  return NextResponse.json({ ok: true, updated: upserts.length })
}
