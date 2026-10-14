import {
  MESES_EPOCA,
  MULTIPLICADORES_EPOCA,
  type SimuladorParams,
  type SimuladorResultados,
  type Temporada,
} from './types'

export function getTemporada(mesEpoca: SimuladorParams['mesEpoca']): Temporada {
  return MESES_EPOCA.find((m) => m.value === mesEpoca)?.temporada ?? 'media'
}

export function calcularSimulador(params: SimuladorParams): SimuladorResultados {
  const {
    duracaoDias,
    numParticipantes,
    mesEpoca,
    precoVendaDuplo,
    percentagemQuartosSingle,
    suplementoSingle,
    percentagemPensaoCompleta,
    suplementoPensaoCompleta,
    custoHotelNoiteDuplo,
    custoHotelNoiteSingle,
    custoPensaoCompletaDia,
    horasCamposTotal,
    custoHoraCampo,
    horasTreinadorTotal,
    custoHoraTreinador,
    custoWelcomePackPessoa,
    custoPremiosPessoa,
    custoJantarWelcomePessoa,
    custoTransferPessoa,
    comissaoParceiroPercent,
  } = params

  const temporada = getTemporada(mesEpoca)
  const multiplicadorEpoca = MULTIPLICADORES_EPOCA[temporada]

  const numSingle = Math.round(numParticipantes * (percentagemQuartosSingle / 100))
  const numDuplo = numParticipantes - numSingle
  const numQuartosDuplos = Math.ceil(numDuplo / 2)
  const numPensaoCompleta = Math.round(
    numParticipantes * (percentagemPensaoCompleta / 100)
  )

  const receitaBase = numParticipantes * precoVendaDuplo
  const receitaSuplementoSingle = numSingle * suplementoSingle
  const receitaSuplementoPensao =
    numPensaoCompleta * suplementoPensaoCompleta * duracaoDias
  const faturacaoBruta =
    receitaBase + receitaSuplementoSingle + receitaSuplementoPensao

  const custoHotelDuploAjustado = custoHotelNoiteDuplo * multiplicadorEpoca
  const custoHotelSingleAjustado = custoHotelNoiteSingle * multiplicadorEpoca

  const custoAlojamento =
    numQuartosDuplos * custoHotelDuploAjustado * duracaoDias +
    numSingle * custoHotelSingleAjustado * duracaoDias

  const custoAlimentacao = numPensaoCompleta * custoPensaoCompletaDia * duracaoDias
  const custoCampos = horasCamposTotal * custoHoraCampo
  const custoTreinadores = horasTreinadorTotal * custoHoraTreinador
  const custoWelcomePack = numParticipantes * custoWelcomePackPessoa
  const custoPremios = numParticipantes * custoPremiosPessoa
  const custoJantarWelcome = numParticipantes * custoJantarWelcomePessoa
  const custoTransfers = numParticipantes * custoTransferPessoa
  const custoComissao = faturacaoBruta * (comissaoParceiroPercent / 100)

  const custosFixos = custoCampos + custoTreinadores

  const custoDiretoTotal =
    custoAlojamento +
    custoAlimentacao +
    custoCampos +
    custoTreinadores +
    custoWelcomePack +
    custoPremios +
    custoJantarWelcome +
    custoTransfers +
    custoComissao

  const margemBruta = faturacaoBruta - custoDiretoTotal
  const margemBrutaPercent =
    faturacaoBruta > 0 ? (margemBruta / faturacaoBruta) * 100 : 0
  const lucroPorCliente =
    numParticipantes > 0 ? margemBruta / numParticipantes : 0

  const custosVariaveis = custoDiretoTotal - custosFixos
  const custoVariavelPorCliente =
    numParticipantes > 0 ? custosVariaveis / numParticipantes : 0
  const receitaPorCliente =
    numParticipantes > 0 ? faturacaoBruta / numParticipantes : 0
  const margemContribuicaoPorCliente = receitaPorCliente - custoVariavelPorCliente

  let breakEvenClientes: number | null = null
  if (margemContribuicaoPorCliente > 0) {
    breakEvenClientes = Math.ceil(custosFixos / margemContribuicaoPorCliente)
  }

  return {
    numSingle,
    numDuplo,
    numQuartosDuplos,
    numPensaoCompleta,
    receitaBase,
    receitaSuplementoSingle,
    receitaSuplementoPensao,
    faturacaoBruta,
    custoAlojamento,
    custoAlimentacao,
    custoCampos,
    custoTreinadores,
    custoWelcomePack,
    custoPremios,
    custoJantarWelcome,
    custoTransfers,
    custoComissao,
    custoDiretoTotal,
    margemBruta,
    margemBrutaPercent,
    lucroPorCliente,
    breakEvenClientes,
    multiplicadorEpoca,
    temporada,
    custosFixos,
    margemContribuicaoPorCliente,
  }
}

export function formatEuro(value: number, decimals = 0): string {
  return value.toLocaleString('pt-PT', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
}

export function formatPercent(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`
}
