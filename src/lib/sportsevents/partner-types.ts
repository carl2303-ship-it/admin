/** Tipos de parceiro alinhados com o enum Postgres `partner_type`. */
export const PARTNER_TYPES = [
  {
    value: 'CLUBE_PADEL',
    label: 'Clube de padel',
    short: 'Clube',
    defaultContact: 'Clube',
  },
  {
    value: 'COMPLEXO_FUTEBOL',
    label: 'Complexo / campos futebol',
    short: 'Futebol',
    defaultContact: 'Complexo',
  },
  {
    value: 'HOTEL',
    label: 'Hotel',
    short: 'Hotel',
    defaultContact: 'Hotel',
  },
  {
    value: 'RESTAURANTE',
    label: 'Restaurante',
    short: 'Restaurante',
    defaultContact: 'Restaurante',
  },
  {
    value: 'SPONSOR',
    label: 'Sponsor',
    short: 'Sponsor',
    defaultContact: 'Sponsor',
  },
  {
    value: 'TREINADOR',
    label: 'Treinador',
    short: 'Treinador',
    defaultContact: 'Treinador',
  },
  {
    value: 'TRANSPORTES',
    label: 'Transportes',
    short: 'Transportes',
    defaultContact: 'Transportes',
  },
  {
    value: 'OUTROS',
    label: 'Outros',
    short: 'Outros',
    defaultContact: 'Parceiro',
  },
] as const

export type PartnerTypeValue = (typeof PARTNER_TYPES)[number]['value']

export function partnerTypeLabel(type?: string | null) {
  const found = PARTNER_TYPES.find((t) => t.value === type)
  return found?.label || type || 'Parceiro'
}

export function partnerTypeShort(type?: string | null) {
  const found = PARTNER_TYPES.find((t) => t.value === type)
  return found?.short || type || 'Parceiro'
}

export function isVenuePartner(type?: string | null) {
  return type === 'CLUBE_PADEL' || type === 'COMPLEXO_FUTEBOL'
}

export function isHospitalityPartner(type?: string | null) {
  return type === 'HOTEL' || type === 'RESTAURANTE'
}
