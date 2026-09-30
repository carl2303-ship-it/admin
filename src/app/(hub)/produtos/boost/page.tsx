import Link from 'next/link'
import { redirect } from 'next/navigation'
import { requireBoostModule, canWriteBoost, staffRole } from '@/lib/boost/auth'
import { boostModuleCounts } from '@/lib/boost/queries'
import { ConfigBanner, ErrorBanner, Panel } from '@/components/boost/ui'
import {
  Package,
  ShoppingBag,
  Percent,
  KeyRound,
  BookOpen,
  CalendarDays,
  Mail,
  Download,
  CreditCard,
  BarChart3,
} from 'lucide-react'

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
  {
    href: '/produtos/boost/blog',
    label: 'Blog',
    key: 'blog' as const,
    icon: BookOpen,
  },
  {
    href: '/produtos/boost/estagios',
    label: 'Estágios',
    key: 'stages' as const,
    icon: CalendarDays,
  },
  {
    href: '/produtos/boost/newsletter',
    label: 'Newsletter',
    key: 'newsletter' as const,
    icon: Mail,
  },
  {
    href: '/produtos/boost/ebook-leads',
    label: 'Leads Ebook',
    key: 'ebookLeads' as const,
    icon: Download,
  },
  {
    href: '/produtos/boost/ebook-compras',
    label: 'Compras Ebook',
    key: 'ebookPurchases' as const,
    icon: CreditCard,
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
            : ' · leitura / conteúdo conforme role'}
        </p>
        <div className="flex flex-wrap gap-3 text-xs font-semibold">
          <Link
            href="/produtos/boost/analytics"
            className="inline-flex items-center gap-1 text-sky-700 hover:underline"
          >
            <BarChart3 className="h-3.5 w-3.5" /> Analytics
          </Link>
          <Link href="/produtos/boost/stripe" className="text-sky-700 hover:underline">
            Stripe
          </Link>
          <Link href="/produtos/boost/contas" className="text-sky-700 hover:underline">
            Contas
          </Link>
          <Link href="/equipa" className="text-sky-700 hover:underline">
            Equipa hub
          </Link>
          <Link
            href="/produtos/boost/categorias"
            className="text-sky-700 hover:underline"
          >
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
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
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
        <p className="font-semibold text-zinc-900">Paridade total (meta)</p>
        <p className="mt-1">
          Todas as tabs do <code>admin.html</code> estão no hub. Gaps residuais:
          editor Quill + upload Storage multi-ficheiro, preview email digital,
          gráfico de categorias (depende de <code>orders.items</code>). Ver{' '}
          <code>docs/paridade-boost-admin.md</code> no Project store.
        </p>
      </Panel>
    </div>
  )
}
