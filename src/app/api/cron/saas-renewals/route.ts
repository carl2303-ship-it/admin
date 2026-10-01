import { NextResponse } from 'next/server'
import { BoostConfigError } from '@/lib/boost/client'
import { runSaasRenewalPaymentLinks } from '@/lib/boost/saas-renewal'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

function authorize(req: Request): boolean {
  const secret = process.env.SAAS_RENEWAL_CRON_SECRET || process.env.CRON_SECRET
  if (!secret) {
    // Sem secret: só permite em desenvolvimento local
    return process.env.NODE_ENV !== 'production'
  }
  const header = req.headers.get('authorization') || ''
  const bearer = header.startsWith('Bearer ') ? header.slice(7) : ''
  const query = new URL(req.url).searchParams.get('secret') || ''
  return bearer === secret || query === secret
}

/**
 * Cron de renovação SaaS Tour.
 * Chamado pela Netlify scheduled function `saas-renewal-cron` (diário).
 * Auth: Bearer SAAS_RENEWAL_CRON_SECRET (ou CRON_SECRET).
 */
export async function POST(req: Request) {
  if (!authorize(req)) {
    return NextResponse.json({ ok: false, error: 'Não autorizado' }, { status: 401 })
  }

  try {
    const result = await runSaasRenewalPaymentLinks()
    return NextResponse.json({ ok: true, ...result })
  } catch (e) {
    const message =
      e instanceof BoostConfigError
        ? e.message
        : e instanceof Error
          ? e.message
          : 'Erro no cron SaaS'
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}

export async function GET(req: Request) {
  return POST(req)
}
