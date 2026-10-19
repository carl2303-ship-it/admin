'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const TABS: { href: string; label: string; exact?: boolean }[] = [
  { href: '/produtos/boost', label: 'Visão geral', exact: true },
  { href: '/produtos/boost/produtos', label: 'Produtos' },
  { href: '/produtos/boost/pedidos', label: 'Pedidos' },
  { href: '/produtos/boost/categorias', label: 'Categorias' },
  { href: '/produtos/boost/marcas', label: 'Marcas' },
  { href: '/produtos/boost/descontos', label: 'Descontos' },
  { href: '/produtos/boost/ebook-leads', label: 'Leads Ebook' },
  { href: '/produtos/boost/ebook-compras', label: 'Compras Ebook' },
  { href: '/produtos/boost/funis', label: 'Funis Ebook' },
  { href: '/produtos/boost/analytics', label: 'Analytics' },
  { href: '/produtos/boost/saas', label: 'SaaS Tour' },
  { href: '/produtos/boost/stripe', label: 'Stripe' },
  { href: '/produtos/boost/contas', label: 'Contas' },
]

export function BoostModuleNav() {
  const pathname = usePathname()

  return (
    <nav className="flex gap-1 overflow-x-auto pb-px">
      {TABS.map((tab) => {
        const active = tab.exact
          ? pathname === tab.href
          : pathname === tab.href || pathname.startsWith(`${tab.href}/`)
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              'shrink-0 px-3 py-3 text-sm font-semibold transition border-b-2',
              active
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-slate-500 hover:text-amber-400'
            )}
          >
            {tab.label}
          </Link>
        )
      })}
      <Link
        href="/conteudo"
        className="shrink-0 border-b-2 border-transparent px-3 py-3 text-sm font-semibold text-slate-500 transition hover:border-amber-400/50 hover:text-amber-400"
      >
        Conteúdo & Social →
      </Link>
    </nav>
  )
}
