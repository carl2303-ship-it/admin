import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/admin'
import { requireSeStaff } from '@/lib/sportsevents/auth'

/**
 * Carga agregada do ERP (calendário / pipeline / eventos / parceiros).
 * Colunas alinhadas com o schema SE real (legado sportsevents.app/admin).
 * Queries secundárias não derrubam partners/leads/events.
 */
export async function GET() {
  const auth = await requireSeStaff()
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const db = createServiceClient() || (await createClient())

  const [leads, partners, events, destinations, sports] = await Promise.all([
    db
      .from('leads')
      .select('*, destinations(name), sports(name)')
      .order('created_at', { ascending: false }),
    db
      .from('partners')
      .select('*, destinations(name)')
      .order('country_code', { ascending: true })
      .order('name', { ascending: true })
      .limit(5000),
    db
      .from('events')
      .select('*, destinations(name, code), sports(name), hub_packages(package_key, name)')
      .order('start_date', { ascending: true }),
    db.from('destinations').select('id, name, code').order('name'),
    db.from('sports').select('id, name').order('name'),
  ])

  const coreErr =
    leads.error ||
    partners.error ||
    events.error ||
    destinations.error ||
    sports.error

  if (coreErr) {
    return NextResponse.json({ error: coreErr.message }, { status: 500 })
  }

  // Secundárias: falha suave (não esconder os 132 clubes).
  const [bookings, packageBookings, transferLogs] = await Promise.all([
    db
      .from('event_bookings')
      .select(
        'event_id, participants, amount, status, payment_type, customer_country, age_band, gender_mix'
      ),
    db.from('package_bookings').select(
      `id, status, padel_service_amount_cents, hotel_amount_cents,
       transfer_amount_cents, total_amount_cents, paid_at, created_at,
       hotel_partner_id, transfer_partner_id, hub_package_id,
       hotel:partners!hotel_partner_id(name, type),
       transfer:partners!transfer_partner_id(name, type),
       hub_packages(name, package_key, destination_id)`
    ),
    db.from('payment_transfer_logs').select(
      `id, partner_id, role, amount_cents, status, created_at, error_message,
       partners(name, type, country_code)`
    ),
  ])

  const warnings = [
    bookings.error && `event_bookings: ${bookings.error.message}`,
    packageBookings.error && `package_bookings: ${packageBookings.error.message}`,
    transferLogs.error &&
      `payment_transfer_logs: ${transferLogs.error.message}`,
  ].filter(Boolean) as string[]

  return NextResponse.json({
    leads: leads.data || [],
    partners: partners.data || [],
    events: events.data || [],
    bookings: bookings.error ? [] : bookings.data || [],
    packageBookings: packageBookings.error ? [] : packageBookings.data || [],
    transferLogs: transferLogs.error ? [] : transferLogs.data || [],
    destinations: destinations.data || [],
    sports: sports.data || [],
    ...(warnings.length ? { warnings } : {}),
  })
}
