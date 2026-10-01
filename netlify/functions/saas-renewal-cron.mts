/**
 * Netlify Scheduled Function — renovação SaaS Tour (diário, UTC).
 * Invoca o Route Handler Next.js `/api/cron/saas-renewals`.
 *
 * Env necessários no site admin (Netlify):
 * - SAAS_RENEWAL_CRON_SECRET (ou CRON_SECRET)
 * - BOOST_* (URL, service role, anon, EDGE_*)
 * - URL / NEXT_PUBLIC_SITE_URL (opcional; Netlify injecta URL)
 */
export default async (req: Request) => {
  let nextRun: string | undefined
  try {
    const body = (await req.json()) as { next_run?: string }
    nextRun = body.next_run
  } catch {
    /* scheduled payload opcional */
  }

  const siteUrl = (
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.URL ||
    process.env.DEPLOY_PRIME_URL ||
    'https://admin.sportsevents.app'
  ).replace(/\/$/, '')

  const secret =
    process.env.SAAS_RENEWAL_CRON_SECRET || process.env.CRON_SECRET || ''

  if (!secret) {
    console.error(
      '[saas-renewal-cron] SAAS_RENEWAL_CRON_SECRET / CRON_SECRET em falta'
    )
    return new Response(
      JSON.stringify({
        ok: false,
        error: 'SAAS_RENEWAL_CRON_SECRET em falta',
        next_run: nextRun,
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }

  const url = `${siteUrl}/api/cron/saas-renewals`
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${secret}`,
      'Content-Type': 'application/json',
    },
  })

  const text = await res.text()
  let payload: unknown = text
  try {
    payload = JSON.parse(text)
  } catch {
    /* raw */
  }

  console.log('[saas-renewal-cron]', res.status, payload)

  return new Response(JSON.stringify({ ok: res.ok, status: res.status, payload, next_run: nextRun }), {
    status: res.ok ? 200 : 502,
    headers: { 'Content-Type': 'application/json' },
  })
}

export const config = {
  schedule: '@daily',
}
