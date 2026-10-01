import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ConfigSectionNav, IntegrationTable } from '@/components/config/config-ui'
import { BoostStripeSecretsForm } from '@/components/config/boost-stripe-form'
import {
  listConfigIntents,
  requireConfigOwner,
} from '@/lib/config/queries'
import { getBoostConfigStatus } from '@/lib/config/status'
import { listBoostEdgeSecretNames } from '@/lib/config/management-api'
import { resolveConfigIntent } from '@/lib/config/actions'
import {
  ErrorBanner,
  Panel,
  StatusPill,
  TableShell,
  Th,
  Td,
  btnGhost,
  btnPrimary,
} from '@/components/boost/ui'

export default async function ConfigBoostPage() {
  const gate = await requireConfigOwner()
  if (!gate.user) redirect('/login')
  if (!gate.allowed) return <ErrorBanner message={gate.error || 'Sem permissão'} />

  const status = getBoostConfigStatus()
  const edge = await listBoostEdgeSecretNames()
  const intents = await listConfigIntents('boost')

  return (
    <div className="mx-auto max-w-5xl space-y-5 animate-fade-up">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-sky-600">
          Configuração · Boost
        </p>
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight">
          Boost Store
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-zinc-500">
          Estado das env do hub para Boost + rotação Stripe nas Edge Functions.
          Ops do dia-a-dia (subs, links) em{' '}
          <Link
            href="/produtos/boost/stripe"
            className="font-semibold text-sky-700 hover:underline"
          >
            /produtos/boost/stripe
          </Link>
          .
        </p>
      </div>

      <ConfigSectionNav active="boost" />

      <Panel className="p-5 text-sm text-zinc-600">
        <p className="font-semibold text-zinc-900">Modelo actual</p>
        <ul className="mt-2 list-inside list-disc space-y-1 text-xs">
          <li>
            <code>STRIPE_SECRET_KEY</code> / webhook vivem nos{' '}
            <strong>Edge secrets</strong> do Supabase Boost — não no Netlify do
            admin.
          </li>
          <li>
            O hub usa <code>BOOST_*</code> + JWT Edge para{' '}
            <em>invocar</em> <code>stripe-checkout</code> etc.
          </li>
          <li>
            Service role Boost ≠ Management API: sem PAT não há write live de
            secrets.
          </li>
        </ul>
      </Panel>

      <IntegrationTable items={status.integrations} />

      <BoostStripeSecretsForm
        managementConfigured={edge.managementConfigured}
        stripeSecretPresent={
          edge.managementConfigured && !edge.error
            ? edge.stripeSecretPresent
            : null
        }
        stripeWebhookPresent={
          edge.managementConfigured && !edge.error
            ? edge.stripeWebhookPresent
            : null
        }
        edgeSecretsError={
          edge.managementConfigured ? edge.error : undefined
        }
      />

      <Panel>
        <div className="border-b border-zinc-100 px-4 py-3 font-bold">
          Intents de config (sem valores de secrets)
        </div>
        {!intents.ok ? (
          <div className="p-4">
            <ErrorBanner message={intents.error} />
          </div>
        ) : (
          <TableShell>
            <thead>
              <tr>
                <Th>Secret</Th>
                <Th>Estado</Th>
                <Th>Nota</Th>
                <Th>Criado</Th>
                <Th>Acção</Th>
              </tr>
            </thead>
            <tbody>
              {intents.data.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-8 text-center text-zinc-500"
                  >
                    Sem intents
                  </td>
                </tr>
              )}
              {intents.data.map((row) => (
                <tr key={row.id}>
                  <Td className="font-mono text-xs">{row.secret_name}</Td>
                  <Td>
                    <StatusPill
                      active={row.status === 'applied'}
                      activeLabel="applied"
                      inactiveLabel={row.status}
                    />
                  </Td>
                  <Td className="max-w-[14rem] truncate text-xs text-zinc-500">
                    {row.note || '—'}
                  </Td>
                  <Td className="text-xs">
                    {new Date(row.created_at).toLocaleString('pt-PT')}
                  </Td>
                  <Td>
                    {row.status === 'pending' ? (
                      <div className="flex flex-wrap gap-1">
                        <form
                          action={async (fd) => {
                            'use server'
                            await resolveConfigIntent(fd)
                          }}
                        >
                          <input type="hidden" name="id" value={row.id} />
                          <input type="hidden" name="status" value="applied" />
                          <button type="submit" className={btnPrimary}>
                            Aplicado
                          </button>
                        </form>
                        <form
                          action={async (fd) => {
                            'use server'
                            await resolveConfigIntent(fd)
                          }}
                        >
                          <input type="hidden" name="id" value={row.id} />
                          <input type="hidden" name="status" value="cancelled" />
                          <button type="submit" className={btnGhost}>
                            Cancelar
                          </button>
                        </form>
                      </div>
                    ) : (
                      <span className="text-xs text-zinc-400">—</span>
                    )}
                  </Td>
                </tr>
              ))}
            </tbody>
          </TableShell>
        )}
      </Panel>
    </div>
  )
}
