'use client'

import { cn } from '@/lib/utils'
import type { SimuladorParams } from '@/lib/sportsevents/simulador/types'

interface SliderFieldProps {
  label: string
  hint?: string
  value: number
  min: number
  max: number
  step?: number
  suffix?: string
  onChange: (value: number) => void
  accent?: 'cyan' | 'amber' | 'emerald'
}

interface NumberFieldProps {
  label: string
  hint?: string
  value: number
  min?: number
  max?: number
  step?: number
  suffix?: string
  onChange: (value: number) => void
}

const accentStyles = {
  cyan: 'accent-cyan-400',
  amber: 'accent-amber-400',
  emerald: 'accent-emerald-400',
}

export function SliderField({
  label,
  hint,
  value,
  min,
  max,
  step = 1,
  suffix = '',
  onChange,
  accent = 'cyan',
}: SliderFieldProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-end justify-between gap-3">
        <div>
          <label className="text-xs font-semibold text-slate-300">{label}</label>
          {hint && <p className="text-[10px] text-slate-500 mt-0.5">{hint}</p>}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <input
            type="number"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={(e) => {
              const next = Number(e.target.value)
              if (!Number.isNaN(next)) {
                onChange(Math.min(max, Math.max(min, next)))
              }
            }}
            className="w-20 bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-xs font-bold text-white text-right focus:outline-none focus:border-cyan-500/50"
          />
          {suffix && (
            <span className="text-[10px] text-slate-500 font-medium">{suffix}</span>
          )}
        </div>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className={cn('w-full h-1.5 rounded-full cursor-pointer', accentStyles[accent])}
      />
    </div>
  )
}

export function NumberField({
  label,
  hint,
  value,
  min,
  max,
  step = 1,
  suffix = '€',
  onChange,
}: NumberFieldProps) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-semibold text-slate-300">{label}</label>
      {hint && <p className="text-[10px] text-slate-500">{hint}</p>}
      <div className="flex items-center gap-2">
        <input
          type="number"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => {
            const next = Number(e.target.value)
            if (!Number.isNaN(next)) {
              let clamped = next
              if (min !== undefined) clamped = Math.max(min, clamped)
              if (max !== undefined) clamped = Math.min(max, clamped)
              onChange(clamped)
            }
          }}
          className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm font-bold text-white focus:outline-none focus:border-cyan-500/50"
        />
        {suffix && (
          <span className="text-xs text-slate-500 font-medium shrink-0">{suffix}</span>
        )}
      </div>
    </div>
  )
}

interface AccordionPanelProps {
  id: string
  title: string
  icon: React.ReactNode
  open: boolean
  onToggle: () => void
  children: React.ReactNode
  badge?: string
}

export function AccordionPanel({
  title,
  icon,
  open,
  onToggle,
  children,
  badge,
}: AccordionPanelProps) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left hover:bg-slate-800/40 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-cyan-400">
            {icon}
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">{title}</h3>
            {badge && (
              <span className="text-[10px] text-slate-500 font-medium">{badge}</span>
            )}
          </div>
        </div>
        <ChevronIcon open={open} />
      </button>
      {open && (
        <div className="px-5 pb-5 pt-1 space-y-5 border-t border-slate-800/80">
          {children}
        </div>
      )}
    </div>
  )
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      className={cn(
        'w-4 h-4 text-slate-500 transition-transform',
        open && 'rotate-180'
      )}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  )
}

export function ParamGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{children}</div>
}

export type ParamKey = keyof SimuladorParams

export function updateParam<K extends ParamKey>(
  setter: React.Dispatch<React.SetStateAction<SimuladorParams>>,
  key: K,
  value: SimuladorParams[K]
) {
  setter((prev) => ({ ...prev, [key]: value }))
}
