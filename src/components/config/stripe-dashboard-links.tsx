import Link from 'next/link'
import { Panel, btnGhost } from '@/components/boost/ui'
import {
  getStripeDashboardLinks,
  PRODUCT_STRIPE_CONTEXTS,
  type ProductStripeContext,
} from '@/lib/config/stripe-dashboards'

export function StripeDashboardLinks({
  product,
  testMode = false,
}: {
  product: ProductStripeContext['product']
  testMode?: boolean
}) {
  const ctx = PRODUCT_STRIPE_CONTEXTS.find((c) => c.product === product)
  const links = getStripeDashboardLinks({ testMode })
  if (!ctx) return null

  return (
    <Panel className="p-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="font-[family-name:var(--font-display)] text-lg font-bold">
            {ctx.title}
          </h3>
          <p className="mt-1 text-sm text-zinc-600">{ctx.blurb}</p>
          <p className="mt-2 text-xs text-zinc-500">
            Secrets vivem em: <strong>{ctx.secretsLiveIn}</strong>
          </p>
        </div>
        {ctx.hubOpsHref && (
          <Link href={ctx.hubOpsHref} className={btnGhost}>
            Ops no hub
          </Link>
        )}
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {links.map((link) => (
          <a
            key={link.id}
            href={link.href}
            target="_blank"
            rel="noreferrer"
            className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 transition hover:border-sky-300 hover:bg-sky-50"
          >
            <p className="text-sm font-semibold text-zinc-900">{link.label}</p>
            <p className="mt-0.5 text-[11px] text-zinc-500">{link.description}</p>
          </a>
        ))}
      </div>

      <p className="mt-3 text-[11px] text-zinc-400">
        Links abrem dashboard.stripe.com
        {testMode ? ' (modo test)' : ' (modo live)'}. Garante que estás na conta
        Stripe correcta do produto.
      </p>
    </Panel>
  )
}

export function AllStripeDashboardShortcuts() {
  return (
    <Panel className="p-5">
      <h3 className="font-[family-name:var(--font-display)] text-lg font-bold">
        Stripe Dashboard (por produto)
      </h3>
      <p className="mt-1 text-sm text-zinc-600">
        Atalhos para configurar sem sair do fluxo do hub. Cada produto pode ter
        conta Stripe própria.
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {PRODUCT_STRIPE_CONTEXTS.map((ctx) => (
          <div
            key={ctx.product}
            className="rounded-xl border border-zinc-200 bg-zinc-50 p-3"
          >
            <p className="text-sm font-bold text-zinc-900">{ctx.title}</p>
            <p className="mt-1 text-[11px] text-zinc-500">{ctx.blurb}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <a
                href="https://dashboard.stripe.com"
                target="_blank"
                rel="noreferrer"
                className="text-xs font-semibold text-sky-700 hover:underline"
              >
                Abrir Stripe
              </a>
              {ctx.hubOpsHref && (
                <Link
                  href={`/configuracao/${ctx.product}`}
                  className="text-xs font-semibold text-sky-700 hover:underline"
                >
                  Config {ctx.product}
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>
    </Panel>
  )
}
