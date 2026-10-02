import Link from 'next/link'
import { redirect } from 'next/navigation'
import { requireBoostModule, canWriteBoost, staffRole } from '@/lib/boost/auth'
import { listEbookFunnels } from '@/lib/boost/queries'
import { FunnelCreateForm } from '@/components/boost/funnel-forms'
import { ImportLegacyPadelIqButton } from '@/components/boost/funnel-store-actions'
import {
  LEGACY_PADEL_IQ,
  funnelPublicUrls,
  legacyPadelIqUrls,
  storeBaseUrl,
} from '@/lib/boost/legacy-padel-iq'
import {
  ConfigBanner,
  ErrorBanner,
  Panel,
  StatusPill,
  TableShell,
  Th,
  Td,
} from '@/components/boost/ui'

const STORE_BASE = storeBaseUrl()

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
              <code>20261002120000_ebook_funnels.sql</code>,{' '}
              <code>20261002180000_ebook_funnel_generic_assets_ai.sql</code> e{' '}
              <code>20261002190000_ebook_funnel_store_and_padel_iq_seed.sql</code>{' '}
              no SQL Editor do projecto Boost. Depois recarrega esta página.
            </p>
          </Panel>
        ) : null}
      </div>
    )
  }

  const funnels = result.data
  const hasLegacy = funnels.some((f) => f.slug === LEGACY_PADEL_IQ.slug)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
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
        {write && !hasLegacy ? (
          <div className="space-y-1 text-right">
            <ImportLegacyPadelIqButton />
            <p className="text-xs text-zinc-500">
              Importa PADEL IQ PRO (PT) + liga à loja
            </p>
          </div>
        ) : null}
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
              <Th>Links</Th>
              <Th>Estado</Th>
              <Th></Th>
            </tr>
          </thead>
          <tbody>
            {funnels.length === 0 ? (
              <tr>
                <Td colSpan={7} className="text-zinc-500">
                  Ainda sem funis. Cria o primeiro acima
                  {write ? ' ou importa o legado PADEL IQ PRO' : ''}.
                </Td>
              </tr>
            ) : (
              funnels.map((f) => {
                const urls = funnelPublicUrls(f.slug)
                const isLegacy = f.slug === LEGACY_PADEL_IQ.slug
                const storeCta = isLegacy
                  ? legacyPadelIqUrls().landing
                  : urls.landing
                return (
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
                      <div className="flex flex-col gap-0.5 text-xs">
                        <a
                          href={
                            isLegacy ? legacyPadelIqUrls().landing : urls.landing
                          }
                          target="_blank"
                          rel="noreferrer"
                          className="text-sky-700 hover:underline"
                        >
                          Landing
                        </a>
                        <a
                          href={
                            isLegacy ? legacyPadelIqUrls().upsell : urls.upsell
                          }
                          target="_blank"
                          rel="noreferrer"
                          className="text-sky-700 hover:underline"
                        >
                          Upsell
                        </a>
                        <a
                          href={
                            isLegacy
                              ? legacyPadelIqUrls().thankYou
                              : urls.thankYou
                          }
                          target="_blank"
                          rel="noreferrer"
                          className="text-sky-700 hover:underline"
                        >
                          Thank-you
                        </a>
                        <a
                          href={storeCta}
                          target="_blank"
                          rel="noreferrer"
                          className="text-emerald-700 hover:underline"
                        >
                          Loja «Saber mais»
                        </a>
                      </div>
                    </Td>
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
                )
              })
            )}
          </tbody>
        </TableShell>
      </Panel>
    </div>
  )
}
