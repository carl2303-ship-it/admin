'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const TABS: { href: string; label: string; exact?: boolean }[] = [
  { href: '/conteudo', label: 'Visão geral', exact: true },
  { href: '/conteudo/blog-se', label: 'Blog SportsEvents' },
  { href: '/conteudo/social', label: 'Redes & Meta' },
  { href: '/conteudo/blog-boost', label: 'Blog Boost' },
  { href: '/conteudo/newsletter', label: 'Newsletter Boost' },
]

export function ConteudoModuleNav() {
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
              'shrink-0 border-b-2 px-3 py-3 text-sm font-semibold transition',
              active
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-slate-500 hover:text-cyan-400'
            )}
          >
            {tab.label}
          </Link>
        )
      })}
    </nav>
  )
}
