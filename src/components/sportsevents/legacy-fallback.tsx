import Link from 'next/link'

/**
 * Sem deep-link ao admin legado (sportsevents.app/admin / Staff).
 * Equipa do hub vive em /equipa (hub_staff).
 */
export function SportsEventsLegacyFallback() {
  return (
    <p className="pt-4 text-center text-[11px] text-slate-500">
      Equipa do hub:{' '}
      <Link
        href="/equipa"
        className="font-semibold text-cyan-400 hover:underline"
      >
        /equipa
      </Link>
    </p>
  )
}
