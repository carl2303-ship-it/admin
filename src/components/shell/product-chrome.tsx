import { cn } from '@/lib/utils'

/** Chrome visual único (SE) para Boost / Padel1 / SportsEvents — full-bleed. */
export function ProductChrome({
  eyebrow,
  title,
  children,
  nav,
  className,
}: {
  eyebrow: string
  title: string
  children: React.ReactNode
  nav?: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex min-h-full w-full flex-col bg-black text-slate-100',
        className
      )}
    >
      <div className="border-b border-slate-800 px-4 py-4 md:px-6">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-cyan-400">
          {eyebrow}
        </p>
        <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold tracking-tight text-white md:text-3xl">
          {title}{' '}
          <span className="text-amber-400">.</span>
        </h1>
      </div>
      {nav ? (
        <div className="border-b border-slate-800 px-4 md:px-6">{nav}</div>
      ) : null}
      <div className="w-full flex-1 px-4 py-4 md:px-6">{children}</div>
    </div>
  )
}
