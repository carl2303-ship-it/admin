'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react'

const WEEKDAYS = ['S', 'T', 'Q', 'Q', 'S', 'S', 'D']

function toIso(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function parseIso(iso: string): Date | null {
  if (!iso) return null
  const d = new Date(`${iso}T12:00:00`)
  return Number.isNaN(d.getTime()) ? null : d
}

function formatPt(iso: string) {
  const d = parseIso(iso)
  if (!d) return '\u2014'
  return d.toLocaleDateString('pt-PT', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function buildGrid(year: number, monthIndex: number) {
  const first = new Date(year, monthIndex, 1)
  const startPad = (first.getDay() + 6) % 7
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate()
  const cells: Array\u003c{ iso: string | null; day: number | null }\u003e = []
  for (let i = 0; i \u003c startPad; i++) cells.push({ iso: null, day: null })
  for (let day = 1; day \u003c= daysInMonth; day++) {
    cells.push({ iso: toIso(new Date(year, monthIndex, day)), day })
  }
  while (cells.length % 7 !== 0) cells.push({ iso: null, day: null })
  return cells
}

type Props = {
  startDate: string
  endDate: string
  onChange: (next: { startDate: string; endDate: string }) =\u003e void
  fixedNights?: number
  className?: string
}

export function MiniDateRangePicker({
  startDate,
  endDate,
  onChange,
  fixedNights = 0,
  className = '',
}: Props) {
  const rootRef = useRef\u003cHTMLDivElement\u003e(null)
  const initial = parseIso(startDate) || new Date()
  const [open, setOpen] = useState(false)
  const [picking, setPicking] = useState\u003c'start' | 'end'\u003e('start')
  const [cursor, setCursor] = useState({
    year: initial.getFullYear(),
    month: initial.getMonth(),
  })

  const cells = useMemo(
    () =\u003e buildGrid(cursor.year, cursor.month),
    [cursor.year, cursor.month]
  )

  const monthLabel = new Date(cursor.year, cursor.month, 1).toLocaleDateString(
    'pt-PT',
    { month: 'short', year: 'numeric' }
  )
  const todayIso = toIso(new Date())

  useEffect(() =\u003e {
    if (!open) return
    function onDoc(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () =\u003e document.removeEventListener('mousedown', onDoc)
  }, [open])

  function shiftMonth(delta: number) {
    setCursor((prev) =\u003e {
      const d = new Date(prev.year, prev.month + delta, 1)
      return { year: d.getFullYear(), month: d.getMonth() }
    })
  }

  function addNights(iso: string, nights: number) {
    const d = parseIso(iso)
    if (!d || !nights) return iso
    d.setDate(d.getDate() + nights)
    return toIso(d)
  }

  function openFor(which: 'start' | 'end') {
    const base = parseIso(which === 'end' && endDate ? endDate : startDate) || new Date()
    setCursor({ year: base.getFullYear(), month: base.getMonth() })
    setPicking(which)
    setOpen(true)
  }

  function pickDay(iso: string) {
    if (fixedNights \u003e 0) {
      onChange({ startDate: iso, endDate: addNights(iso, fixedNights) })
      setOpen(false)
      return
    }

    if (picking === 'start' || !startDate) {
      onChange({ startDate: iso, endDate: endDate && endDate \u003e= iso ? endDate : '' })
      setPicking('end')
      return
    }

    if (iso \u003c startDate) {
      onChange({ startDate: iso, endDate: startDate })
    } else {
      onChange({ startDate, endDate: iso })
    }
    setOpen(false)
    setPicking('start')
  }

  function inRange(iso: string) {
    if (!startDate || !endDate) return false
    return iso \u003e= startDate && iso \u003c= endDate
  }

  return (
    \u003cdiv ref={rootRef} className={`relative ${className}`}\u003e
      \u003cdiv className="grid grid-cols-2 gap-2"\u003e
        \u003cbutton
          type="button"
          onClick={() =\u003e openFor('start')}
          className={`flex items-center gap-2 rounded-xl border bg-slate-950 px-2.5 py-2 text-left transition-colors ${
            open && picking === 'start'
              ? 'border-cyan-500/50'
              : 'border-slate-700 hover:border-slate-500'
          }`}
        \u003e
          \u003cCalendarDays className="w-3.5 h-3.5 text-slate-500 shrink-0" /\u003e
          \u003cspan className="min-w-0"\u003e
            \u003cspan className="block text-[9px] font-bold uppercase tracking-wider text-slate-500"\u003e
              In\u00edcio
            \u003c/span\u003e
            \u003cspan className="block text-[11px] font-semibold text-white truncate"\u003e
              {formatPt(startDate)}
            \u003c/span\u003e
          \u003c/span\u003e
        \u003c/button\u003e
        \u003cbutton
          type="button"
          onClick={() =\u003e {
            if (fixedNights \u003e 0) openFor('start')
            else openFor(startDate ? 'end' : 'start')
          }}
          className={`flex items-center gap-2 rounded-xl border bg-slate-950 px-2.5 py-2 text-left transition-colors ${
            open && picking === 'end'
              ? 'border-cyan-500/50'
              : 'border-slate-700 hover:border-slate-500'
          }`}
        \u003e
          \u003cCalendarDays className="w-3.5 h-3.5 text-slate-500 shrink-0" /\u003e
          \u003cspan className="min-w-0"\u003e
            \u003cspan className="block text-[9px] font-bold uppercase tracking-wider text-slate-500"\u003e
              Fim{fixedNights \u003e 0 ? ` \u00b7 ${fixedNights}n` : ''}
            \u003c/span\u003e
            \u003cspan className="block text-[11px] font-semibold text-white truncate"\u003e
              {formatPt(endDate)}
            \u003c/span\u003e
          \u003c/span\u003e
        \u003c/button\u003e
      \u003c/div\u003e

      {open && (
        \u003cdiv className="absolute z-30 mt-1.5 w-[220px] rounded-xl border border-slate-700 bg-slate-950 shadow-xl shadow-black/40 p-2"\u003e
          \u003cdiv className="flex items-center justify-between mb-1"\u003e
            \u003cbutton
              type="button"
              onClick={() =\u003e shiftMonth(-1)}
              className="p-0.5 rounded text-slate-400 hover:text-cyan-300"
              aria-label="M\u00eas anterior"
            \u003e
              \u003cChevronLeft className="w-3.5 h-3.5" /\u003e
            \u003c/button\u003e
            \u003cspan className="text-[10px] font-bold text-white capitalize"\u003e
              {monthLabel}
            \u003c/span\u003e
            \u003cbutton
              type="button"
              onClick={() =\u003e shiftMonth(1)}
              className="p-0.5 rounded text-slate-400 hover:text-cyan-300"
              aria-label="M\u00eas seguinte"
            \u003e
              \u003cChevronRight className="w-3.5 h-3.5" /\u003e
            \u003c/button\u003e
          \u003c/div\u003e

          \u003cp className="text-[9px] text-slate-500 mb-1 px-0.5"\u003e
            {fixedNights \u003e 0
              ? 'Escolhe o in\u00edcio'
              : picking === 'end'
                ? 'Escolhe o fim'
                : 'Escolhe o in\u00edcio'}
          \u003c/p\u003e

          \u003cdiv className="grid grid-cols-7 gap-px mb-0.5"\u003e
            {WEEKDAYS.map((d, i) =\u003e (
              \u003cdiv
                key={`${d}-${i}`}
                className="h-5 flex items-center justify-center text-[8px] font-bold text-slate-600"
              \u003e
                {d}
              \u003c/div\u003e
            ))}
          \u003c/div\u003e

          \u003cdiv className="grid grid-cols-7 gap-px"\u003e
            {cells.map((cell, idx) =\u003e {
              if (!cell.iso) return \u003cdiv key={`e-${idx}`} className="h-6" /\u003e
              const isStart = cell.iso === startDate
              const isEnd = cell.iso === endDate
              const ranged = inRange(cell.iso)
              const isToday = cell.iso === todayIso
              return (
                \u003cbutton
                  key={cell.iso}
                  type="button"
                  onClick={() =\u003e pickDay(cell.iso!)}
                  className={`h-6 w-full rounded text-[10px] font-semibold ${
                    isStart || isEnd
                      ? 'bg-cyan-500 text-slate-950'
                      : ranged
                        ? 'bg-cyan-500/20 text-cyan-200'
                        : isToday
                          ? 'text-cyan-300 hover:bg-slate-800'
                          : 'text-slate-300 hover:bg-slate-800'
                  }`}
                \u003e
                  {cell.day}
                \u003c/button\u003e
              )
            })}
          \u003c/div\u003e
        \u003c/div\u003e
      )}
    \u003c/div\u003e
  )
}
