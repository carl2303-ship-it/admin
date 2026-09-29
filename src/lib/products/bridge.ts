/**
 * Contrato SSO / bridge do PADEL HUB → admins legacy.
 *
 * Fluxo alvo (Fase 1+):
 * 1. Utilizador autenticado no hub com hub_staff activo.
 * 2. POST/GET /api/bridge/{product} verifica RBAC + mapeamento *_user_id.
 * 3. Hub usa service role do produto para generateLink (magiclink / recovery)
 *    no Auth do produto destino, com redirectTo = admin URL legacy.
 * 4. Browser redirecciona para o action_link (utilizador entra sem password).
 *
 * Gaps nos legacy (documentados — NÃO implementados nestes repos nesta fase):
 * - Boost: sem RBAC; qualquer authenticated = admin. Bridge só precisa de user
 *   Auth existente; hardening RLS fica paralelo (Fase 1 quick-win no repo Boost).
 * - Padel1: precisa de linha em `super_admins` para HQ; magic link sozinho não
 *   basta se o user não for SA. Manager não tem endpoint de exchange token.
 * - SportsEvents: precisa de `staff_members` activo; login é email/password;
 *   magic link Supabase funciona se redirectTo apontar para /admin e o proxy
 *   aceitar sessão — confirmar Site URL / Redirect URLs no dashboard SE.
 *
 * Enquanto o mapeamento *_user_id estiver vazio, o bridge faz FALLBACK para
 * deep-link puro (abre o admin; o user autentica manualmente no produto).
 */

import type { ProductId } from './kpis'
import type { HubStaff } from '@/lib/auth/hub-auth'
import {
  createBoostServiceClient,
  createPadel1ServiceClient,
  createSportsEventsServiceClient,
} from '@/lib/supabase/admin'
import { getDeepLink } from './deep-links'

export type BridgeResult =
  | {
      mode: 'magic_link'
      product: ProductId
      redirectUrl: string
      note: string
    }
  | {
      mode: 'deep_link'
      product: ProductId
      redirectUrl: string
      note: string
      gap: string
    }
  | {
      mode: 'error'
      product: ProductId
      error: string
      status: number
    }

function mappedUserId(staff: HubStaff, product: ProductId): string | null {
  if (product === 'boost') return staff.boost_user_id
  if (product === 'padel1') return staff.padel1_user_id
  return staff.se_user_id
}

function productService(product: ProductId) {
  if (product === 'boost') return createBoostServiceClient()
  if (product === 'padel1') return createPadel1ServiceClient()
  return createSportsEventsServiceClient()
}

const PRODUCT_GAPS: Record<ProductId, string> = {
  boost:
    'Legacy sem RBAC e sem endpoint de exchange. Bridge usa magic link Auth Boost se boost_user_id estiver mapeado; senão deep-link.',
  padel1:
    'HQ exige super_admins. Magic link só autentica; o user destino tem de ser SA. Sem exchange token no Manager.',
  sportsevents:
    'ERP exige staff_members. Confirmar Redirect URLs no projeto SE. Sem bridge nativo além de magic link Supabase.',
}

export async function resolveBridge(
  product: ProductId,
  staff: HubStaff
): Promise<BridgeResult> {
  const deep = getDeepLink(product)
  const targetUserId = mappedUserId(staff, product)
  const service = productService(product)

  if (!targetUserId || !service) {
    return {
      mode: 'deep_link',
      product,
      redirectUrl: deep.url,
      note: 'Fallback deep-link — mapeamento ou service role em falta.',
      gap: PRODUCT_GAPS[product],
    }
  }

  const { data: userData, error: userError } =
    await service.auth.admin.getUserById(targetUserId)

  if (userError || !userData.user?.email) {
    return {
      mode: 'deep_link',
      product,
      redirectUrl: deep.url,
      note: `Não foi possível resolver o user mapeado (${userError?.message || 'sem email'}).`,
      gap: PRODUCT_GAPS[product],
    }
  }

  const ttl = Number(process.env.BRIDGE_LINK_TTL_SECONDS || 300)
  const { data: linkData, error: linkError } =
    await service.auth.admin.generateLink({
      type: 'magiclink',
      email: userData.user.email,
      options: {
        redirectTo: deep.url,
      },
    })

  // generateLink não expõe TTL directo em todas as versões; documentamos env.
  void ttl

  const actionLink = linkData?.properties?.action_link
  if (linkError || !actionLink) {
    return {
      mode: 'deep_link',
      product,
      redirectUrl: deep.url,
      note: `Magic link falhou (${linkError?.message || 'sem action_link'}).`,
      gap: PRODUCT_GAPS[product],
    }
  }

  return {
    mode: 'magic_link',
    product,
    redirectUrl: actionLink,
    note: 'Sessão via magic link no Auth do produto. Ver gaps de autorização no destino.',
  }
}

export { PRODUCT_GAPS }
