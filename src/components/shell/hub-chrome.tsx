'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { Menu } from 'lucide-react'
import { Sidebar } from '@/components/shell/sidebar'
import type { HubRole } from '@/lib/auth/roles'
import { cn } from '@/lib/utils'

type Props = {
  staffName: string | null
  staffEmail: string
  role: HubRole | 'bootstrap'
  children: React.ReactNode
}

/** Shell HQ: sidebar fixa no desktop; drawer hamburger no telemóvel. */
export function HubChrome({ staffName, staffEmail, role, children }: Props) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  useEffect(() => {
    setOpen(false)
  }, [pathname])

  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  return (
    <div className="flex min-h-dvh bg-black text-slate-100">
      {/* Desktop sidebar */}
      <div className="sticky top-0 hidden h-dvh shrink-0 md:block">
        <Sidebar staffName={staffName} staffEmail={staffEmail} role={role} />
      </div>

      {/* Mobile drawer */}
      <div
        className={cn(
          'fixed inset-0 z-50 md:hidden',
          open ? 'pointer-events-auto' : 'pointer-events-none'
        )}
        aria-hidden={!open}
      >
        <button
          type="button"
          className={cn(
            'absolute inset-0 bg-black/70 transition-opacity',
            open ? 'opacity-100' : 'opacity-0'
          )}
          aria-label="Fechar menu"
          onClick={() => setOpen(false)}
        />
        <aside
          className={cn(
            'absolute inset-y-0 left-0 w-[min(18rem,88vw)] transform transition-transform duration-200 ease-out',
            open ? 'translate-x-0' : '-translate-x-full'
          )}
        >
          <Sidebar
            staffName={staffName}
            staffEmail={staffEmail}
            role={role}
            onNavigate={() => setOpen(false)}
            className="h-full w-full shadow-2xl shadow-cyan-950/40"
          />
        </aside>
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 border-b border-slate-800 bg-black/95 px-3 py-2.5 backdrop-blur md:hidden">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg border border-slate-700 bg-slate-950 text-slate-200 hover:border-cyan-500/40 hover:text-cyan-300"
              aria-label="Abrir menu"
              aria-expanded={open}
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="min-w-0 flex-1">
              <p className="font-[family-name:var(--font-display)] text-base font-bold leading-tight tracking-tight">
                PADEL <span className="text-cyan-400">HUB</span>
              </p>
              <p className="truncate text-[10px] uppercase tracking-[0.16em] text-amber-400/80">
                {role === 'bootstrap' ? 'Bootstrap' : role}
              </p>
            </div>
          </div>
        </header>
        {/* Full-bleed: só a barra HQ à esquerda; sem encuadrar o conteúdo */}
        <main className="min-h-0 min-w-0 flex-1 overflow-x-hidden">{children}</main>
      </div>
    </div>
  )
}
