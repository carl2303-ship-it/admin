'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const TABS: { href: string; label: string; exact?: boolean }[] = [
  { href: '/metricas', label: 'Visão geral', exact: true },
  { href: '/metricas/boost', label: 'Boost Store' },
  { href: '/metricas/padel1', label: 'Padel One' },
  { href: '/metricas/se', label: 'SportsEvents' },
]

export function MetricasNav() {
  const pathname = usePathname()

  return (
    <nav className="hub-scroll-x pb-px">
      {TABS.map((tab) => {
        const active = tab.exact
          ? pathname === tab.href
          : pathname === tab.href || pathname.startsWith(`${tab.href}/`)
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              'inline-flex min-h-11 shrink-0 items-center border-b-2 px-3 text-sm font-semibold transition',
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
