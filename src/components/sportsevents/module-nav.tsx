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
  { href: '/produtos/sportsevents/blog', label: 'Blog SEO' },
  { href: '/produtos/sportsevents/social', label: 'Redes sociais' },
  { href: '/produtos/sportsevents/rentabilidade', label: 'ROI Torneios' },
  { href: '/produtos/sportsevents/simulador', label: 'Simulador' },
  { href: '/produtos/sportsevents/cartoes', label: 'Cartões' },
  { href: '/produtos/sportsevents/definicoes', label: 'Definições' },
]

export function SportsEventsModuleNav() {
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
                ? 'bg-white text-amber-800 shadow-[inset_0_-2px_0_0_rgb(180_83_9)]'
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
