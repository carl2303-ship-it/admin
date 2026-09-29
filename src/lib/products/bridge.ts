/**
 * Contrato SSO / bridge do PADEL HUB → admins legacy.
 *
 * Identity do hub = Auth do projeto Supabase SportsEvents (partilhado).
 * Boost e Padel1 continuam Auth/projetos separados.
 *
 * Fluxo alvo (Fase 1+):
 * 1. Utilizador autenticado no hub com hub_staff activo.
 * 2. GET /api/bridge/{product} verifica RBAC + mapeamento *_user_id.
 * 3. Hub usa service role do produto para generateLink (magiclink)
 *    no Auth do destino, com redirectTo = admin URL legacy.
 * 4. Browser redirecciona para o action_link.
 *
 * Gaps nos legacy:
 * - Boost: sem RBAC; bridge precisa de boost_user_id mapeado.
 * - Padel1: precisa de super_admins; magic link sozinho não basta.
 * - SportsEvents: Auth partilhado — se_user_id NULL ⇒ usa user_id do hub;
 *   ainda exige staff_members activo no ERP.
 *
 * Sem mapeamento (Boost/Padel1) ⇒ FALLBACK deep-link.
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
  // Auth partilhado com SE: default = user_id do hub
  return staff.se_user_id || staff.user_id
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
    'Auth partilhado com o hub. Ainda exige staff_members no ERP. Redirect URLs do callback hub no dashboard SE.',
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
