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
  { href: '/produtos/boost/saas', label: 'SaaS Tour' },
]

export function BoostModuleNav() {
  const pathname = usePathname()

  return (
    <nav className="flex gap-1 overflow-x-auto border-b border-zinc-200 pb-px">
      {TABS.map((tab) => {
        const active = tab.exact
          ? pathname === tab.href
          : pathname === tab.href || pathname.startsWith(`${tab.href}/`)
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              'shrink-0 rounded-t-lg px-3 py-2 text-sm font-semibold transition',
              active
                ? 'bg-white text-sky-700 shadow-[inset_0_-2px_0_0_rgb(14_165_233)]'
                : 'text-zinc-500 hover:bg-white/70 hover:text-zinc-800'
            )}
          >
            {tab.label}
          </Link>
        )
      })}
    </nav>
  )
}
