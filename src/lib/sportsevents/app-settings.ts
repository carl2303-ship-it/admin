import { createServiceClient } from '@/lib/supabase/admin'

/** Resolve setting: env var wins, then app_settings DB. */
export async function getAppSetting(key: string): Promise<string | null> {
  const envMap: Record<string, string | undefined> = {
    stripe_secret_key: process.env.STRIPE_SECRET_KEY,
    stripe_publishable_key: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    stripe_webhook_secret: process.env.STRIPE_WEBHOOK_SECRET,
    site_url: process.env.NEXT_PUBLIC_SITE_URL || process.env.URL,
    support_email: process.env.SUPPORT_EMAIL,
    company_name: process.env.COMPANY_NAME,
  }

  const fromEnv = envMap[key]
  if (fromEnv) return fromEnv

  try {
    const service = createServiceClient()
    if (service) {
      const { data } = await service
        .from('app_settings')
        .select('value')
        .eq('key', key)
        .maybeSingle()
      if (data?.value) return data.value
    }

    // Fallback: sessão autenticada (admin em Definições / Connect).
    // Checkout público e webhooks precisam de SUPABASE_SERVICE_ROLE_KEY.
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()
    const { data } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', key)
      .maybeSingle()
    return data?.value || null
  } catch {
    return null
  }
}
