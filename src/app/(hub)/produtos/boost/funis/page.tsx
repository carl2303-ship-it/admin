import Link from 'next/link'
import { redirect } from 'next/navigation'
import { requireBoostModule, canWriteBoost, staffRole } from '@/lib/boost/auth'
import { listEbookFunnels } from '@/lib/boost/queries'
import { FunnelCreateForm } from '@/components/boost/funnel-forms'
import {
  ConfigBanner,
  ErrorBanner,
  Panel,
  StatusPill,
  TableShell,
  Th,
  Td,
} from '@/components/boost/ui'

const STORE_BASE =
  process.env.NEXT_PUBLIC_BOOST_STORE_URL?.replace(/\/$/, '') ||
  'https://boostpadel.store'

export default async function BoostEbookFunnelsPage() {
  const auth = await requireBoostModule()
  if (!auth.user) redirect('/login')
  if (auth.error && !auth.isBootstrap) {
    return <ErrorBanner message={auth.error} />
  }
  const write = canWriteBoost(staffRole(auth.staff, auth.isBootstrap))
  const result = await listEbookFunnels()

  if (!result.ok && result.missingConfig) {
    return <ConfigBanner message={result.error} />
  }
  if (!result.ok) {
    const missingTable =
      /ebook_funnels|schema cache|does not exist|relation/i.test(result.error)
    return (
      <div className="space-y-4">
        <ErrorBanner message={result.error} />
        {missingTable ? (
          <Panel className="p-4 text-sm text-zinc-700">
            <p className="font-bold">Migration necessária no Supabase Boost</p>
            <p className="mt-1">
              Corre o SQL{' '}
              <code>20261002120000_ebook_funnels.sql</code> no SQL Editor do
              projecto Boost (ver docs do hub / pasta migrations). Depois
              recarrega esta página.
            </p>
          </Panel>
        ) : null}
      </div>
    )
  }

  const funnels = result.data

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-[family-name:var(--font-display)] text-xl font-bold">
          Funis Ebook
        </h2>
        <p className="mt-1 text-sm text-zinc-500">
          Cria landings + upsells sem clonar HTML. URLs públicas:
          <code className="ml-1 rounded bg-zinc-100 px-1 text-xs">
            {STORE_BASE}/funnel.html?slug=…
          </code>
        </p>
      </div>

      {write ? <FunnelCreateForm /> : null}

      <Panel>
        <TableShell>
          <thead>
            <tr>
              <Th>Funil</Th>
              <Th>Slug / Stripe</Th>
              <Th>Preços</Th>
              <Th>Idiomas</Th>
              <Th>Estado</Th>
              <Th></Th>
            </tr>
          </thead>
          <tbody>
            {funnels.length === 0 ? (
              <tr>
                <Td colSpan={6} className="text-zinc-500">
                  Ainda sem funis. Cria o primeiro acima.
                </Td>
              </tr>
            ) : (
              funnels.map((f) => (
                <tr key={f.id} className="border-t border-zinc-100">
                  <Td>
                    <p className="font-semibold">{f.title}</p>
                    <p className="text-xs text-zinc-500">{f.headline}</p>
                  </Td>
                  <Td>
                    <p className="font-mono text-xs">{f.slug}</p>
                    <p className="font-mono text-[11px] text-zinc-500">
                      {f.ebook_product_type} · {f.upsell_product_type}
                    </p>
                  </Td>
                  <Td>
                    €{(f.ebook_price_cents / 100).toFixed(2)} / €
                    {(f.upsell_price_cents / 100).toFixed(2)}
                  </Td>
                  <Td>{(f.languages || []).join(', ').toUpperCase()}</Td>
                  <Td>
                    <StatusPill
                      active={f.status === 'active'}
                      activeLabel="Activo"
                      inactiveLabel={
                        f.status === 'archived' ? 'Arquivado' : 'Rascunho'
                      }
                    />
                  </Td>
                  <Td>
                    <Link
                      href={`/produtos/boost/funis/${f.id}`}
                      className="text-sm font-semibold text-sky-700 hover:underline"
                    >
                      Gerir
                    </Link>
                  </Td>
                </tr>
              ))
            )}
          </tbody>
        </TableShell>
      </Panel>
    </div>
  )
}
