import { Padel1ModuleNav } from '@/components/padel1/module-nav'
import { Padel1LegacyFallback } from '@/components/padel1/legacy-fallback'

export default function Padel1ModuleLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="mx-auto max-w-6xl space-y-5 animate-fade-up">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-violet-600">
          Módulo · Paridade HQ Padel1
        </p>
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight">
          Padel One HQ
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-zinc-500">
          Super-admin da plataforma (antes em{' '}
          <code>manager.padel1.app/?super-admin</code>). Dados via service role
          Padel1; checkout/owner via Edge Functions. Manager de clube e Tour
          ficam nas apps cliente.
        </p>
      </div>
      <Padel1ModuleNav />
      {children}
      <Padel1LegacyFallback />
    </div>
  )
}
