'use client'

import { useMemo, useState } from 'react';
import {
  Banknote,
  Calculator,
  Check,
  CheckCircle2,
  Copy,
  FileDown,
  Percent,
  RotateCcw,
  Target,
  TrendingDown,
  TrendingUp,
  Users,
  Wallet,
  XCircle,
} from 'lucide-react';

import { useTournamentRoiState } from '@/hooks/useTournamentRoiState';
import { calculateMonthlyTotals } from '@/lib/sportsevents/tournament-roi/calculations';
import {
  FIM_DE_SEMANA_FIELDS,
  META_MENSAL,
  SEMANA_FIELDS,
} from '@/lib/sportsevents/tournament-roi/defaults';
import {
  formatCurrency,
  formatInteger,
  formatPercent,
  signedCurrency,
} from '@/lib/sportsevents/tournament-roi/format';
import { buildWhatsAppReport } from '@/lib/sportsevents/tournament-roi/report';
import type { MonthlyTotals } from '@/lib/sportsevents/tournament-roi/types';
import { ActionButton, KpiCard, MiniStat, type TabId } from '@/components/sportsevents/roi/ui';
import { BreakdownSection, ChartsSection, PrintSection } from '@/components/sportsevents/roi/Charts';
import { TournamentFormCard } from '@/components/sportsevents/roi/Forms';

export default function RentabilidadeTorneios() {
  const { state, updateModality, reset } = useTournamentRoiState();
  const totals = useMemo(() => calculateMonthlyTotals(state), [state]);
  const [mobileTab, setMobileTab] = useState<TabId>('semana');
  const [copied, setCopied] = useState(false);

  async function copyWhatsApp() {
    const report = buildWhatsAppReport(state, totals);
    try {
      await navigator.clipboard.writeText(report);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt('Copia o resumo abaixo:', report);
    }
  }

  return (
    <div className="space-y-6">
      <HeaderSection totals={totals} />

      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <ActionButton onClick={reset} icon={<RotateCcw size={16} />} label="Reset para defeito" />
        <ActionButton
          onClick={copyWhatsApp}
          icon={copied ? <Check size={16} /> : <Copy size={16} />}
          label={copied ? 'Resumo copiado' : 'Copiar resumo WhatsApp'}
        />
        <ActionButton
          onClick={() => window.print()}
          icon={<FileDown size={16} />}
          label="Exportar PDF / Relatório"
          primary
        />
      </div>

      <KpiSection totals={totals} />

      <div className="lg:hidden">
        <div className="grid grid-cols-2 gap-1 rounded-lg bg-slate-950 p-1 border border-slate-800">
          {(['semana', 'fimDeSemana'] as TabId[]).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setMobileTab(tab)}
              className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                mobileTab === tab
                  ? 'bg-cyan-500/15 text-cyan-400'
                  : 'text-gray-400 hover:text-gray-100'
              }`}
            >
              {tab === 'semana' ? 'Semana' : 'Fim de semana'}
            </button>
          ))}
        </div>
        <div className="mt-3">
          {mobileTab === 'semana' ? (
            <TournamentFormCard
              idPrefix="mobile-semana"
              title="Torneios de semana"
              subtitle="Sociais · turno da tarde / noite"
              accent="week"
              fields={SEMANA_FIELDS}
              values={state.semana}
              results={totals.semana}
              onChange={(key, value) => updateModality('semana', key, value)}
            />
          ) : (
            <TournamentFormCard
              idPrefix="mobile-fds"
              title="Torneios de fim de semana"
              subtitle="Mega torneios · eventos de 2 dias"
              accent="weekend"
              fields={FIM_DE_SEMANA_FIELDS}
              values={state.fimDeSemana}
              results={totals.fimDeSemana}
              onChange={(key, value) => updateModality('fimDeSemana', key, value)}
            />
          )}
        </div>
      </div>

      <div className="hidden gap-4 lg:grid lg:grid-cols-2">
        <TournamentFormCard
          idPrefix="desktop-semana"
          title="Torneios de semana"
          subtitle="Sociais · turno da tarde / noite"
          accent="week"
          fields={SEMANA_FIELDS}
          values={state.semana}
          results={totals.semana}
          onChange={(key, value) => updateModality('semana', key, value)}
        />
        <TournamentFormCard
          idPrefix="desktop-fds"
          title="Torneios de fim de semana"
          subtitle="Mega torneios · eventos de 2 dias"
          accent="weekend"
          fields={FIM_DE_SEMANA_FIELDS}
          values={state.fimDeSemana}
          results={totals.fimDeSemana}
          onChange={(key, value) => updateModality('fimDeSemana', key, value)}
        />
      </div>

      <ChartsSection totals={totals} />
      <BreakdownSection totals={totals} />
      <PrintSection state={state} totals={totals} />
    </div>
  );
}

function HeaderSection({ totals }: { totals: MonthlyTotals }) {
  const progress = Math.min(100, Math.max(0, (totals.lucroLiquidoMensal / META_MENSAL) * 100));

  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <h1 className="text-2xl font-bold text-gray-100 flex items-center gap-2">
          <Calculator size={24} className="text-cyan-400" />
          Padel Event ROI / Calculator
        </h1>
        <p className="text-sm text-gray-500 mt-1 max-w-2xl">
          Simula a rentabilidade mensal de torneios e estágios itinerantes: sociais de semana e mega eventos de fim de semana.
        </p>
      </div>
      <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-800 p-4">
        <div className="flex items-center justify-between gap-3 mb-2">
          <div className="flex items-center gap-2 text-sm text-gray-300">
            <Target size={16} className="text-cyan-400" />
            Meta mensal
          </div>
          {totals.metaAtingida ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-400/10 px-2 py-0.5 text-xs font-medium text-emerald-400">
              <CheckCircle2 size={12} /> Superada
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-red-400/10 px-2 py-0.5 text-xs font-medium text-red-400">
              <XCircle size={12} /> Por atingir
            </span>
          )}
        </div>
        <p className="text-xl font-bold text-gray-100">{formatCurrency(META_MENSAL)}</p>
        <p className={`text-xs mt-1 ${totals.metaAtingida ? 'text-emerald-400' : 'text-red-400'}`}>
          {totals.metaAtingida
            ? `${signedCurrency(totals.desvioMeta)} acima da meta`
            : `Faltam ${formatCurrency(Math.abs(totals.desvioMeta))}`}
        </p>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-950">
          <div
            className={`h-full rounded-full ${totals.metaAtingida ? 'bg-emerald-400' : 'bg-red-400'}`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}

function KpiSection({ totals }: { totals: MonthlyTotals }) {
  const lucroPositive = totals.lucroLiquidoMensal >= 0;

  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      <div className="md:col-span-2 xl:col-span-2 rounded-2xl border border-emerald-400/20 bg-gradient-to-br from-emerald-400/10 to-slate-900 p-5">
        <div className="flex items-center gap-2 text-emerald-400 mb-2">
          <TrendingUp size={16} />
          <span className="text-xs font-semibold uppercase tracking-wider">Lucro líquido mensal</span>
        </div>
        <p className={`text-4xl font-bold tabular-nums ${lucroPositive ? 'text-emerald-400' : 'text-red-400'}`}>
          {formatCurrency(totals.lucroLiquidoMensal)}
        </p>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <MiniStat icon={<Users size={14} />} label="Jogadores" value={formatInteger(totals.totalJogadoresGeridos)} />
          <MiniStat icon={<Wallet size={14} />} label="Lucro / jogador" value={formatCurrency(totals.lucroMedioPorJogador)} />
        </div>
      </div>

      <KpiCard
        icon={<Banknote size={20} className="text-sky-400" />}
        label="Receita bruta total"
        value={formatCurrency(totals.receitaMensalTotal)}
        color="text-sky-400"
      />
      <KpiCard
        icon={<TrendingDown size={20} className="text-red-400" />}
        label="Custos operacionais"
        value={formatCurrency(totals.custoMensalTotal)}
        color="text-red-400"
      />

      <div className="md:col-span-2 xl:col-span-4 rounded-2xl bg-slate-900 border border-slate-800 p-4">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-slate-950 text-emerald-400">
              <Percent size={16} />
            </div>
            <div>
              <p className="text-xs text-gray-500">Margem de lucro</p>
              <p className="text-lg font-bold tabular-nums">{formatPercent(totals.margemLucro)}</p>
            </div>
          </div>
          <div>
            <p className="text-xs text-gray-500">Receita de inscrições</p>
            <p className="text-lg font-bold tabular-nums">
              {formatCurrency(totals.semana.receitaInscricoes + totals.fimDeSemana.receitaInscricoes)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Receita de patrocínios</p>
            <p className="text-lg font-bold tabular-nums">
              {formatCurrency(totals.semana.receitaPatrocinios + totals.fimDeSemana.receitaPatrocinios)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
