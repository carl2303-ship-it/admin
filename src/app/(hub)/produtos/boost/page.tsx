import Link from 'next/link'
import { redirect } from 'next/navigation'
import { requireBoostModule, canWriteBoost, staffRole } from '@/lib/boost/auth'
import { boostModuleCounts } from '@/lib/boost/queries'
import { ConfigBanner, ErrorBanner, Panel } from '@/components/boost/ui'
import { Package, ShoppingBag, Percent, KeyRound } from 'lucide-react'

const LINKS = [
  {
    href: '/produtos/boost/produtos',
    label: 'Produtos',
    key: 'products' as const,
    icon: Package,
  },
  {
    href: '/produtos/boost/pedidos',
    label: 'Pedidos',
    key: 'orders' as const,
    icon: ShoppingBag,
  },
  {
    href: '/produtos/boost/descontos',
    label: 'Descontos',
    key: 'discounts' as const,
    icon: Percent,
  },
  {
    href: '/produtos/boost/saas',
    label: 'SaaS Tour',
    key: 'saas' as const,
    icon: KeyRound,
  },
]

export default async function BoostOverviewPage() {
  const auth = await requireBoostModule()
  if (!auth.user) redirect('/login')
  if (auth.error && !auth.isBootstrap) {
    return <ErrorBanner message={auth.error} />
  }

  const role = staffRole(auth.staff, auth.isBootstrap)
  const counts = await boostModuleCounts()

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-zinc-500">
        <p>
          Acesso:{' '}
          <span className="font-semibold text-zinc-800">{role}</span>
          {canWriteBoost(role)
            ? ' · escrita loja/SaaS'
            : ' · só leitura neste módulo'}
        </p>
        <div className="flex gap-3 text-xs font-semibold">
          <Link href="/produtos/boost/categorias" className="text-sky-700 hover:underline">
            Categorias
          </Link>
          <Link href="/produtos/boost/marcas" className="text-sky-700 hover:underline">
            Marcas
          </Link>
        </div>
      </div>

      {!counts.ok && counts.missingConfig && (
        <ConfigBanner message={counts.error} />
      )}
      {!counts.ok && !counts.missingConfig && (
        <ErrorBanner message={counts.error} />
      )}

      {counts.ok && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {LINKS.map((item) => {
            const Icon = item.icon
            return (
              <Link key={item.href} href={item.href}>
                <Panel className="p-4 transition hover:border-sky-300 hover:shadow-md">
                  <div className="flex items-center justify-between">
                    <Icon className="h-5 w-5 text-sky-600" />
                    <span className="font-[family-name:var(--font-display)] text-2xl font-bold">
                      {counts.data[item.key]}
                    </span>
                  </div>
                  <p className="mt-2 text-sm font-semibold text-zinc-700">
                    {item.label}
                  </p>
                </Panel>
              </Link>
            )
          })}
        </div>
      )}

      <Panel className="p-5 text-sm text-zinc-600">
        <p className="font-semibold text-zinc-900">Migrado neste MVP</p>
        <ul className="mt-2 list-inside list-disc space-y-1">
          <li>Produtos (CRUD essencial + quick price/stock/destaque)</li>
          <li>Pedidos (lista + status + delete)</li>
          <li>Categorias e marcas</li>
          <li>Códigos de desconto</li>
          <li>
            Licenças SaaS Tour (<code>source=boost</code>) + provision / Stripe
            via Edge Functions
          </li>
        </ul>
        <p className="mt-3 font-semibold text-zinc-900">Ainda no legacy</p>
        <p className="mt-1">
          Blog, estágios, newsletter, ebook leads/compras, analytics, upload
          imagens Quill/Storage avançado.
        </p>
      </Panel>
    </div>
  )
}
