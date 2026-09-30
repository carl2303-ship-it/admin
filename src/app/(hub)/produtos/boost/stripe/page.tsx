import Link from 'next/link'
import { redirect } from 'next/navigation'
import { requireBoostModule } from '@/lib/boost/auth'
import { getStripeVisibility } from '@/lib/boost/queries'
import {
  ConfigBanner,
  ErrorBanner,
  Panel,
  StatusPill,
  TableShell,
  Th,
  Td,
} from '@/components/boost/ui'

export default async function BoostStripePage() {
  const auth = await requireBoostModule()
  if (!auth.user) redirect('/login')
  if (auth.error && !auth.isBootstrap) {
    return <ErrorBanner message={auth.error} />
  }

  const result = await getStripeVisibility()
  if (!result.ok && result.missingConfig) {
    return <ConfigBanner message={result.error} />
  }
  if (!result.ok) return <ErrorBanner message={result.error} />

  const d = result.data

  return (
    <div className="space-y-4">
      <h2 className="font-[family-name:var(--font-display)] text-xl font-bold">
        Stripe · Boost
      </h2>
      <p className="text-sm text-zinc-500">
        O admin Boost antigo não tinha tab Stripe — usava Edge Functions. Aqui
        fica o estado visível no hub (subscrições SaaS + sessions ebook),
        reutilizando as mesmas EFs.
      </p>

      <div className="grid gap-3 sm:grid-cols-3">
        <Panel className="p-4">
          <p className="text-xs font-bold uppercase text-zinc-500">
            Edge invoke
          </p>
          <div className="mt-2">
            <StatusPill
              active={d.edgeConfigured}
              activeLabel="Credenciais Edge OK"
              inactiveLabel="Falta BOOST_EDGE_* / ANON"
            />
          </div>
        </Panel>
        <Panel className="p-4">
          <p className="text-xs font-bold uppercase text-zinc-500">
            Orgs com Stripe sub
          </p>
          <p className="mt-1 text-2xl font-bold">{d.withStripeSub}</p>
        </Panel>
        <Panel className="p-4">
          <p className="text-xs font-bold uppercase text-zinc-500">
            Orgs sem Stripe sub
          </p>
          <p className="mt-1 text-2xl font-bold">{d.withoutStripeSub}</p>
        </Panel>
      </div>

      <Panel className="p-5 text-sm text-zinc-600">
        <p className="font-semibold text-zinc-900">Edge Functions (reutilizar)</p>
        <ul className="mt-2 list-inside list-disc space-y-1">
          <li>
            <code>stripe-checkout</code> — loja, ebook, app-access, SaaS Tour
            (hub gera link em{' '}
            <Link href="/produtos/boost/saas" className="font-bold text-sky-700">
              SaaS Tour
            </Link>
            )
          </li>
          <li>
            <code>provision-saas-license</code> — contas Tour + credenciais
          </li>
          <li>
            Webhook Stripe (na EF) — marca pedidos, grava{' '}
            <code>ebook_purchases</code>, sync subs org
          </li>
          <li>
            <code>manage-saas-subscription</code> — self-service Tour (fora do
            admin)
          </li>
        </ul>
        <p className="mt-3 text-xs">
          Store:{' '}
          <a
            href={d.storeUrl}
            className="font-semibold text-sky-700 hover:underline"
            target="_blank"
            rel="noreferrer"
          >
            {d.storeUrl}
          </a>
          . Dashboard Stripe Dashboard continua a ser a fonte operacional de
          webhooks/logs (não reinventar).
        </p>
      </Panel>

      <Panel>
        <div className="border-b border-zinc-100 px-4 py-3 font-bold">
          Subscrições SaaS (organizations)
        </div>
        <TableShell>
          <thead>
            <tr>
              <Th>Org</Th>
              <Th>Plano</Th>
              <Th>Estado</Th>
              <Th>Stripe sub</Th>
              <Th>Cancel at period end</Th>
              <Th>Expira</Th>
            </tr>
          </thead>
          <tbody>
            {d.subscriptions.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-zinc-500">
                  Sem organizações
                </td>
              </tr>
            )}
            {d.subscriptions.map((o) => (
              <tr key={o.id}>
                <Td>
                  <p className="font-semibold">{o.name}</p>
                  <p className="text-xs text-zinc-400">{o.owner_email}</p>
                </Td>
                <Td>{o.plan_type}</Td>
                <Td>{o.status}</Td>
                <Td className="max-w-[10rem] truncate font-mono text-[10px]">
                  {o.stripe_subscription_id || '—'}
                </Td>
                <Td>{o.cancel_at_period_end ? 'sim' : 'não'}</Td>
                <Td className="text-xs">
                  {o.subscription_expires_at
                    ? new Date(o.subscription_expires_at).toLocaleDateString(
                        'pt-PT'
                      )
                    : '—'}
                </Td>
              </tr>
            ))}
          </tbody>
        </TableShell>
      </Panel>

      <Panel>
        <div className="border-b border-zinc-100 px-4 py-3 font-bold">
          Sessions ebook recentes
        </div>
        <TableShell>
          <thead>
            <tr>
              <Th>Cliente</Th>
              <Th>Tipo</Th>
              <Th>Valor</Th>
              <Th>Estado</Th>
              <Th>Session</Th>
            </tr>
          </thead>
          <tbody>
            {d.recentEbookSessions.map((p) => (
              <tr key={p.id}>
                <Td>
                  <p className="font-semibold">{p.customer_name || '—'}</p>
                  <p className="text-xs text-zinc-400">{p.customer_email}</p>
                </Td>
                <Td>{p.product_type}</Td>
                <Td>€{Number(p.amount || 0).toFixed(2)}</Td>
                <Td>{p.status}</Td>
                <Td className="max-w-[10rem] truncate font-mono text-[10px]">
                  {p.stripe_session_id || '—'}
                </Td>
              </tr>
            ))}
          </tbody>
        </TableShell>
      </Panel>
    </div>
  )
}
