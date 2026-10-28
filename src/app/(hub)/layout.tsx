import { redirect } from 'next/navigation'
import { requireHubStaff } from '@/lib/auth/hub-auth'
import { HubChrome } from '@/components/shell/hub-chrome'
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
      <div className="flex min-h-dvh items-center justify-center bg-black p-6">
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
    <HubChrome
      staffName={auth.staff?.full_name ?? null}
      staffEmail={auth.staff?.email ?? auth.user.email ?? ''}
      role={role}
    >
      {children}
    </HubChrome>
  )
}
