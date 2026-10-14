import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { combinedCostBreakdown } from '@/lib/sportsevents/tournament-roi/calculations';
import { formatCurrency } from '@/lib/sportsevents/tournament-roi/format';
import type { MonthlyTotals, SimulatorState, TournamentResults } from '@/lib/sportsevents/tournament-roi/types';
import { COST_COLORS, TOOLTIP_STYLE } from '@/components/sportsevents/roi/ui';

export function ChartsSection({ totals }: { totals: MonthlyTotals }) {
  const comparison = [
    { name: 'Semana', Receita: totals.semana.receitaTotal, Custo: totals.semana.custoTotal, Lucro: totals.semana.lucroLiquido },
    { name: 'Fim de semana', Receita: totals.fimDeSemana.receitaTotal, Custo: totals.fimDeSemana.custoTotal, Lucro: totals.fimDeSemana.lucroLiquido },
  ];
  const costs = combinedCostBreakdown(totals).filter((item) => item.value > 0);

  return (
    <div className="grid gap-4 xl:grid-cols-5">
      <div className="xl:col-span-3 rounded-2xl bg-slate-900 border border-slate-800 p-5">
        <h2 className="text-sm font-semibold text-gray-300 mb-1">Receita vs custo vs lucro</h2>
        <p className="text-xs text-gray-500 mb-4">Comparação mensal entre semana e fim de semana.</p>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={comparison} barGap={6}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
              <XAxis dataKey="name" tick={{ fill: '#888', fontSize: 11 }} />
              <YAxis tick={{ fill: '#888', fontSize: 11 }} />
              <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v) => formatCurrency(Number(v ?? 0))} />
              <Legend wrapperStyle={{ color: '#ccc', fontSize: 12 }} />
              <Bar dataKey="Receita" fill="#38bdf8" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Custo" fill="#fb7185" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Lucro" fill="#34d399" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="xl:col-span-2 rounded-2xl bg-slate-900 border border-slate-800 p-5">
        <h2 className="text-sm font-semibold text-gray-300 mb-1">Estrutura de custos</h2>
        <p className="text-xs text-gray-500 mb-4">Distribuição mensal por categoria.</p>
        {costs.length === 0 ? (
          <div className="flex h-72 items-center justify-center text-sm text-gray-500">Sem custos para mostrar.</div>
        ) : (
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={costs} dataKey="value" nameKey="label" innerRadius="58%" outerRadius="82%" paddingAngle={3}>
                  {costs.map((entry, index) => (
                    <Cell key={entry.key} fill={COST_COLORS[index % COST_COLORS.length]} stroke="#0f172a" />
                  ))}
                </Pie>
                <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v) => formatCurrency(Number(v ?? 0))} />
                <Legend verticalAlign="bottom" wrapperStyle={{ color: '#ccc', fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}

function BreakdownCard({ title, results }: { title: string; results: TournamentResults }) {
  const rows: [string, number][] = [
    ['Receita de inscrições', results.receitaInscricoes],
    ['Receita de patrocínios', results.receitaPatrocinios],
    ['Receita total', results.receitaTotal],
    ['Custo aluguer de campos', results.custoAluguerCampos],
    ['Custo bebidas / kits', results.custoBebidas],
    ['Custo prémios', results.custoPremios],
    ['Custo DJ / staff', results.custoDJ],
    ['Outros gastos', results.outrosGastos],
    ['Custo total', results.custoTotal],
    ['Lucro líquido', results.lucroLiquido],
  ];

  return (
    <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5">
      <h3 className="text-sm font-semibold text-gray-300 mb-3">{title}</h3>
      <div className="space-y-1">
        {rows.map(([label, val]) => {
          const emphasize = ['Lucro líquido', 'Receita total', 'Custo total'].includes(label);
          return (
            <div key={label} className={`flex items-center justify-between gap-3 rounded-lg px-2 py-1.5 ${emphasize ? 'bg-slate-950' : ''}`}>
              <span className="text-xs text-gray-500">{label}</span>
              <span className={`text-sm tabular-nums font-medium ${label === 'Lucro líquido' ? (val >= 0 ? 'text-emerald-400' : 'text-red-400') : 'text-gray-200'}`}>
                {formatCurrency(val)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function BreakdownSection({ totals }: { totals: MonthlyTotals }) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <BreakdownCard title="Detalhe — torneios de semana" results={totals.semana} />
      <BreakdownCard title="Detalhe — torneios de fim de semana" results={totals.fimDeSemana} />
    </div>
  );
}

export function PrintSection({ state, totals }: { state: SimulatorState; totals: MonthlyTotals }) {
  return (
    <section className="hidden print:block text-black">
      <h1>Padel Event ROI / Calculator</h1>
      <p>Lucro: {formatCurrency(totals.lucroLiquidoMensal)}</p>
      <p>Semana ({state.semana.numTorneios} torneios): {formatCurrency(totals.semana.lucroLiquido)}</p>
      <p>Fim de semana ({state.fimDeSemana.numTorneios} torneios): {formatCurrency(totals.fimDeSemana.lucroLiquido)}</p>
    </section>
  );
}
