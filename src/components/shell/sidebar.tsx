'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Store,
  Building2,
  CalendarDays,
  Megaphone,
  Users,
  Settings,
  ExternalLink,
  LogOut,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { HubRole } from '@/lib/auth/roles'
import { roleCanAccess, roleLabel } from '@/lib/auth/roles'

type NavItem = {
  href: string
  label: string
  icon: typeof LayoutDashboard
  product: 'dashboard' | 'boost' | 'padel1' | 'sportsevents' | 'content'
  ownerOnly?: boolean
}

const NAV: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, product: 'dashboard' },
  { href: '/produtos/boost', label: 'Boost Store', icon: Store, product: 'boost' },
  { href: '/produtos/padel1', label: 'Padel One HQ', icon: Building2, product: 'padel1' },
  {
    href: '/produtos/sportsevents',
    label: 'SportsEvents',
    icon: CalendarDays,
    product: 'sportsevents',
  },
  { href: '/conteudo', label: 'Conteúdo & Social', icon: Megaphone, product: 'content' },
  {
    href: '/configuracao',
    label: 'Configuração',
    icon: Settings,
    product: 'dashboard',
    ownerOnly: true,
  },
  {
    href: '/equipa',
    label: 'Equipa',
    icon: Users,
    product: 'dashboard',
    ownerOnly: true,
  },
]

type Props = {
  staffName: string | null
  staffEmail: string
  role: HubRole | 'bootstrap'
}

export function Sidebar({ staffName, staffEmail, role }: Props) {
  const pathname = usePathname()
  const router = useRouter()

  async function logout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.replace('/login')
    router.refresh()
  }

  const visible = NAV.filter((item) => {
    if (role === 'bootstrap') return true
    if (item.ownerOnly && role !== 'owner') return false
    return roleCanAccess(role, item.product)
  })

  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r border-slate-800 bg-black text-slate-100">
      <div className="border-b border-slate-800 px-5 py-6">
        <p className="font-[family-name:var(--font-display)] text-xl font-bold tracking-tight">
          PADEL <span className="text-cyan-400">HUB</span>
        </p>
        <p className="mt-1 text-[11px] uppercase tracking-[0.18em] text-amber-400/80">
          admin.sportsevents.app
        </p>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {visible.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(`${item.href}/`)
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                active
                  ? 'bg-cyan-500/15 text-cyan-300'
                  : 'text-slate-400 hover:bg-slate-900 hover:text-slate-100'
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="border-t border-slate-800 px-4 py-4">
        <p className="truncate text-sm font-medium text-slate-200">
          {staffName || staffEmail}
        </p>
        <p className="mt-0.5 text-[11px] text-amber-400/70">
          {role === 'bootstrap' ? 'Bootstrap' : roleLabel(role)}
        </p>
        <button
          type="button"
          onClick={logout}
          className="mt-3 flex w-full items-center gap-2 rounded-lg px-2 py-2 text-xs text-slate-400 transition hover:bg-slate-900 hover:text-slate-100"
        >
          <LogOut className="h-3.5 w-3.5" />
          Terminar sessão
        </button>
        <a
          href="https://sportsevents.app"
          target="_blank"
          rel="noreferrer"
          className="mt-2 flex items-center gap-1.5 px-2 text-[10px] text-slate-600 hover:text-cyan-400"
        >
          sportsevents.app <ExternalLink className="h-3 w-3" />
        </a>
      </div>
    </aside>
  )
}
