import { cn } from '@/lib/utils'

export function ConfigBanner({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
      <p className="font-semibold">Boost Supabase não configurado</p>
      <p className="mt-1 text-xs">{message}</p>
      <p className="mt-2 text-xs">
        Define <code className="rounded bg-amber-100 px-1">BOOST_SUPABASE_URL</code> e{' '}
        <code className="rounded bg-amber-100 px-1">
          BOOST_SUPABASE_SERVICE_ROLE_KEY
        </code>{' '}
        no Netlify / .env.local.
      </p>
    </div>
  )
}

export function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
      {message}
    </div>
  )
}

export function StatusPill({
  active,
  activeLabel = 'Ativo',
  inactiveLabel = 'Inativo',
}: {
  active: boolean
  activeLabel?: string
  inactiveLabel?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold',
        active ? 'bg-emerald-100 text-emerald-800' : 'bg-zinc-100 text-zinc-600'
      )}
    >
      {active ? activeLabel : inactiveLabel}
    </span>
  )
}

export function Panel({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm',
        className
      )}
    >
      {children}
    </div>
  )
}

export function TableShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] text-left text-sm">{children}</table>
    </div>
  )
}

export function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="border-b border-zinc-100 bg-zinc-50/80 px-4 py-3 text-xs font-bold uppercase tracking-wider text-zinc-500">
      {children}
    </th>
  )
}

export function Td({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <td className={cn('border-b border-zinc-50 px-4 py-3 align-middle', className)}>
      {children}
    </td>
  )
}

export const fieldClass =
  'w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20'

export const btnPrimary =
  'inline-flex items-center justify-center rounded-lg bg-sky-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-sky-500 disabled:opacity-50'

export const btnGhost =
  'inline-flex items-center justify-center rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50'

export const btnDanger =
  'inline-flex items-center justify-center rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-bold text-red-700 transition hover:bg-red-100'
