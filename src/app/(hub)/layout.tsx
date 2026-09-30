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
      <div className="flex min-h-screen items-center justify-center p-6">
        <div className="max-w-md rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-900">
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
    <div className="flex min-h-screen">
      <div className="sticky top-0 hidden h-screen md:block">
        <Sidebar
          staffName={auth.staff?.full_name ?? null}
          staffEmail={auth.staff?.email ?? auth.user.email ?? ''}
          role={role}
        />
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="border-b border-zinc-200 bg-white/80 px-4 py-3 backdrop-blur md:hidden">
          <div className="flex items-center justify-between">
            <p className="font-[family-name:var(--font-display)] font-bold">
              PADEL <span className="text-emerald-600">HUB</span>
            </p>
            <span className="text-[10px] uppercase tracking-wider text-zinc-500">
              {role}
            </span>
          </div>
          <nav className="mt-3 flex gap-3 overflow-x-auto text-xs font-semibold text-zinc-600">
            <a href="/dashboard">Dashboard</a>
            <a href="/produtos/boost">Boost</a>
            <a href="/produtos/padel1">Padel1</a>
            <a href="/produtos/sportsevents">SE</a>
            <a href="/conteudo">Conteúdo</a>
            <a href="/configuracao">Config</a>
          </nav>
        </header>
        <main className="flex-1 p-4 md:p-8">{children}</main>
      </div>
    </div>
  )
}
