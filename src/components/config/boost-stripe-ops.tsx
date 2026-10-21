import { getStripeVisibility } from '@/lib/boost/queries'
import { listSaasLicenses } from '@/lib/boost/queries'
import {
  ConfigBanner,
  ErrorBanner,
  Panel,
  StatusPill,
  TableShell,
  Th,
  Td,
} from '@/components/boost/ui'

/** Visibilidade Stripe + acessos Tour — vive em /configuracao/boost. */
export async function BoostStripeOpsSection() {
  const result = await getStripeVisibility()
  if (!result.ok && result.missingConfig) {
    return <ConfigBanner message={result.error} />
  }
  if (!result.ok) return <ErrorBanner message={result.error} />
  const d = result.data

  const contas = await listSaasLicenses()

  return (
    <div className="space-y-4">
      <h2 className="font-[family-name:var(--font-display)] text-lg font-bold">
        Stripe · ops Boost
      </h2>
      <div className="grid gap-3 sm:grid-cols-3">
        <Panel className="p-4">
          <p className="text-xs font-bold uppercase text-slate-400">Edge invoke</p>
          <div className="mt-2">
            <StatusPill
              active={d.edgeConfigured}
              activeLabel="Credenciais Edge OK"
              inactiveLabel="Falta BOOST_EDGE_* / ANON"
            />
          </div>
        </Panel>
        <Panel className="p-4">
          <p className="text-xs font-bold uppercase text-slate-400">
            Orgs com Stripe sub
          </p>
          <p className="mt-1 text-2xl font-bold">{d.withStripeSub}</p>
        </Panel>
        <Panel className="p-4">
          <p className="text-xs font-bold uppercase text-slate-400">
            Orgs sem Stripe sub
          </p>
          <p className="mt-1 text-2xl font-bold">{d.withoutStripeSub}</p>
        </Panel>
      </div>

      <Panel>
        <div className="border-b border-slate-800 px-4 py-3 font-bold">
          Subscrições SaaS (organizations)
        </div>
        <TableShell>
          <thead>
            <tr>
              <Th>Org</Th>
              <Th>Plano</Th>
              <Th>Estado</Th>
              <Th>Stripe sub</Th>
              <Th>Expira</Th>
            </tr>
          </thead>
          <tbody>
            {d.subscriptions.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                  Sem organizações
                </td>
              </tr>
            )}
            {d.subscriptions.map((o) => (
              <tr key={o.id}>
                <Td>
                  <p className="font-semibold">{o.name}</p>
                  <p className="text-xs text-slate-500">{o.owner_email}</p>
                </Td>
                <Td>{o.plan_type}</Td>
                <Td>{o.status}</Td>
                <Td className="max-w-[10rem] truncate font-mono text-[10px]">
                  {o.stripe_subscription_id || '—'}
                </Td>
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
        <div className="border-b border-slate-800 px-4 py-3 font-bold">
          Sessions ebook recentes
        </div>
        <TableShell>
          <thead>
            <tr>
              <Th>Cliente</Th>
              <Th>Tipo</Th>
              <Th>Valor</Th>
              <Th>Estado</Th>
            </tr>
          </thead>
          <tbody>
            {d.recentEbookSessions.map((p) => (
              <tr key={p.id}>
                <Td>
                  <p className="font-semibold">{p.customer_name || '—'}</p>
                  <p className="text-xs text-slate-500">{p.customer_email}</p>
                </Td>
                <Td>{p.product_type}</Td>
                <Td>€{Number(p.amount || 0).toFixed(2)}</Td>
                <Td>{p.status}</Td>
              </tr>
            ))}
          </tbody>
        </TableShell>
      </Panel>

      {contas.ok ? (
        <Panel>
          <div className="border-b border-slate-800 px-4 py-3 font-bold">
            Acessos Tour (owners)
          </div>
          <TableShell>
            <thead>
              <tr>
                <Th>Organização</Th>
                <Th>Owner email</Th>
                <Th>Plano</Th>
                <Th>Login Tour</Th>
              </tr>
            </thead>
            <tbody>
              {contas.data.map((o) => (
                <tr key={o.id}>
                  <Td className="font-semibold">{o.name}</Td>
                  <Td>{o.owner_email || '—'}</Td>
                  <Td>{o.plan_type}</Td>
                  <Td>
                    <StatusPill
                      active={Boolean(o.tour_user_id)}
                      activeLabel="Provisionado"
                      inactiveLabel="Sem login"
                    />
                  </Td>
                </tr>
              ))}
            </tbody>
          </TableShell>
        </Panel>
      ) : null}
    </div>
  )
}
