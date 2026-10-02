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
import {
  ConfigBanner,
  ErrorBanner,
  Panel,
  StatusPill,
} from '@/components/boost/ui'

const STORE_BASE =
  process.env.NEXT_PUBLIC_BOOST_STORE_URL?.replace(/\/$/, '') ||
  'https://boostpadel.store'

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
  const publicUrl = `${STORE_BASE}/funnel.html?slug=${encodeURIComponent(funnel.slug)}`
  const upsellUrl = `${STORE_BASE}/funnel-upsell.html?slug=${encodeURIComponent(funnel.slug)}`
  const thankYouUrl = `${STORE_BASE}/funnel-thank-you.html?slug=${encodeURIComponent(funnel.slug)}`

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
        <StatusPill
          active={funnel.status === 'active'}
          activeLabel="Activo"
          inactiveLabel={funnel.status === 'archived' ? 'Arquivado' : 'Rascunho'}
        />
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
        <p className="pt-2 font-bold text-zinc-800">URLs públicas</p>
        <ul className="list-inside list-disc space-y-1 text-sky-800">
          <li>
            <a href={publicUrl} target="_blank" rel="noreferrer" className="underline">
              Landing
            </a>
          </li>
          <li>
            <a href={upsellUrl} target="_blank" rel="noreferrer" className="underline">
              Upsell OTO
            </a>
          </li>
          <li>
            <a
              href={thankYouUrl}
              target="_blank"
              rel="noreferrer"
              className="underline"
            >
              Thank-you
            </a>
          </li>
        </ul>
        {funnel.status !== 'active' ? (
          <p className="mt-2 text-amber-800">
            O funil está em <strong>{funnel.status}</strong>. A landing pública
            só lê funis <strong>active</strong> — activa no formulário abaixo.
          </p>
        ) : null}
      </Panel>

      {write ? <FunnelEditForm funnel={funnel} /> : null}

      <FunnelAiLanding funnel={funnel} canWrite={writeContent} />

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
