import { BoostModuleNav } from '@/components/boost/module-nav'
import { BoostLegacyFallback } from '@/components/boost/legacy-fallback'

export default function BoostModuleLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="mx-auto max-w-6xl space-y-5 animate-fade-up">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-sky-600">
          Módulo · Paridade Boost
        </p>
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight">
          Boost Store
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-zinc-500">
          Gestão completa da loja, conteúdo, marketing, analytics e SaaS Tour no
          hub. Dados via service role; Stripe/provision via Edge Functions
          existentes.
        </p>
      </div>
      <BoostModuleNav />
      {children}
      <BoostLegacyFallback />
    </div>
  )
}
