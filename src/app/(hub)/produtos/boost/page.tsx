import Link from 'next/link'
import { redirect } from 'next/navigation'
import { requireBoostModule, canWriteBoost, staffRole } from '@/lib/boost/auth'
import { boostModuleCounts } from '@/lib/boost/queries'
import { ConfigBanner, ErrorBanner, Panel } from '@/components/boost/ui'
import {
  Package,
  ShoppingBag,
  Percent,
  BookOpen,
  Mail,
  Download,
  CreditCard,
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
    href: '/produtos/boost/blog',
    label: 'Blog',
    key: 'blog' as const,
    icon: BookOpen,
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
      <p className="text-sm text-slate-400">
        Acesso:{' '}
        <span className="font-semibold text-slate-200">{role}</span>
        {canWriteBoost(role) ? ' · escrita loja' : ' · leitura / conteúdo'}
      </p>

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
                <Panel className="p-4 transition hover:border-cyan-500/40">
                  <div className="flex items-center justify-between">
                    <Icon className="h-5 w-5 text-cyan-400" />
                    <span className="font-[family-name:var(--font-display)] text-2xl font-bold">
                      {counts.data[item.key]}
                    </span>
                  </div>
                  <p className="mt-2 text-sm font-semibold text-slate-300">
                    {item.label}
                  </p>
                </Panel>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
