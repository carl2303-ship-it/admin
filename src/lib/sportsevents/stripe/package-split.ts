import {
  mealPlanPrices,
  type HubPackageRow,
  type MealPlanKey,
} from '@/lib/sportsevents/hub-packages'
import { eurosToCents } from '@/lib/sportsevents/stripe/schemas'

export type PackageSplitConfig = {
  hotelPartnerId: string | null
  transferPartnerId: string | null
  hotelPercent: number
  transferPercent: number
}

export type ComputedPackageSplit = {
  totalCents: number
  padelServiceCents: number
  hotelCents: number
  transferCents: number
  hotelPartnerId: string
  transferPartnerId: string | null
  unitDoubleEuros: number
  unitSingleEuros: number
  playersInDouble: number
  playersInSingle: number
}

export function splitConfigFromRow(row: {
  hotel_partner_id?: string | null
  transfer_partner_id?: string | null
  split_hotel_percent?: number | string | null
  split_transfer_percent?: number | string | null
}): PackageSplitConfig {
  return {
    hotelPartnerId: row.hotel_partner_id || null,
    transferPartnerId: row.transfer_partner_id || null,
    hotelPercent: Number(row.split_hotel_percent || 0),
    transferPercent: Number(row.split_transfer_percent || 0),
  }
}

/**
 * Calcula total a partir do catálogo + pax, e reparte por % do pacote.
 * Restante (100 − hotel% − transfer%) = padel/plataforma.
 */
export function computePackageSplit(opts: {
  row: Pick<
    HubPackageRow,
    | 'price_bb_double'
    | 'price_bb_single'
    | 'price_hb_double'
    | 'price_hb_single'
    | 'price_full_double'
    | 'price_full_single'
    | 'hotel_partner_id'
    | 'transfer_partner_id'
    | 'split_hotel_percent'
    | 'split_transfer_percent'
  >
  mealPlan: MealPlanKey
  players: number
  singleRooms?: number
}): ComputedPackageSplit {
  const players = Math.max(1, Math.floor(opts.players))
  const singles = Math.min(
    Math.max(0, Math.floor(opts.singleRooms ?? 0)),
    players
  )
  const inDouble = players - singles

  const prices = {
    bbDouble: Number(opts.row.price_bb_double || 0),
    bbSingle: Number(opts.row.price_bb_single || 0),
    hbDouble: Number(opts.row.price_hb_double || 0),
    hbSingle: Number(opts.row.price_hb_single || 0),
    fullDouble: Number(opts.row.price_full_double || 0),
    fullSingle: Number(opts.row.price_full_single || 0),
  }
  const { double, single } = mealPlanPrices(prices, opts.mealPlan)
  if (inDouble > 0 && double <= 0) {
    throw new Error('Preço duplo indisponível para este plano de refeições.')
  }
  if (singles > 0 && single <= 0) {
    throw new Error('Preço single indisponível para este plano de refeições.')
  }

  const totalEuros = inDouble * double + singles * single
  const totalCents = eurosToCents(totalEuros)
  if (totalCents <= 0) {
    throw new Error('Total do pacote inválido.')
  }

  const cfg = splitConfigFromRow(opts.row)
  if (!cfg.hotelPartnerId) {
    throw new Error(
      'Pacote sem hotel Connect configurado. Define o parceiro no admin do pacote.'
    )
  }
  if (cfg.hotelPercent <= 0) {
    throw new Error(
      'Define split_hotel_percent (> 0) no pacote para o hotel receber a parte.'
    )
  }
  if (cfg.transferPercent > 0 && !cfg.transferPartnerId) {
    throw new Error(
      'split_transfer_percent > 0 mas falta transfer_partner_id no pacote.'
    )
  }
  if (cfg.hotelPercent + cfg.transferPercent > 100) {
    throw new Error('Soma das percentagens de split não pode exceder 100%.')
  }

  let hotelCents = Math.round((totalCents * cfg.hotelPercent) / 100)
  let transferCents =
    cfg.transferPercent > 0
      ? Math.round((totalCents * cfg.transferPercent) / 100)
      : 0

  // Adjust rounding so parts sum to total
  let padelCents = totalCents - hotelCents - transferCents
  if (padelCents < 0) {
    transferCents = Math.max(0, transferCents + padelCents)
    padelCents = totalCents - hotelCents - transferCents
  }

  return {
    totalCents,
    padelServiceCents: padelCents,
    hotelCents,
    transferCents,
    hotelPartnerId: cfg.hotelPartnerId,
    transferPartnerId:
      transferCents > 0 ? cfg.transferPartnerId : null,
    unitDoubleEuros: double,
    unitSingleEuros: single,
    playersInDouble: inDouble,
    playersInSingle: singles,
  }
}
