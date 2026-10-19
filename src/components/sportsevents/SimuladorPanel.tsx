'use client'

import { useMemo, useState, useCallback } from 'react'
import Link from 'next/link'
import { seJson } from '@/lib/sportsevents/se-api'
import {
  calcularSimulador,
  formatEuro,
  formatPercent,
} from '@/lib/sportsevents/simulador/calculations'
import {
  DEFAULT_PARAMS,
  MESES_EPOCA,
  type SimuladorParams,
  type Temporada,
} from '@/lib/sportsevents/simulador/types'
import {
  AccordionPanel,
  NumberField,
  ParamGrid,
  SliderField,
  updateParam,
} from '@/components/sportsevents/simulador/simulador-fields'
import {
  ArrowLeft,
  Calculator,
  DollarSign,
  Download,
  Hotel,
  Percent,
  PieChart,
  RotateCcw,
  Save,
  TrendingUp,
  Trophy,
  Users,
} from 'lucide-react'

const TEMPORADA_LABEL: Record<Temporada, string> = {
  baixa: 'Época Baixa (Nov–Fev)',
  media: 'Época Média (Mar–Abr, Out)',
  alta: 'Época Alta (Mai–Set)',
}

const TEMPORADA_COLOR: Record<Temporada, string> = {
  baixa: 'text-emerald-400',
  media: 'text-cyan-400',
  alta: 'text-amber-400',
}

export function SimuladorPanel() {
  const [params, setParams] = useState<SimuladorParams>(DEFAULT_PARAMS)
  const [openPanels, setOpenPanels] = useState({
    grupo: true,
    vendas: true,
    custos: true,
  })
  const [saving, setSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(
    null
  )

  const resultados = useMemo(() => calcularSimulador(params), [params])

  const togglePanel = (key: keyof typeof openPanels) => {
    setOpenPanels((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const restaurarPadroes = useCallback(() => {
    setParams(DEFAULT_PARAMS)
    setSaveMessage(null)
  }, [])

  const exportarPrint = useCallback(() => {
    window.print()
  }, [])

  const guardarProposta = useCallback(async () => {
    setSaving(true)
    setSaveMessage(null)

    const payload = {
      title: `Simulação Padel Camp — ${params.numParticipantes} pax / ${params.duracaoDias} noites`,
      params,
      resultados: {
        faturacao_bruta: resultados.faturacaoBruta,
        custo_direto: resultados.custoDiretoTotal,
        margem_bruta: resultados.margemBruta,
        margem_percent: resultados.margemBrutaPercent,
        lucro_por_cliente: resultados.lucroPorCliente,
        break_even: resultados.breakEvenClientes,
      },
    }

    const { ok, data } = await seJson('/api/se/simulator-proposals', {
      method: 'POST',
      body: JSON.stringify(payload),
    })

    setSaving(false)

    if (!ok) {
      setSaveMessage({
        type: 'err',
        text: `Erro ao guardar: ${data.error || 'falha'}. Verifica se a tabela simulator_proposals existe no Supabase.`,
      })
      return
    }

    setSaveMessage({ type: 'ok', text: 'Proposta guardada com sucesso no Supabase.' })
  }, [params, resultados])

  const maxBarValue = Math.max(
    resultados.faturacaoBruta,
    resultados.custoDiretoTotal,
    Math.max(resultados.margemBruta, 0),
    1
  )

  const barHeight = (value: number) =>
    `${Math.max(4, Math.round((value / maxBarValue) * 100))}%`

  const margemColor =
    resultados.margemBrutaPercent >= 30
      ? 'text-emerald-400'
      : resultados.margemBrutaPercent >= 15
        ? 'text-amber-400'
        : 'text-red-400'

  return (
    <>
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #simulador-print,
          #simulador-print * {
            visibility: visible;
          }
          #simulador-print {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background: white !important;
            color: black !important;
          }
          .no-print {
            display: none !important;
          }
          .print-break {
            break-inside: avoid;
          }
        }
      `}</style>

      <div id="simulador-print" className="min-h-screen bg-slate-950 text-white font-sans">
        {/* Header */}
        <header className="no-print bg-slate-900/80 border-b border-slate-800 px-6 py-4">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Link
                href="/produtos/sportsevents"
                className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 hover:text-cyan-400 hover:border-cyan-500/30 transition-all"
              >
                <ArrowLeft className="w-4 h-4" />
              </Link>
              <div className="flex items-center gap-3">
                                <div>
                  <h1 className="text-lg font-black tracking-tight font-[family-name:var(--font-display)]">
                    Simulador Financeiro
                    <span className="text-cyan-400">.app</span>
                  </h1>
                  <p className="text-[11px] text-slate-500">
                    Padel Camps & Eventos Desportivos — Custos, Receitas & Margens
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Link
                href="/produtos/sportsevents/definicoes"
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-950 border border-slate-800 text-slate-300 hover:text-cyan-400 hover:border-cyan-500/30 transition-all"
              >
                Definições
              </Link>
              <button
                type="button"
                onClick={restaurarPadroes}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-950 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition-all"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Restaurar Padrões
              </button>
              <button
                type="button"
                onClick={exportarPrint}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-950 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition-all"
              >
                <Download className="w-3.5 h-3.5" />
                Exportar PDF / Print
              </button>
              <button
                type="button"
                onClick={guardarProposta}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition-all disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                {saving ? 'A guardar...' : 'Guardar Proposta no Supabase'}
              </button>
              
            </div>
          </div>

          {saveMessage && (
            <div className="max-w-7xl mx-auto mt-3">
              <p
                className={`text-xs font-medium px-3 py-2 rounded-lg border ${
                  saveMessage.type === 'ok'
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                    : 'bg-red-500/10 border-red-500/20 text-red-400'
                }`}
              >
                {saveMessage.text}
              </p>
            </div>
          )}
        </header>

        {/* Print-only title */}
        <div className="hidden print:block px-6 py-4 border-b border-gray-300">
          <h1 className="text-xl font-bold text-black">
            SportsEvents.app — Simulador Financeiro
          </h1>
          <p className="text-sm text-gray-600">
            {params.numParticipantes} participantes · {params.duracaoDias} noites ·{' '}
            {MESES_EPOCA.find((m) => m.value === params.mesEpoca)?.label}
          </p>
        </div>

        <main className="max-w-7xl mx-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Coluna Esquerda — Inputs */}
            <div className="lg:col-span-2 space-y-4 no-print">
              <AccordionPanel
                id="grupo"
                title="1. Grupo & Época"
                icon={<Users className="w-4 h-4" />}
                badge={`${params.numParticipantes} pax · ${params.duracaoDias} noites`}
                open={openPanels.grupo}
                onToggle={() => togglePanel('grupo')}
              >
                <SliderField
                  label="Duração (noites)"
                  hint="Número de dias/noites do evento"
                  value={params.duracaoDias}
                  min={3}
                  max={6}
                  step={1}
                  suffix="noites"
                  onChange={(v) => updateParam(setParams, 'duracaoDias', v)}
                />
                <SliderField
                  label="Participantes (pax)"
                  hint="Tamanho do grupo"
                  value={params.numParticipantes}
                  min={8}
                  max={32}
                  step={1}
                  suffix="pax"
                  onChange={(v) => updateParam(setParams, 'numParticipantes', v)}
                  accent="amber"
                />

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-300">
                    Mês / Época do Evento
                  </label>
                  <p className="text-[10px] text-slate-500">
                    Ajusta automaticamente o multiplicador de custos de hotel
                  </p>
                  <select
                    value={params.mesEpoca}
                    onChange={(e) =>
                      updateParam(
                        setParams,
                        'mesEpoca',
                        e.target.value as SimuladorParams['mesEpoca']
                      )
                    }
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2.5 text-sm font-semibold text-white focus:outline-none focus:border-cyan-500/50"
                  >
                    {MESES_EPOCA.map((m) => (
                      <option key={m.value} value={m.value}>
                        {m.label} — {TEMPORADA_LABEL[m.temporada]}
                      </option>
                    ))}
                  </select>
                  <div className="flex items-center gap-2 mt-2 px-3 py-2 rounded-lg bg-slate-950 border border-slate-800">
                    <Hotel className="w-3.5 h-3.5 text-slate-500" />
                    <span className="text-[11px] text-slate-400">
                      Multiplicador hotel:{' '}
                      <span
                        className={`font-bold ${TEMPORADA_COLOR[resultados.temporada]}`}
                      >
                        ×{resultados.multiplicadorEpoca.toFixed(2)}
                      </span>{' '}
                      ({TEMPORADA_LABEL[resultados.temporada]})
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 pt-2">
                  <MiniStat label="Singles" value={String(resultados.numSingle)} />
                  <MiniStat label="Duplos" value={String(resultados.numDuplo)} />
                  <MiniStat
                    label="Quartos Duplos"
                    value={String(resultados.numQuartosDuplos)}
                  />
                </div>
              </AccordionPanel>

              <AccordionPanel
                id="vendas"
                title="2. Preços de Venda ao Cliente"
                icon={<DollarSign className="w-4 h-4" />}
                badge={`Base ${formatEuro(params.precoVendaDuplo)}/pax`}
                open={openPanels.vendas}
                onToggle={() => togglePanel('vendas')}
              >
                <NumberField
                  label="Preço Pacote Quarto Duplo"
                  hint="Preço base por pessoa"
                  value={params.precoVendaDuplo}
                  min={400}
                  max={1500}
                  step={5}
                  suffix="€/pax"
                  onChange={(v) => updateParam(setParams, 'precoVendaDuplo', v)}
                />
                <SliderField
                  label="% Quartos Single"
                  hint={`${resultados.numSingle} participantes em single`}
                  value={params.percentagemQuartosSingle}
                  min={0}
                  max={50}
                  step={5}
                  suffix="%"
                  onChange={(v) => updateParam(setParams, 'percentagemQuartosSingle', v)}
                  accent="amber"
                />
                <NumberField
                  label="Suplemento Single"
                  value={params.suplementoSingle}
                  min={0}
                  max={500}
                  step={10}
                  suffix="€/pax"
                  onChange={(v) => updateParam(setParams, 'suplementoSingle', v)}
                />
                <SliderField
                  label="% Pensão Completa"
                  hint={`${resultados.numPensaoCompleta} participantes com PC`}
                  value={params.percentagemPensaoCompleta}
                  min={0}
                  max={100}
                  step={5}
                  suffix="%"
                  onChange={(v) => updateParam(setParams, 'percentagemPensaoCompleta', v)}
                />
                <NumberField
                  label="Suplemento Pensão Completa"
                  hint="Por pessoa / dia (almoço + jantar)"
                  value={params.suplementoPensaoCompleta}
                  min={0}
                  max={80}
                  step={5}
                  suffix="€/dia"
                  onChange={(v) => updateParam(setParams, 'suplementoPensaoCompleta', v)}
                />
              </AccordionPanel>

              <AccordionPanel
                id="custos"
                title="3. Custos Operacionais (COGS)"
                icon={<TrendingUp className="w-4 h-4" />}
                badge={`COGS ${formatEuro(resultados.custoDiretoTotal)}`}
                open={openPanels.custos}
                onToggle={() => togglePanel('custos')}
              >
                <ParamGrid>
                  <NumberField
                    label="Hotel Duplo / Noite"
                    hint="Custo real do quarto duplo"
                    value={params.custoHotelNoiteDuplo}
                    min={50}
                    max={250}
                    step={5}
                    suffix="€/noite"
                    onChange={(v) => updateParam(setParams, 'custoHotelNoiteDuplo', v)}
                  />
                  <NumberField
                    label="Hotel Single / Noite"
                    value={params.custoHotelNoiteSingle}
                    min={40}
                    max={200}
                    step={5}
                    suffix="€/noite"
                    onChange={(v) => updateParam(setParams, 'custoHotelNoiteSingle', v)}
                  />
                  <NumberField
                    label="Pensão Completa / Dia"
                    hint="Custo real almoço + jantar"
                    value={params.custoPensaoCompletaDia}
                    min={15}
                    max={60}
                    step={1}
                    suffix="€/dia"
                    onChange={(v) => updateParam(setParams, 'custoPensaoCompletaDia', v)}
                  />
                  <NumberField
                    label="Comissão Parceiro"
                    value={params.comissaoParceiroPercent}
                    min={0}
                    max={25}
                    step={1}
                    suffix="%"
                    onChange={(v) => updateParam(setParams, 'comissaoParceiroPercent', v)}
                  />
                </ParamGrid>

                <div className="border-t border-slate-800 pt-4 space-y-4">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Campos & Treinadores
                  </p>
                  <ParamGrid>
                    <SliderField
                      label="Horas Totais de Campos"
                      value={params.horasCamposTotal}
                      min={8}
                      max={24}
                      step={1}
                      suffix="h"
                      onChange={(v) => updateParam(setParams, 'horasCamposTotal', v)}
                    />
                    <NumberField
                      label="Custo / Hora Campo"
                      value={params.custoHoraCampo}
                      min={5}
                      max={30}
                      step={1}
                      suffix="€/h"
                      onChange={(v) => updateParam(setParams, 'custoHoraCampo', v)}
                    />
                    <SliderField
                      label="Horas Totais Treinadores"
                      hint="Rácio 1 treinador / 4 pessoas"
                      value={params.horasTreinadorTotal}
                      min={4}
                      max={16}
                      step={1}
                      suffix="h"
                      onChange={(v) => updateParam(setParams, 'horasTreinadorTotal', v)}
                      accent="emerald"
                    />
                    <NumberField
                      label="Custo / Hora Treinador"
                      value={params.custoHoraTreinador}
                      min={15}
                      max={60}
                      step={5}
                      suffix="€/h"
                      onChange={(v) => updateParam(setParams, 'custoHoraTreinador', v)}
                    />
                  </ParamGrid>
                </div>

                <div className="border-t border-slate-800 pt-4 space-y-4">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Extras por Participante
                  </p>
                  <ParamGrid>
                    <NumberField
                      label="Welcome Pack"
                      value={params.custoWelcomePackPessoa}
                      min={5}
                      max={40}
                      suffix="€/pax"
                      onChange={(v) => updateParam(setParams, 'custoWelcomePackPessoa', v)}
                    />
                    <NumberField
                      label="Prémios / Troféus"
                      value={params.custoPremiosPessoa}
                      min={5}
                      max={30}
                      suffix="€/pax"
                      onChange={(v) => updateParam(setParams, 'custoPremiosPessoa', v)}
                    />
                    <NumberField
                      label="Jantar Welcome (Noite 1)"
                      value={params.custoJantarWelcomePessoa}
                      min={15}
                      max={50}
                      suffix="€/pax"
                      onChange={(v) => updateParam(setParams, 'custoJantarWelcomePessoa', v)}
                    />
                    <NumberField
                      label="Transfer In/Out 24/7"
                      value={params.custoTransferPessoa}
                      min={10}
                      max={50}
                      suffix="€/pax"
                      onChange={(v) => updateParam(setParams, 'custoTransferPessoa', v)}
                    />
                  </ParamGrid>
                </div>
              </AccordionPanel>
            </div>

            {/* Coluna Direita — Resumo Executivo (Sticky) */}
            <aside className="lg:col-span-1">
              <div className="lg:sticky lg:top-6 space-y-4 print-break">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
                  <div className="flex items-center gap-2 mb-5">
                    <PieChart className="w-4 h-4 text-cyan-400" />
                    <h2 className="text-sm font-black uppercase tracking-wider text-white">
                      Resumo Executivo Financeiro
                    </h2>
                  </div>

                  <div className="space-y-3">
                    <KpiCard
                      label="Faturação Bruta Total"
                      value={formatEuro(resultados.faturacaoBruta)}
                      sub={`Base ${formatEuro(resultados.receitaBase)} + Suplementos`}
                      color="text-white"
                      icon={<DollarSign className="w-4 h-4" />}
                    />
                    <KpiCard
                      label="Custo Direto Total (COGS)"
                      value={formatEuro(resultados.custoDiretoTotal)}
                      sub={`Fixos ${formatEuro(resultados.custosFixos)} (campos + treinadores)`}
                      color="text-red-400"
                      icon={<TrendingUp className="w-4 h-4 rotate-180" />}
                    />
                    <KpiCard
                      label="Margem Bruta"
                      value={formatEuro(resultados.margemBruta)}
                      sub="Faturação − COGS"
                      color={resultados.margemBruta >= 0 ? 'text-emerald-400' : 'text-red-400'}
                      icon={<Trophy className="w-4 h-4" />}
                      highlight
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <KpiCard
                        label="Margem %"
                        value={formatPercent(resultados.margemBrutaPercent)}
                        color={margemColor}
                        icon={<Percent className="w-3.5 h-3.5" />}
                        compact
                      />
                      <KpiCard
                        label="Lucro / Pax"
                        value={formatEuro(resultados.lucroPorCliente)}
                        color="text-cyan-400"
                        icon={<Users className="w-3.5 h-3.5" />}
                        compact
                      />
                    </div>

                    <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                          Break-Even Point
                        </span>
                        <span className="text-xs font-black text-amber-400">
                          {resultados.breakEvenClientes !== null
                            ? `${resultados.breakEvenClientes} clientes`
                            : 'N/A'}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 leading-relaxed">
                        Mínimo de participantes para cobrir custos fixos operacionais
                        (campos + treinadores) com a margem de contribuição atual.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Gráfico de Barras */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 print-break">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
                    Receita vs Custo vs Lucro
                  </h3>
                  <div className="flex items-end justify-center gap-6 h-40">
                    <BarColumn
                      label="Receita"
                      value={formatEuro(resultados.faturacaoBruta)}
                      height={barHeight(resultados.faturacaoBruta)}
                      color="bg-cyan-500"
                    />
                    <BarColumn
                      label="COGS"
                      value={formatEuro(resultados.custoDiretoTotal)}
                      height={barHeight(resultados.custoDiretoTotal)}
                      color="bg-red-500/80"
                    />
                    <BarColumn
                      label="Lucro"
                      value={formatEuro(resultados.margemBruta)}
                      height={barHeight(Math.max(resultados.margemBruta, 0))}
                      color="bg-emerald-500"
                    />
                  </div>
                </div>

                {/* Detalhe de Custos (print-friendly) */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 print-break">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                    Breakdown de Custos
                  </h3>
                  <dl className="space-y-2 text-xs">
                    <CostLine label="Alojamento" value={resultados.custoAlojamento} />
                    <CostLine label="Alimentação (PC)" value={resultados.custoAlimentacao} />
                    <CostLine label="Campos" value={resultados.custoCampos} />
                    <CostLine label="Treinadores" value={resultados.custoTreinadores} />
                    <CostLine label="Welcome Pack" value={resultados.custoWelcomePack} />
                    <CostLine label="Prémios" value={resultados.custoPremios} />
                    <CostLine label="Jantar Welcome" value={resultados.custoJantarWelcome} />
                    <CostLine label="Transfers" value={resultados.custoTransfers} />
                    <CostLine label="Comissão Parceiro" value={resultados.custoComissao} />
                  </dl>
                </div>
              </div>
            </aside>
          </div>
        </main>
      </div>
    </>
  )
}

function KpiCard({
  label,
  value,
  sub,
  color,
  icon,
  highlight,
  compact,
}: {
  label: string
  value: string
  sub?: string
  color: string
  icon: React.ReactNode
  highlight?: boolean
  compact?: boolean
}) {
  return (
    <div
      className={`rounded-xl border p-3 ${
        highlight
          ? 'bg-gradient-to-br from-emerald-500/10 to-cyan-500/5 border-emerald-500/20'
          : 'bg-slate-950 border-slate-800'
      } ${compact ? 'p-2.5' : 'p-3'}`}
    >
      <div className="flex items-center gap-2 mb-1">
        <span className="text-slate-500">{icon}</span>
        <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
          {label}
        </span>
      </div>
      <div className={`${compact ? 'text-lg' : 'text-2xl'} font-black ${color}`}>
        {value}
      </div>
      {sub && <p className="text-[10px] text-slate-500 mt-0.5">{sub}</p>}
    </div>
  )
}

function BarColumn({
  label,
  value,
  height,
  color,
}: {
  label: string
  value: string
  height: string
  color: string
}) {
  return (
    <div className="flex flex-col items-center gap-2 flex-1 max-w-[80px]">
      <span className="text-[10px] font-bold text-slate-400">{value}</span>
      <div className="w-full h-28 bg-slate-950 rounded-lg border border-slate-800 flex items-end overflow-hidden">
        <div
          className={`w-full ${color} rounded-t-md transition-all duration-300`}
          style={{ height }}
        />
      </div>
      <span className="text-[10px] font-semibold text-slate-500 uppercase">{label}</span>
    </div>
  )
}

function CostLine({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex justify-between items-center">
      <dt className="text-slate-400">{label}</dt>
      <dd className="font-bold text-slate-200">{formatEuro(value)}</dd>
    </div>
  )
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-center">
      <div className="text-[10px] text-slate-500 uppercase font-semibold">{label}</div>
      <div className="text-sm font-black text-cyan-400 mt-0.5">{value}</div>
    </div>
  )
}
