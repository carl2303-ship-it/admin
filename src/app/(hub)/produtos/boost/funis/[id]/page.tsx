import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import {
  requireBoostModule,
  canWriteBoost,
  canWriteBoostContent,
  staffRole,
} from '@/lib/boost/auth'
import { getEbookFunnel } from '@/lib/boost/queries'
import { FunnelEditForm } from '@/components/boost/funnel-forms'
import { FunnelAssetUploader } from '@/components/boost/funnel-assets'
import { FunnelAiLanding } from '@/components/boost/funnel-ai-landing'
import { PublishFunnelToStoreButton } from '@/components/boost/funnel-store-actions'
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
} from '@/components/boost/ui'

export default async function BoostEbookFunnelDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const auth = await requireBoostModule()
  if (!auth.user) redirect('/login')
  if (auth.error && !auth.isBootstrap) {
    return <ErrorBanner message={auth.error} />
  }

  const role = staffRole(auth.staff, auth.isBootstrap)
  const write = canWriteBoost(role)
  const writeContent = canWriteBoostContent(role)

  const result = await getEbookFunnel(id)
  if (!result.ok && result.missingConfig) {
    return <ConfigBanner message={result.error} />
  }
  if (!result.ok) return <ErrorBanner message={result.error} />
  if (!result.data) notFound()

  const { funnel, assets } = result.data
  const languages = funnel.languages?.length ? funnel.languages : ['pt']
  const dynamic = funnelPublicUrls(funnel.slug)
  const isLegacy = funnel.slug === LEGACY_PADEL_IQ.slug
  const legacy = isLegacy ? legacyPadelIqUrls() : null
  const storeCta = isLegacy ? legacy!.landing : dynamic.landing
  const storeDigital = `${storeBaseUrl()}/digital.html`

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link
            href="/produtos/boost/funis"
            className="text-sm font-semibold text-sky-700 hover:underline"
          >
            ← Funis Ebook
          </Link>
          <h2 className="mt-1 font-[family-name:var(--font-display)] text-xl font-bold">
            {funnel.title}
          </h2>
          <p className="mt-1 text-sm text-zinc-500">
            Slug <code className="rounded bg-zinc-100 px-1">{funnel.slug}</code>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <StatusPill
            active={funnel.status === 'active'}
            activeLabel="Activo"
            inactiveLabel={
              funnel.status === 'archived' ? 'Arquivado' : 'Rascunho'
            }
          />
          {write ? <PublishFunnelToStoreButton funnelId={funnel.id} /> : null}
        </div>
      </div>

      <Panel className="space-y-2 p-4 text-sm">
        <p className="font-bold text-zinc-800">Chaves Stripe (productType)</p>
        <p>
          Ebook:{' '}
          <code className="rounded bg-emerald-50 px-1.5 py-0.5 text-emerald-900">
            {funnel.ebook_product_type}
          </code>{' '}
          — configurado ✓ (price_data dinâmico, sem Price ID no Dashboard)
        </p>
        <p>
          Upsell:{' '}
          <code className="rounded bg-emerald-50 px-1.5 py-0.5 text-emerald-900">
            {funnel.upsell_product_type}
          </code>
        </p>

        <p className="pt-2 font-bold text-zinc-800">URLs públicas (dinâmicas)</p>
        <ul className="list-inside list-disc space-y-1 text-sky-800">
          <li>
            <a
              href={dynamic.landing}
              target="_blank"
              rel="noreferrer"
              className="underline"
            >
              Landing — {dynamic.landing}
            </a>
          </li>
          <li>
            <a
              href={dynamic.upsell}
              target="_blank"
              rel="noreferrer"
              className="underline"
            >
              Upsell OTO — {dynamic.upsell}
            </a>
          </li>
          <li>
            <a
              href={dynamic.thankYou}
              target="_blank"
              rel="noreferrer"
              className="underline"
            >
              Thank-you — {dynamic.thankYou}
            </a>
          </li>
        </ul>

        {legacy ? (
          <>
            <p className="pt-2 font-bold text-zinc-800">
              URLs legado (landing rica HTML estático)
            </p>
            <ul className="list-inside list-disc space-y-1 text-sky-800">
              <li>
                <a
                  href={legacy.landing}
                  target="_blank"
                  rel="noreferrer"
                  className="underline"
                >
                  Landing — {legacy.landing}
                </a>
              </li>
              <li>
                <a
                  href={legacy.upsell}
                  target="_blank"
                  rel="noreferrer"
                  className="underline"
                >
                  Upsell — {legacy.upsell}
                </a>
              </li>
              <li>
                <a
                  href={legacy.thankYou}
                  target="_blank"
                  rel="noreferrer"
                  className="underline"
                >
                  Thank-you — {legacy.thankYou}
                </a>
              </li>
              <li>
                <a
                  href={legacy.upsellThankYou}
                  target="_blank"
                  rel="noreferrer"
                  className="underline"
                >
                  Thank-you upsell — {legacy.upsellThankYou}
                </a>
              </li>
            </ul>
          </>
        ) : null}

        <p className="pt-2 font-bold text-zinc-800">Loja Boost</p>
        <ul className="list-inside list-disc space-y-1 text-emerald-800">
          <li>
            Grelha digitais:{' '}
            <a
              href={storeDigital}
              target="_blank"
              rel="noreferrer"
              className="underline"
            >
              {storeDigital}
            </a>
          </li>
          <li>
            CTA «Saber mais» →{' '}
            <a
              href={storeCta}
              target="_blank"
              rel="noreferrer"
              className="underline"
            >
              {storeCta}
            </a>
          </li>
        </ul>

        {funnel.status !== 'active' ? (
          <p className="mt-2 text-amber-800">
            O funil está em <strong>{funnel.status}</strong>. A landing dinâmica
            só lê funis <strong>active</strong> — activa no formulário abaixo.
          </p>
        ) : null}
      </Panel>

      {write ? (
        <FunnelAiLanding funnel={funnel} canWrite={writeContent || write} />
      ) : null}

      {write ? <FunnelEditForm funnel={funnel} /> : null}

      <div>
        <h3 className="mb-3 font-[family-name:var(--font-display)] text-lg font-bold">
          Uploads por idioma (bucket ebook-materials)
        </h3>
        <div className="grid gap-4 lg:grid-cols-2">
          {languages.map((lang) => (
            <FunnelAssetUploader
              key={lang}
              funnelId={funnel.id}
              language={lang}
              assets={assets.filter((a) => a.language === lang)}
              canWrite={writeContent}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
