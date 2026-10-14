export type MesEpoca =
  | 'NOV'
  | 'DEZ'
  | 'JAN'
  | 'FEV'
  | 'MAR'
  | 'ABR'
  | 'MAI'
  | 'JUN'
  | 'JUL'
  | 'AGO'
  | 'SET'
  | 'OUT'

export type Temporada = 'baixa' | 'media' | 'alta'

export interface SimuladorParams {
  duracaoDias: number
  numParticipantes: number
  mesEpoca: MesEpoca
  precoVendaDuplo: number
  percentagemQuartosSingle: number
  suplementoSingle: number
  percentagemPensaoCompleta: number
  suplementoPensaoCompleta: number
  custoHotelNoiteDuplo: number
  custoHotelNoiteSingle: number
  custoPensaoCompletaDia: number
  horasCamposTotal: number
  custoHoraCampo: number
  horasTreinadorTotal: number
  custoHoraTreinador: number
  custoWelcomePackPessoa: number
  custoPremiosPessoa: number
  custoJantarWelcomePessoa: number
  custoTransferPessoa: number
  comissaoParceiroPercent: number
}

export interface SimuladorResultados {
  numSingle: number
  numDuplo: number
  numQuartosDuplos: number
  numPensaoCompleta: number
  receitaBase: number
  receitaSuplementoSingle: number
  receitaSuplementoPensao: number
  faturacaoBruta: number
  custoAlojamento: number
  custoAlimentacao: number
  custoCampos: number
  custoTreinadores: number
  custoWelcomePack: number
  custoPremios: number
  custoJantarWelcome: number
  custoTransfers: number
  custoComissao: number
  custoDiretoTotal: number
  margemBruta: number
  margemBrutaPercent: number
  lucroPorCliente: number
  breakEvenClientes: number | null
  multiplicadorEpoca: number
  temporada: Temporada
  custosFixos: number
  margemContribuicaoPorCliente: number
}

export const MESES_EPOCA: { value: MesEpoca; label: string; temporada: Temporada }[] = [
  { value: 'NOV', label: 'Novembro', temporada: 'baixa' },
  { value: 'DEZ', label: 'Dezembro', temporada: 'baixa' },
  { value: 'JAN', label: 'Janeiro', temporada: 'baixa' },
  { value: 'FEV', label: 'Fevereiro', temporada: 'baixa' },
  { value: 'MAR', label: 'Março', temporada: 'media' },
  { value: 'ABR', label: 'Abril', temporada: 'media' },
  { value: 'MAI', label: 'Maio', temporada: 'alta' },
  { value: 'JUN', label: 'Junho', temporada: 'alta' },
  { value: 'JUL', label: 'Julho', temporada: 'alta' },
  { value: 'AGO', label: 'Agosto', temporada: 'alta' },
  { value: 'SET', label: 'Setembro', temporada: 'alta' },
  { value: 'OUT', label: 'Outubro', temporada: 'media' },
]

export const MULTIPLICADORES_EPOCA: Record<Temporada, number> = {
  baixa: 0.85,
  media: 1,
  alta: 1.25,
}

export const DEFAULT_PARAMS: SimuladorParams = {
  duracaoDias: 4,
  numParticipantes: 16,
  mesEpoca: 'MAR',
  precoVendaDuplo: 795,
  percentagemQuartosSingle: 25,
  suplementoSingle: 200,
  percentagemPensaoCompleta: 40,
  suplementoPensaoCompleta: 40,
  custoHotelNoiteDuplo: 100,
  custoHotelNoiteSingle: 85,
  custoPensaoCompletaDia: 35,
  horasCamposTotal: 14,
  custoHoraCampo: 10,
  horasTreinadorTotal: 6,
  custoHoraTreinador: 30,
  custoWelcomePackPessoa: 15,
  custoPremiosPessoa: 10,
  custoJantarWelcomePessoa: 28,
  custoTransferPessoa: 25,
  comissaoParceiroPercent: 10,
}
