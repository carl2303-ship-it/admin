import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/admin'
import { requireSeStaff } from '@/lib/sportsevents/auth'
import {
  createConnectOnboardingLink,
  ensureExpressAccount,
  syncConnectAccountStatus,
} from '@/lib/sportsevents/stripe/connect'
import { connectAccountSchema } from '@/lib/sportsevents/stripe/schemas'
import { getStripe } from '@/lib/sportsevents/stripe-client'

/**
 * POST — cria (se necessário) conta Express + Account Link de onboarding.
 * GET  — ?partnerId=… sincroniza estado Connect a partir do Stripe.
 */
export async function POST(request: Request) {
  const auth = await requireSeStaff()
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const stripe = await getStripe()
  if (!stripe) {
    return NextResponse.json(
      { error: 'Stripe não configurado (STRIPE_SECRET_KEY).' },
      { status: 503 }
    )
  }

  let json: unknown
  try {
    json = await request.json()
  } catch {
    return NextResponse.json({ error: 'JSON inválido.' }, { status: 400 })
  }

  const parsed = connectAccountSchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Dados inválidos.', details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const body = parsed.data
  const db = createServiceClient() || (await createClient())

  const { data: partner, error: partnerError } = await db
    .from('partners')
    .select(
      'id, name, email, type, country_code, stripe_account_id, stripe_connect_status'
    )
    .eq('id', body.partnerId)
    .maybeSingle()

  if (partnerError || !partner) {
    return NextResponse.json(
      { error: partnerError?.message || 'Parceiro não encontrado.' },
      { status: 404 }
    )
  }

  try {
    const { accountId, created } = await ensureExpressAccount(partner, {
      country: body.country || partner.country_code || 'PT',
      email: body.email || partner.email || undefined,
    })

    if (created || partner.stripe_account_id !== accountId) {
      const { error: updErr } = await db
        .from('partners')
        .update({
          stripe_account_id: accountId,
          stripe_connect_status: 'pending_onboarding',
        })
        .eq('id', partner.id)
      if (updErr) {
        return NextResponse.json({ error: updErr.message }, { status: 500 })
      }
    }

    const link = await createConnectOnboardingLink(accountId, {
      refreshUrl: body.refreshUrl,
      returnUrl: body.returnUrl,
    })

    return NextResponse.json({
      ok: true,
      partnerId: partner.id,
      stripeAccountId: accountId,
      created,
      onboardingUrl: link.url,
      expiresAt: link.expires_at,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro Connect'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function GET(request: Request) {
  const auth = await requireSeStaff()
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const partnerId = new URL(request.url).searchParams.get('partnerId')
  if (!partnerId) {
    return NextResponse.json({ error: 'partnerId em falta.' }, { status: 400 })
  }

  const db = createServiceClient() || (await createClient())
  const { data: partner, error } = await db
    .from('partners')
    .select(
      'id, name, stripe_account_id, stripe_connect_status, type, email'
    )
    .eq('id', partnerId)
    .maybeSingle()

  if (error || !partner) {
    return NextResponse.json(
      { error: error?.message || 'Parceiro não encontrado.' },
      { status: 404 }
    )
  }

  if (!partner.stripe_account_id) {
    return NextResponse.json({
      partnerId: partner.id,
      stripeAccountId: null,
      status: partner.stripe_connect_status || 'not_connected',
    })
  }

  try {
    const status = await syncConnectAccountStatus(partner.stripe_account_id)
    if (status !== partner.stripe_connect_status) {
      await db
        .from('partners')
        .update({ stripe_connect_status: status })
        .eq('id', partner.id)
    }
    return NextResponse.json({
      partnerId: partner.id,
      stripeAccountId: partner.stripe_account_id,
      status,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro ao sincronizar'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
