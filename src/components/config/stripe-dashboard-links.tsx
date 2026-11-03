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
          <p className="mt-1 text-sm text-slate-400">{ctx.blurb}</p>
        </div>
        {ctx.hubOpsHref && (
          <a
            href="https://dashboard.stripe.com"
            target="_blank"
            rel="noreferrer"
            className={btnGhost}
          >
            Abrir Stripe
          </a>
        )}
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {links.map((link) => (
          <a
            key={link.id}
            href={link.href}
            target="_blank"
            rel="noreferrer"
            className="rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 transition hover:border-cyan-500/40"
          >
            <p className="text-sm font-semibold text-white">{link.label}</p>
            <p className="mt-0.5 text-[11px] text-slate-400">{link.description}</p>
          </a>
        ))}
      </div>
    </Panel>
  )
}

export function AllStripeDashboardShortcuts() {
  return (
    <Panel className="p-5">
      <h3 className="font-[family-name:var(--font-display)] text-lg font-bold">
        Stripe — contas
      </h3>
      <p className="mt-1 text-sm text-slate-400">
        Cada produto tem a sua conta. Abre o dashboard ou actualiza as chaves na
        secção certa.
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {PRODUCT_STRIPE_CONTEXTS.map((ctx) => (
          <div
            key={ctx.product}
            className="rounded-xl border border-slate-800 bg-slate-900 p-3"
          >
            <p className="text-sm font-bold text-white">{ctx.title}</p>
            <p className="mt-1 text-[11px] text-slate-400">{ctx.blurb}</p>
            <div className="mt-3 flex flex-wrap gap-3">
              <a
                href="https://dashboard.stripe.com"
                target="_blank"
                rel="noreferrer"
                className="text-xs font-semibold text-cyan-400 hover:underline"
              >
                Abrir Stripe
              </a>
              {ctx.hubOpsHref && (
                <Link
                  href={ctx.hubOpsHref}
                  className="text-xs font-semibold text-cyan-400 hover:underline"
                >
                  Actualizar chaves
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>
    </Panel>
  )
}
