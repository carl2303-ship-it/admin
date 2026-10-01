'use server'

import { revalidatePath } from 'next/cache'
import { createHubServiceClient } from '@/lib/supabase/admin'
import { upsertBoostEdgeSecrets } from './management-api'
import { managementApiConfigured } from './status'
import { requireConfigOwner } from './queries'

export type ConfigActionResult =
  | { ok: true; message: string; appliedVia: 'management_api' | 'intent' }
  | { ok: false; error: string }

const ALLOWED_BOOST_SECRETS = new Set([
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
])

function revalidateConfig() {
  revalidatePath('/configuracao')
  revalidatePath('/configuracao/boost')
  revalidatePath('/configuracao/padel1')
  revalidatePath('/configuracao/sportsevents')
  revalidatePath('/configuracao/hub')
}

/**
 * Actualiza secrets Stripe no Edge Boost via Management API.
 * Se o token não existir: grava intent (sem valor do secret) e devolve checklist.
 * Nunca loga FormData / valores.
 */
export async function updateBoostStripeSecrets(
  formData: FormData
): Promise<ConfigActionResult> {
  const gate = await requireConfigOwner()
  if (!gate.allowed || !gate.user) {
    return { ok: false, error: gate.error || 'Sem permissão' }
  }

  const stripeSecret = String(formData.get('stripe_secret_key') || '').trim()
  const webhookSecret = String(
    formData.get('stripe_webhook_secret') || ''
  ).trim()
  const note = String(formData.get('note') || '').trim() || null

  if (!stripeSecret && !webhookSecret) {
    return {
      ok: false,
      error: 'Indica pelo menos STRIPE_SECRET_KEY ou STRIPE_WEBHOOK_SECRET.',
    }
  }

  if (stripeSecret && !stripeSecret.startsWith('sk_')) {
    return {
      ok: false,
      error: 'STRIPE_SECRET_KEY deve começar por sk_ (live ou test).',
    }
  }
  if (webhookSecret && !webhookSecret.startsWith('whsec_')) {
    return {
      ok: false,
      error: 'STRIPE_WEBHOOK_SECRET deve começar por whsec_.',
    }
  }

  const secrets: { name: string; value: string }[] = []
  if (stripeSecret) {
    secrets.push({ name: 'STRIPE_SECRET_KEY', value: stripeSecret })
  }
  if (webhookSecret) {
    secrets.push({ name: 'STRIPE_WEBHOOK_SECRET', value: webhookSecret })
  }

  for (const s of secrets) {
    if (!ALLOWED_BOOST_SECRETS.has(s.name)) {
      return { ok: false, error: `Secret não permitido: ${s.name}` }
    }
  }

  if (managementApiConfigured()) {
    const result = await upsertBoostEdgeSecrets(secrets)
    if (!result.ok) {
      await insertIntents({
        product: 'boost',
        secretNames: secrets.map((s) => s.name),
        note:
          note ||
          `Tentativa Management API falhou: ${result.error.slice(0, 200)}`,
        userId: gate.user.id,
        status: 'pending',
      })
      revalidateConfig()
      return {
        ok: false,
        error: result.error,
      }
    }

    const intentWrite = await insertIntents({
      product: 'boost',
      secretNames: secrets.map((s) => s.name),
      note: note || 'Aplicado via Management API a partir do hub',
      userId: gate.user.id,
      status: 'applied',
    })
    revalidateConfig()
    if (!intentWrite.ok) {
      return {
        ok: true,
        appliedVia: 'management_api',
        message: `Secrets Edge actualizados. Aviso: intent não registado (${intentWrite.error}).`,
      }
    }
    return {
      ok: true,
      appliedVia: 'management_api',
      message:
        'Secrets Edge Boost actualizados via Management API. Valores não foram guardados no hub.',
    }
  }

  // Fallback: intent sem valor — Carlos aplica no dashboard Boost
  const intentResult = await insertIntents({
    product: 'boost',
    secretNames: secrets.map((s) => s.name),
    note:
      note ||
      'Intent criado no hub — aplicar manualmente nos Edge secrets do project Boost',
    userId: gate.user.id,
    status: 'pending',
  })
  if (!intentResult.ok) return intentResult

  revalidateConfig()
  return {
    ok: true,
    appliedVia: 'intent',
    message:
      'Bloqueador: falta SUPABASE_ACCESS_TOKEN (PAT) no Netlify do admin — o service role não escreve Edge secrets. Intent registado (sem guardar o valor). Segue o checklist in-hub e marca como aplicado depois.',
  }
}

async function insertIntents(args: {
  product: 'boost' | 'padel1' | 'sportsevents' | 'hub'
  secretNames: string[]
  note: string | null
  userId: string
  status: 'pending' | 'applied' | 'cancelled'
}): Promise<ConfigActionResult | { ok: true }> {
  const client = createHubServiceClient()
  if (!client) {
    return { ok: false, error: 'SUPABASE_SERVICE_ROLE_KEY em falta' }
  }

  const rows = args.secretNames.map((secret_name) => ({
    product: args.product,
    secret_name,
    status: args.status,
    note: args.note,
    requested_by: args.userId,
    resolved_at: args.status === 'applied' ? new Date().toISOString() : null,
  }))

  const { error } = await client.from('hub_config_intents').insert(rows)
  if (error) {
    if (
      error.message.includes('hub_config_intents') ||
      error.code === '42P01' ||
      error.message.toLowerCase().includes('does not exist')
    ) {
      return {
        ok: false,
        error:
          'Tabela hub_config_intents em falta. Corre supabase/migrations/20260930170000_create_hub_config_intents.sql no SE.',
      }
    }
    return { ok: false, error: error.message }
  }
  return { ok: true }
}

const ALLOWED_INTENT_SECRETS: Record<
  'padel1' | 'sportsevents' | 'hub',
  Set<string>
> = {
  padel1: new Set([
    'PADEL1_SUPABASE_URL',
    'PADEL1_SUPABASE_ANON_KEY',
    'PADEL1_SUPABASE_SERVICE_ROLE_KEY',
    'NEXT_PUBLIC_PADEL1_HQ_URL',
    'PADEL1_STRIPE_SECRET_KEY',
    'PADEL1_STRIPE_WEBHOOK_SECRET',
  ]),
  sportsevents: new Set([
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'NEXT_PUBLIC_SPORTSEVENTS_ADMIN_URL',
    'SE_STRIPE_SECRET_KEY',
    'SE_STRIPE_WEBHOOK_SECRET',
    'META_ACCESS_TOKEN',
    'OPENAI_API_KEY',
  ]),
  hub: new Set([
    'NEXT_PUBLIC_SITE_URL',
    'SUPABASE_ACCESS_TOKEN',
    'NETLIFY_AUTH_TOKEN',
    'NETLIFY_ACCOUNT_ID',
    'NETLIFY_SITE_ID',
    'BRIDGE_LINK_TTL_SECONDS',
  ]),
}

/**
 * Regista intent operacional (nome + nota, sem valor).
 * Usado em Padel1 / SE / Hub enquanto escrita live de env não existe.
 */
export async function createConfigIntent(
  formData: FormData
): Promise<ConfigActionResult> {
  const gate = await requireConfigOwner()
  if (!gate.allowed || !gate.user) {
    return { ok: false, error: gate.error || 'Sem permissão' }
  }

  const product = String(formData.get('product') || '').trim() as
    | 'padel1'
    | 'sportsevents'
    | 'hub'
  const secretName = String(formData.get('secret_name') || '').trim()
  const note = String(formData.get('note') || '').trim()

  if (product !== 'padel1' && product !== 'sportsevents' && product !== 'hub') {
    return { ok: false, error: 'Produto inválido' }
  }
  if (!secretName || !ALLOWED_INTENT_SECRETS[product].has(secretName)) {
    return { ok: false, error: 'Integração / secret não permitido' }
  }
  if (!note || note.length < 3) {
    return { ok: false, error: 'Nota obrigatória (mín. 3 caracteres)' }
  }

  const intentResult = await insertIntents({
    product,
    secretNames: [secretName],
    note,
    userId: gate.user.id,
    status: 'pending',
  })
  if (!intentResult.ok) return intentResult

  revalidateConfig()
  return {
    ok: true,
    appliedVia: 'intent',
    message:
      'Intent registado (sem valor). Aplica no Netlify / dashboard externo e marca como aplicado.',
  }
}

export async function resolveConfigIntent(
  formData: FormData
): Promise<ConfigActionResult> {
  const gate = await requireConfigOwner()
  if (!gate.allowed || !gate.user) {
    return { ok: false, error: gate.error || 'Sem permissão' }
  }

  const id = String(formData.get('id') || '').trim()
  const status = String(formData.get('status') || '').trim()
  if (!id) return { ok: false, error: 'id em falta' }
  if (status !== 'applied' && status !== 'cancelled') {
    return { ok: false, error: 'status inválido' }
  }

  const client = createHubServiceClient()
  if (!client) {
    return { ok: false, error: 'SUPABASE_SERVICE_ROLE_KEY em falta' }
  }

  const { error } = await client
    .from('hub_config_intents')
    .update({
      status,
      resolved_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) return { ok: false, error: error.message }

  revalidateConfig()
  return {
    ok: true,
    appliedVia: 'intent',
    message: status === 'applied' ? 'Intent marcado como aplicado.' : 'Intent cancelado.',
  }
}
