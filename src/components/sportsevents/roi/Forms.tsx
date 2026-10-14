import { useState } from 'react';
import { Minus, Moon, Plus, Sun, Trophy } from 'lucide-react';

import {
  clamp,
  formatCurrency,
  formatInteger,
  formatPercent,
  parseLocaleNumber,
  roundTo,
} from '@/lib/sportsevents/tournament-roi/format';
import type { FieldConfig, TournamentInputs, TournamentResults } from '@/lib/sportsevents/tournament-roi/types';
import { FormStat } from '@/components/sportsevents/roi/ui';

export function TournamentFormCard({
  idPrefix,
  title,
  subtitle,
  accent,
  fields,
  values,
  results,
  onChange,
}: {
  idPrefix: string;
  title: string;
  subtitle: string;
  accent: 'week' | 'weekend';
  fields: FieldConfig[];
  values: TournamentInputs;
  results: TournamentResults;
  onChange: (key: keyof TournamentInputs, value: number) => void;
}) {
  const Icon = accent === 'week' ? Sun : Trophy;
  const groups = [
    { title: 'Operação', keys: ['numTorneios', 'camposPorTorneio', 'jogadoresPorTorneio', 'horasPorCampo', 'diasPorTorneio'] as const },
    { title: 'Preços', keys: ['precoAluguerCampoHora', 'precoInscricaoJogador'] as const },
    { title: 'Custos e patrocínios', keys: ['custoBebidaJogador', 'custoPremiosTorneio', 'custoDJTorneio', 'patrociniosTorneio', 'outrosGastosTorneio'] as const },
  ];

  return (
    <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden">
      <div className="flex items-start justify-between gap-3 border-b border-slate-800 p-4">
        <div className="flex items-center gap-3">
          <div className={`flex size-10 items-center justify-center rounded-lg ${accent === 'week' ? 'bg-amber-400/10 text-amber-400' : 'bg-sky-400/10 text-sky-400'}`}>
            <Icon size={20} />
          </div>
          <div>
            <h3 className="font-semibold text-gray-100">{title}</h3>
            <p className="text-xs text-gray-500">{subtitle}</p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full border border-slate-800 bg-slate-950 px-2 py-0.5 text-xs text-gray-400">
          {accent === 'week' ? <Sun size={12} /> : <Moon size={12} />}
          {formatInteger(values.numTorneios)} eventos
        </span>
      </div>

      <div className="space-y-5 p-4">
        {groups.map((group, index) => (
          <div key={group.title} className="space-y-3">
            {index > 0 && <div className="border-t border-slate-800" />}
            <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-500">{group.title}</p>
            <div className="grid gap-3 sm:grid-cols-2">
              {fields
                .filter((f) => (group.keys as readonly string[]).includes(f.key))
                .map((field) => (
                  <NumberField
                    key={field.key}
                    idPrefix={idPrefix}
                    config={field}
                    value={values[field.key]}
                    onChange={(v) => onChange(field.key, v)}
                  />
                ))}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3 border-t border-slate-800 bg-slate-950 p-4 sm:grid-cols-4">
        <FormStat label="Receita" value={formatCurrency(results.receitaTotal)} />
        <FormStat label="Custo" value={formatCurrency(results.custoTotal)} />
        <FormStat label="Lucro" value={formatCurrency(results.lucroLiquido)} highlight />
        <FormStat label="Margem" value={formatPercent(results.margemLucro)} />
      </div>
    </div>
  );
}

function NumberField({
  idPrefix,
  config,
  value,
  onChange,
}: {
  idPrefix: string;
  config: FieldConfig;
  value: number;
  onChange: (value: number) => void;
}) {
  const decimals = config.kind === 'count' ? 0 : config.kind === 'hours' ? 1 : 2;
  const fieldId = `${idPrefix}-${config.key}`;
  const [draft, setDraft] = useState<string | null>(null);
  const shown = draft ?? (decimals === 0 ? String(Math.round(value)) : value.toFixed(decimals));

  function commit(next: number) {
    const rounded = roundTo(clamp(next, config.min, config.max), decimals);
    setDraft(null);
    onChange(rounded);
  }

  const suffix = config.kind === 'currency' ? '€' : config.kind === 'hours' ? 'h' : null;

  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <label htmlFor={fieldId} className="text-xs font-medium text-gray-300">{config.label}</label>
        {config.hint && <span className="text-[10px] text-gray-500">{config.hint}</span>}
      </div>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => commit(value - config.step)}
          className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-slate-800 bg-slate-950 text-gray-400 hover:text-gray-100"
          aria-label={`Diminuir ${config.label}`}
        >
          <Minus size={14} />
        </button>
        <div className="relative min-w-0 flex-1">
          <input
            id={fieldId}
            inputMode="decimal"
            value={shown}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={() => {
              const parsed = parseLocaleNumber(shown);
              if (parsed === null) { setDraft(null); return; }
              commit(parsed);
            }}
            onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); }}
            className="h-8 w-full rounded-lg border border-slate-800 bg-slate-950 px-2 pr-7 text-right text-sm tabular-nums text-gray-100 outline-none focus:border-cyan-400/50"
          />
          {suffix && (
            <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-500">{suffix}</span>
          )}
        </div>
        <button
          type="button"
          onClick={() => commit(value + config.step)}
          className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-slate-800 bg-slate-950 text-gray-400 hover:text-gray-100"
          aria-label={`Aumentar ${config.label}`}
        >
          <Plus size={14} />
        </button>
      </div>
      <input
        type="range"
        min={config.min}
        max={config.max}
        step={config.step}
        value={value}
        onChange={(e) => commit(Number(e.target.value))}
        className="h-1 w-full cursor-pointer accent-cyan-500"
      />
    </div>
  );
}
