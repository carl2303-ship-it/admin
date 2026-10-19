'use client'

import { useCallback, useSyncExternalStore } from 'react'
import {
  DEFAULT_FIM_DE_SEMANA,
  DEFAULT_SEMANA,
  FIM_DE_SEMANA_FIELDS,
  META_MENSAL,
  SEMANA_FIELDS,
  STORAGE_KEY,
} from '@/lib/padel1/tournament-roi/defaults'
import { calculateMonthlyTotals } from '@/lib/padel1/tournament-roi/calculations'
import { formatCurrency } from '@/lib/padel1/tournament-roi/format'
import type {
  SimulatorState,
  TournamentInputs,
} from '@/lib/padel1/tournament-roi/types'
import { btnGhost, fieldClass, Panel } from './ui'

const DEFAULT_STATE: SimulatorState = {
  semana: DEFAULT_SEMANA,
  fimDeSemana: DEFAULT_FIM_DE_SEMANA,
}

let clientState: SimulatorState | null = null
const listeners = new Set<() => void>()

function readStoredState(): SimulatorState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_STATE
    const parsed = JSON.parse(raw) as Partial<SimulatorState>
    return {
      semana: { ...DEFAULT_SEMANA, ...parsed.semana },
      fimDeSemana: { ...DEFAULT_FIM_DE_SEMANA, ...parsed.fimDeSemana },
    }
  } catch {
    return DEFAULT_STATE
  }
}

function getClientSnapshot() {
  if (!clientState) clientState = readStoredState()
  return clientState
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function writeState(next: SimulatorState) {
  clientState = next
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  listeners.forEach((l) => l())
}

export function RoiPanel() {
  const state = useSyncExternalStore(
    subscribe,
    getClientSnapshot,
    () => DEFAULT_STATE
  )
  const totals = calculateMonthlyTotals(state)

  const update = useCallback(
    (modality: keyof SimulatorState, key: keyof TournamentInputs, value: number) => {
      writeState({
        ...getClientSnapshot(),
        [modality]: { ...getClientSnapshot()[modality], [key]: value },
      })
    },
    []
  )

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            label: 'Lucro líquido mensal',
            value: formatCurrency(totals.lucroLiquidoMensal),
          },
          {
            label: 'Receita mensal',
            value: formatCurrency(totals.receitaMensalTotal),
          },
          {
            label: 'Custos mensais',
            value: formatCurrency(totals.custoMensalTotal),
          },
          {
            label: `Meta €${META_MENSAL}`,
            value: totals.metaAtingida
              ? 'Atingida'
              : `Falta ${formatCurrency(Math.abs(totals.desvioMeta))}`,
          },
        ].map((k) => (
          <Panel key={k.label} className="p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
              {k.label}
            </p>
            <p className="mt-1 font-[family-name:var(--font-display)] text-2xl font-bold">
              {k.value}
            </p>
          </Panel>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {(
          [
            ['semana', SEMANA_FIELDS],
            ['fimDeSemana', FIM_DE_SEMANA_FIELDS],
          ] as const
        ).map(([modality, fields]) => (
          <Panel key={modality} className="space-y-3 p-4">
            <p className="font-semibold capitalize">
              {modality === 'semana' ? 'Semana' : 'Fim de semana'}
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              {fields.map((field) => (
                <label
                  key={field.key}
                  className="text-xs font-semibold text-slate-400"
                >
                  {field.label}
                  <input
                    type="number"
                    className={`${fieldClass} mt-1`}
                    min={field.min}
                    max={field.max}
                    step={field.step}
                    value={state[modality][field.key]}
                    onChange={(e) =>
                      update(modality, field.key, Number(e.target.value) || 0)
                    }
                  />
                </label>
              ))}
            </div>
          </Panel>
        ))}
      </div>

      <button
        type="button"
        className={btnGhost}
        onClick={() =>
          writeState({
            semana: { ...DEFAULT_SEMANA },
            fimDeSemana: { ...DEFAULT_FIM_DE_SEMANA },
          })
        }
      >
        Reset defaults
      </button>
      <p className="text-xs text-slate-400">
        Dados só no browser (localStorage{' '}
        <code>{STORAGE_KEY}</code>) — igual ao HQ do Manager.
      </p>
    </div>
  )
}
