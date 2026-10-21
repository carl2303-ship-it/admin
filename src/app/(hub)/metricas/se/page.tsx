import Link from 'next/link'
import { redirect } from 'next/navigation'
import { requireHubAccess } from '@/lib/auth/hub-auth'
import {
  fetchSportsEventsLeads,
  fetchSportsEventsUpcoming,
} from '@/lib/products/kpis'
import { createSportsEventsServiceClient } from '@/lib/supabase/admin'
import { KpiCard } from '@/components/dashboard/kpi-card'

async function seBookingCounts() {
  const client = createSportsEventsServiceClient()
  if (!client) {
    return {
      eventBookings: null as number | null,
      packageBookings: null as number | null,
      pendingPackages: null as number | null,
      error: 'Service role SE não configurado',
    }
  }

  const [events, packages, pending] = await Promise.all([
    client.from('event_bookings').select('id', { count: 'exact', head: true }),
    client
      .from('package_bookings')
      .select('id', { count: 'exact', head: true }),
    client
      .from('package_bookings')
      .select('id', { count: 'exact', head: true })
      .in('status', ['PENDING', 'PENDENTE', 'pending']),
  ])

  return {
    eventBookings: events.error ? null : (events.count ?? 0),
    packageBookings: packages.error ? null : (packages.count ?? 0),
    pendingPackages: pending.error ? null : (pending.count ?? 0),
    error:
      events.error?.message ||
      packages.error?.message ||
      pending.error?.message ||
      null,
  }
}

export default async function MetricasSePage() {
  const auth = await requireHubAccess('dashboard')
  if (!auth.user) redirect('/login')
  if (auth.error && !auth.isBootstrap) {
    return (
      <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-6 text-amber-100">
        {auth.error}
      </div>
    )
  }

  const [upcoming, leads, bookings] = await Promise.all([
    fetchSportsEventsUpcoming(),
    fetchSportsEventsLeads(),
    seBookingCounts(),
  ])

  return (
    <div className="space-y-8">
      <p className="text-sm text-slate-400">
        Contagens reais do ERP SportsEvents. A calculadora ROI / rentabilidade
        vive em{' '}
        <Link href="/simulacoes/roi" className="font-semibold text-amber-400">
          Simulações → ROI Torneios
        </Link>
        .
      </p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <KpiCard kpi={upcoming} />
        <KpiCard kpi={leads} />
        <KpiCard
          kpi={{
            key: 'se_event_bookings',
            label: 'Bookings eventos',
            product: 'sportsevents',
            value: bookings.eventBookings,
            status:
              bookings.eventBookings === null
                ? bookings.error
                  ? 'degraded'
                  : 'missing_config'
                : 'ok',
            error: bookings.error || undefined,
          }}
        />
        <KpiCard
          kpi={{
            key: 'se_package_bookings',
            label: 'Bookings pacotes',
            product: 'sportsevents',
            value: bookings.packageBookings,
            status:
              bookings.packageBookings === null
                ? bookings.error
                  ? 'degraded'
                  : 'missing_config'
                : 'ok',
            error: bookings.error || undefined,
          }}
        />
        <KpiCard
          kpi={{
            key: 'se_pending_packages',
            label: 'Pacotes pendentes',
            product: 'sportsevents',
            value: bookings.pendingPackages,
            status:
              bookings.pendingPackages === null
                ? bookings.error
                  ? 'degraded'
                  : 'missing_config'
                : 'ok',
            hint: 'status PENDING / PENDENTE',
            error: bookings.error || undefined,
          }}
        />
      </div>

      <div className="flex flex-wrap gap-4 text-sm font-semibold">
        <Link
          href="/produtos/sportsevents"
          className="text-cyan-400 hover:underline"
        >
          Calendário / insights →
        </Link>
        <Link
          href="/produtos/sportsevents/pipeline"
          className="text-cyan-400 hover:underline"
        >
          Pipeline CRM →
        </Link>
        <Link href="/simulacoes" className="text-amber-400 hover:underline">
          Simulador financeiro →
        </Link>
      </div>
    </div>
  )
}
