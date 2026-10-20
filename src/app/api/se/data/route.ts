import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/admin'
import { requireSeStaff } from '@/lib/sportsevents/auth'

/** Carga agregada do ERP (calendário / pipeline / eventos / parceiros). */
export async function GET() {
  const auth = await requireSeStaff()
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const db = createServiceClient() || (await createClient())

  const [
    leads,
    partners,
    events,
    bookings,
    packageBookings,
    transferLogs,
    destinations,
    sports,
  ] = await Promise.all([
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
    db.from('event_bookings').select('event_id, pax, amount_total, status, country, age_band, gender_mix'),
    db
      .from('package_bookings')
      .select('id, hub_package_id, pax, amount_total, status, created_at'),
    db
      .from('payment_transfer_logs')
      .select(
        'id, partner_id, role, amount, currency, status, created_at, partners(name, type, country_code)'
      ),
    db.from('destinations').select('id, name, code').order('name'),
    db.from('sports').select('id, name').order('name'),
  ])

  const err =
    leads.error ||
    partners.error ||
    events.error ||
    bookings.error ||
    packageBookings.error ||
    transferLogs.error ||
    destinations.error ||
    sports.error

  if (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }

  return NextResponse.json({
    leads: leads.data || [],
    partners: partners.data || [],
    events: events.data || [],
    bookings: bookings.data || [],
    packageBookings: packageBookings.data || [],
    transferLogs: transferLogs.data || [],
    destinations: destinations.data || [],
    sports: sports.data || [],
  })
}
