import { NextResponse } from 'next/server'
import { requireHubAccess } from '@/lib/auth/hub-auth'
import { resolveBridge, PRODUCT_GAPS } from '@/lib/products/bridge'
import type { ProductId } from '@/lib/products/kpis'
import type { HubProduct } from '@/lib/auth/roles'

const PRODUCTS: ProductId[] = ['boost', 'padel1', 'sportsevents']

function toHubProduct(product: ProductId): HubProduct {
  return product
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ product: string }> }
) {
  const { product: raw } = await context.params
  if (!PRODUCTS.includes(raw as ProductId)) {
    return NextResponse.json(
      { error: 'Produto inválido', gaps: PRODUCT_GAPS },
      { status: 400 }
    )
  }

  const product = raw as ProductId
  const auth = await requireHubAccess(toHubProduct(product))
  if (auth.error || !auth.user) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  if (auth.isBootstrap || !auth.staff) {
    return NextResponse.json(
      {
        error:
          'Bootstrap: cria hub_staff antes de usar o bridge. A abrir deep-link.',
        gaps: PRODUCT_GAPS,
      },
      { status: 403 }
    )
  }

  const result = await resolveBridge(product, auth.staff)

  if (result.mode === 'error') {
    return NextResponse.json(
      { error: result.error, gaps: PRODUCT_GAPS },
      { status: result.status }
    )
  }

  // Redirect directo para magic link ou deep-link
  const response = NextResponse.redirect(result.redirectUrl)
  response.headers.set('x-padel-hub-bridge-mode', result.mode)
  return response
}
