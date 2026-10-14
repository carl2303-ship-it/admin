import {
  rowToView,
  type HubPackageWrite,
  type PackageKey,
} from '@/lib/sportsevents/hub-packages'

const KEYS: PackageKey[] = ['weekend', 'experience', 'premium']

export function sanitizePackagePayload(
  body: Partial<HubPackageWrite> & Record<string, unknown>
): HubPackageWrite | { error: string } {
  const package_key = body.package_key as PackageKey
  if (!KEYS.includes(package_key)) {
    return { error: 'package_key inválido.' }
  }
  const name = String(body.name || '').trim()
  if (!name) return { error: 'Nome é obrigatório.' }
  if (!body.destination_id) return { error: 'Destino é obrigatório.' }

  const hotelPercent = Number(body.split_hotel_percent) || 0
  const transferPercent = Number(body.split_transfer_percent) || 0
  if (hotelPercent < 0 || hotelPercent > 100 || transferPercent < 0 || transferPercent > 100) {
    return { error: 'Percentagens de split devem estar entre 0 e 100.' }
  }
  if (hotelPercent + transferPercent > 100) {
    return { error: 'Soma hotel% + transfer% não pode exceder 100%.' }
  }

  const hotelId = body.hotel_partner_id
    ? String(body.hotel_partner_id)
    : null
  const transferId = body.transfer_partner_id
    ? String(body.transfer_partner_id)
    : null

  if (transferPercent > 0 && !transferId) {
    return {
      error: 'Indica o parceiro de transfers quando a % de transfer > 0.',
    }
  }

  return {
    destination_id: body.destination_id,
    package_key,
    name,
    duration: String(body.duration || '').trim(),
    schedule: String(body.schedule || '').trim(),
    concept: String(body.concept || '').trim(),
    featured: Boolean(body.featured),
    court_hours: Number(body.court_hours) || 0,
    coach_hours: Number(body.coach_hours) || 0,
    local_match_hours: Number(body.local_match_hours) || 0,
    tournament_hours: Number(body.tournament_hours) || 0,
    nights: Number(body.nights) || 0,
    itinerary: Array.isArray(body.itinerary) ? body.itinerary : [],
    price_bb_double: Number(body.price_bb_double) || 0,
    price_bb_single: Number(body.price_bb_single) || 0,
    price_hb_double: Number(body.price_hb_double) || 0,
    price_hb_single: Number(body.price_hb_single) || 0,
    price_full_double: Number(body.price_full_double) || 0,
    price_full_single: Number(body.price_full_single) || 0,
    airport_label: String(body.airport_label || '').trim(),
    local_network: String(body.local_network || '').trim(),
    inclusions: Array.isArray(body.inclusions)
      ? body.inclusions.map(String)
      : [],
    routine: Array.isArray(body.routine) ? body.routine : [],
    translations:
      body.translations && typeof body.translations === 'object'
        ? body.translations
        : {},
    published: body.published !== false,
    sort_order: Number(body.sort_order) || 0,
    hotel_partner_id: hotelId,
    transfer_partner_id: transferId,
    split_hotel_percent: hotelPercent,
    split_transfer_percent: transferPercent,
  }
}

export { rowToView }
