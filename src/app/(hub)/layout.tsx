import { redirect } from 'next/navigation'
import { requireHubStaff } from '@/lib/auth/hub-auth'
import { Sidebar } from '@/components/shell/sidebar'
import type { HubRole } from '@/lib/auth/roles'

export default async function HubLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const auth = await requireHubStaff()

  if (!auth.user) {
    redirect('/login')
  }

  if (auth.error && !auth.isBootstrap) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black p-6">
        <div className="max-w-md rounded-2xl border border-amber-500/30 bg-amber-500/10 p-6 text-amber-100">
          <h1 className="font-[family-name:var(--font-display)] text-lg font-bold">
            Acesso negado
          </h1>
          <p className="mt-2 text-sm">{auth.error}</p>
        </div>
      </div>
    )
  }

  const role: HubRole | 'bootstrap' = auth.isBootstrap
    ? 'bootstrap'
    : (auth.staff?.role ?? 'readonly')

  return (
    <div className="flex min-h-screen bg-black text-slate-100">
      <div className="sticky top-0 hidden h-screen shrink-0 md:block">
        <Sidebar
          staffName={auth.staff?.full_name ?? null}
          staffEmail={auth.staff?.email ?? auth.user.email ?? ''}
          role={role}
        />
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="border-b border-slate-800 bg-black px-4 py-3 md:hidden">
          <div className="flex items-center justify-between">
            <p className="font-[family-name:var(--font-display)] font-bold">
              PADEL <span className="text-cyan-400">HUB</span>
            </p>
            <span className="text-[10px] uppercase tracking-wider text-amber-400">
              {role}
            </span>
          </div>
          <nav className="mt-3 flex gap-3 overflow-x-auto text-xs font-semibold text-slate-400">
            <a href="/dashboard" className="hover:text-cyan-400">
              Dashboard
            </a>
            <a href="/produtos/boost" className="hover:text-cyan-400">
              Boost
            </a>
            <a href="/produtos/padel1" className="hover:text-cyan-400">
              Padel1
            </a>
            <a href="/produtos/sportsevents" className="hover:text-cyan-400">
              SE
            </a>
            <a href="/simulacoes" className="hover:text-amber-400">
              Simulações
            </a>
            <a href="/metricas" className="hover:text-cyan-400">
              Métricas
            </a>
            <a href="/conteudo" className="hover:text-amber-400">
              Conteúdo & Social
            </a>
            <a href="/configuracao" className="hover:text-cyan-400">
              Config
            </a>
          </nav>
        </header>
        {/* Full-bleed: só a barra HQ à esquerda; sem encuadrar o conteúdo */}
        <main className="min-h-0 flex-1">{children}</main>
      </div>
    </div>
  )
}
