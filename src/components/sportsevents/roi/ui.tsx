import type { ReactNode } from 'react';

export const COST_COLORS = ['#22d3ee', '#a78bfa', '#fbbf24', '#f472b6', '#94a3b8'];
export const TOOLTIP_STYLE = {
  backgroundColor: '#0f172a',
  border: '1px solid #1e293b',
  borderRadius: 8,
  color: '#eee',
};

export type TabId = 'semana' | 'fimDeSemana';

export function KpiCard({ icon, label, value, color }: { icon: ReactNode; label: string; value: string; color: string }) {
  return (
    <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-gray-500">{label}</span>
        {icon}
      </div>
      <p className={`text-2xl font-bold tabular-nums ${color}`}>{value}</p>
    </div>
  );
}

export function MiniStat({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-lg bg-slate-950 border border-slate-800 px-3 py-2">
      <div className="flex items-center gap-1 text-gray-500 mb-0.5">{icon}<span className="text-[10px]">{label}</span></div>
      <p className="text-sm font-semibold tabular-nums">{value}</p>
    </div>
  );
}

export function FormStat({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div>
      <p className="text-[10px] text-gray-500">{label}</p>
      <p className={`text-sm font-semibold tabular-nums ${highlight ? 'text-emerald-400' : 'text-gray-200'}`}>{value}</p>
    </div>
  );
}

export function ActionButton({ onClick, icon, label, primary = false }: { onClick: () => void; icon: ReactNode; label: string; primary?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
        primary
          ? 'bg-cyan-500 text-slate-950 hover:bg-cyan-400'
          : 'border border-slate-800 bg-slate-900 text-gray-300 hover:text-gray-100'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}
