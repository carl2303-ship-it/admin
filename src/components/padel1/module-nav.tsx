'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const TABS: { href: string; label: string; exact?: boolean }[] = [
  { href: '/produtos/padel1', label: 'Dashboard', exact: true },
  { href: '/produtos/padel1/clubes', label: 'Clubes' },
  { href: '/produtos/padel1/modulos', label: 'Módulos' },
  { href: '/produtos/padel1/packs', label: 'Packs' },
  { href: '/produtos/padel1/transacoes', label: 'Transações' },
  { href: '/produtos/padel1/metricas', label: 'Métricas' },
  { href: '/produtos/padel1/utilizadores', label: 'Utilizadores' },
  { href: '/produtos/padel1/configuracoes', label: 'Configurações' },
]

export function Padel1ModuleNav() {
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
    </nav>
  )
}
