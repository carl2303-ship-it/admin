'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import type { ActionResult } from '@/lib/boost/actions'
import { btnGhost, btnPrimary, fieldClass } from './ui'

type Field = {
  name: string
  label: string
  type?: 'text' | 'number' | 'checkbox' | 'textarea'
  defaultValue?: string | number | boolean
  required?: boolean
}

export function SimpleEntityForm({
  title,
  fields,
  hidden,
  action,
  onCancelHref,
}: {
  title: string
  fields: Field[]
  hidden?: Record<string, string>
  action: (fd: FormData) => Promise<ActionResult>
  onCancelHref: string
}) {
  const router = useRouter()
  const [pending, start] = useTransition()
  const [error, setError] = useState<string | null>(null)

  return (
    <form
      className="space-y-3 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm"
      action={(fd) => {
        start(async () => {
          setError(null)
          const result = await action(fd)
          if (!result.ok) {
            setError(result.error)
            return
          }
          router.refresh()
          if (!hidden?.id) {
            // after create, stay; parent may remount with empty — force navigation clear
            router.push(onCancelHref)
          }
        })
      }}
    >
      <h3 className="font-[family-name:var(--font-display)] text-lg font-bold">
        {title}
      </h3>
      {hidden &&
        Object.entries(hidden).map(([k, v]) => (
          <input key={k} type="hidden" name={k} value={v} />
        ))}
      <div className="grid gap-3 md:grid-cols-2">
        {fields.map((f) => {
          if (f.type === 'checkbox') {
            return (
              <label key={f.name} className="inline-flex items-center gap-2 text-sm md:col-span-2">
                <input
                  type="checkbox"
                  name={f.name}
                  defaultChecked={Boolean(f.defaultValue)}
                />
                {f.label}
              </label>
            )
          }
          if (f.type === 'textarea') {
            return (
              <label key={f.name} className="block space-y-1 md:col-span-2">
                <span className="text-xs font-bold uppercase text-zinc-500">
                  {f.label}
                </span>
                <textarea
                  name={f.name}
                  rows={3}
                  defaultValue={String(f.defaultValue ?? '')}
                  className={fieldClass}
                />
              </label>
            )
          }
          return (
            <label key={f.name} className="block space-y-1">
              <span className="text-xs font-bold uppercase text-zinc-500">
                {f.label}
              </span>
              <input
                name={f.name}
                type={f.type || 'text'}
                required={f.required}
                defaultValue={
                  f.defaultValue === undefined || f.defaultValue === null
                    ? ''
                    : String(f.defaultValue)
                }
                className={fieldClass}
              />
            </label>
          )
        })}
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex gap-2">
        <button type="submit" disabled={pending} className={btnPrimary}>
          {pending ? '…' : 'Guardar'}
        </button>
        <button
          type="button"
          className={btnGhost}
          onClick={() => router.push(onCancelHref)}
        >
          Limpar / cancelar
        </button>
      </div>
    </form>
  )
}
