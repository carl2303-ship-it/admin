import { SportsEventsModuleNav } from '@/components/sportsevents/module-nav'
import { SportsEventsLegacyFallback } from '@/components/sportsevents/legacy-fallback'

export default function SportsEventsModuleLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="mx-auto max-w-7xl space-y-5 animate-fade-up">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-amber-700">
          Módulo · Paridade sportsevents.app/admin
        </p>
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight">
          SportsEvents ERP
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-zinc-500">
          Calendário, CRM, pacotes, edições datadas, parceiros, blog, redes,
          ROI, simulador e cartões — mesmos fluxos do admin legado. Auth{' '}
          <code className="text-xs">hub_staff</code>; dados no projeto Supabase
          SportsEvents.
        </p>
      </div>
      <SportsEventsModuleNav />
      {children}
      <SportsEventsLegacyFallback />
    </div>
  )
}
