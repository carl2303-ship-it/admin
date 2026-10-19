import { cn } from '@/lib/utils'

/** Primitivos UI do hub — tema SE (preto / ciano / amarelo). */

export function ConfigBanner({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
      <p className="font-semibold text-amber-300">Boost Supabase não configurado</p>
      <p className="mt-1 text-xs text-amber-100/80">{message}</p>
      <p className="mt-2 text-xs text-amber-100/70">
        Define{' '}
        <code className="rounded bg-black/40 px-1 text-cyan-300">
          BOOST_SUPABASE_URL
        </code>{' '}
        e{' '}
        <code className="rounded bg-black/40 px-1 text-cyan-300">
          BOOST_SUPABASE_SERVICE_ROLE_KEY
        </code>{' '}
        no Netlify / .env.local.
      </p>
    </div>
  )
}

export function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
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
        active
          ? 'border border-cyan-500/30 bg-cyan-500/15 text-cyan-300'
          : 'border border-slate-700 bg-slate-900 text-slate-400'
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
        'overflow-hidden rounded-2xl border border-slate-800 bg-slate-950',
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
      <table className="w-full min-w-[640px] text-left text-sm text-slate-200">
        {children}
      </table>
    </div>
  )
}

export function Th({ children }: { children?: React.ReactNode }) {
  return (
    <th className="border-b border-slate-800 bg-slate-900/80 px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-400">
      {children}
    </th>
  )
}

export function Td({
  children,
  className,
  colSpan,
}: {
  children: React.ReactNode
  className?: string
  colSpan?: number
}) {
  return (
    <td
      colSpan={colSpan}
      className={cn(
        'border-b border-slate-800/80 px-4 py-3 align-middle text-slate-200',
        className
      )}
    >
      {children}
    </td>
  )
}

export const fieldClass =
  'w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none placeholder:text-slate-500 focus:border-cyan-500/50'

export const btnPrimary =
  'inline-flex items-center justify-center rounded-lg bg-cyan-500 px-3 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:opacity-50'

export const btnGhost =
  'inline-flex items-center justify-center rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm font-semibold text-slate-200 transition hover:border-cyan-500/40 hover:text-cyan-300'

export const btnDanger =
  'inline-flex items-center justify-center rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs font-bold text-red-300 transition hover:bg-red-500/20'
