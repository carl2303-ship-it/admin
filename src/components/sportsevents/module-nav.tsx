'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const TABS: { href: string; label: string; exact?: boolean }[] = [
  { href: '/produtos/sportsevents', label: 'Calendário', exact: true },
  { href: '/produtos/sportsevents/pipeline', label: 'Pipeline CRM' },
  { href: '/produtos/sportsevents/pacotes', label: 'Pacotes' },
  { href: '/produtos/sportsevents/eventos', label: 'Eventos' },
  { href: '/produtos/sportsevents/parceiros', label: 'Parceiros' },
  { href: '/produtos/sportsevents/cartoes', label: 'Cartões' },
  { href: '/produtos/sportsevents/definicoes', label: 'Definições' },
]

export function SportsEventsModuleNav() {
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
        href="/simulacoes"
        className="shrink-0 border-b-2 border-transparent px-3 py-3 text-sm font-semibold text-slate-500 transition hover:border-amber-400/50 hover:text-amber-400"
      >
        Simulações →
      </Link>
      <Link
        href="/metricas/se"
        className="shrink-0 border-b-2 border-transparent px-3 py-3 text-sm font-semibold text-slate-500 transition hover:border-cyan-400/50 hover:text-cyan-400"
      >
        Métricas →
      </Link>
      <Link
        href="/conteudo"
        className="shrink-0 border-b-2 border-transparent px-3 py-3 text-sm font-semibold text-slate-500 transition hover:border-amber-400/50 hover:text-amber-400"
      >
        Conteúdo & Social →
      </Link>
    </nav>
  )
}
