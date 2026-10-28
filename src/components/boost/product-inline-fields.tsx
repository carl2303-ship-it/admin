'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState, useTransition } from 'react'
import { quickUpdateProduct } from '@/lib/boost/actions'
import { cn } from '@/lib/utils'
import { fieldClass } from './ui'

const compactField =
  fieldClass + ' max-w-[7.5rem] tabular-nums'

function useQuickSave() {
  const router = useRouter()
  const [pending, start] = useTransition()

  function save(
    id: string,
    field: 'price' | 'stock' | 'active',
    value: number | boolean
  ) {
    start(async () => {
      const result = await quickUpdateProduct(id, field, value)
      if (!result.ok) window.alert(result.error)
      router.refresh()
    })
  }

  return { pending, save }
}

export function ProductPriceInput({
  productId,
  price,
  disabled,
}: {
  productId: string
  price: number
  disabled?: boolean
}) {
  const { pending, save } = useQuickSave()
  const [value, setValue] = useState(String(Number(price).toFixed(2)))

  useEffect(() => {
    setValue(String(Number(price).toFixed(2)))
  }, [price])

  function commit() {
    const next = parseFloat(value.replace(',', '.'))
    if (Number.isNaN(next) || next < 0) {
      setValue(String(Number(price).toFixed(2)))
      return
    }
    const normalized = Math.round(next * 100) / 100
    setValue(normalized.toFixed(2))
    if (normalized === Number(price)) return
    save(productId, 'price', normalized)
  }

  return (
    <div className="flex items-center gap-1">
      <span className="text-xs font-bold text-cyan-400">€</span>
      <input
        type="number"
        inputMode="decimal"
        min={0}
        step="0.01"
        className={cn(compactField, 'font-bold text-cyan-300')}
        value={value}
        disabled={disabled || pending}
        aria-label="Preço"
        onChange={(e) => setValue(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.currentTarget.blur()
          }
        }}
      />
    </div>
  )
}

export function ProductStockInput({
  productId,
  stock,
  disabled,
}: {
  productId: string
  stock: number
  disabled?: boolean
}) {
  const { pending, save } = useQuickSave()
  const [value, setValue] = useState(String(stock ?? 0))

  useEffect(() => {
    setValue(String(stock ?? 0))
  }, [stock])

  function commit() {
    const next = parseInt(value, 10)
    if (Number.isNaN(next) || next < 0) {
      setValue(String(stock ?? 0))
      return
    }
    setValue(String(next))
    if (next === (stock ?? 0)) return
    save(productId, 'stock', next)
  }

  return (
    <input
      type="number"
      inputMode="numeric"
      min={0}
      step={1}
      className={compactField}
      value={value}
      disabled={disabled || pending}
      aria-label="Stock"
      onChange={(e) => setValue(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.currentTarget.blur()
        }
      }}
    />
  )
}

export function ProductActiveToggle({
  productId,
  active,
  disabled,
}: {
  productId: string
  active: boolean
  disabled?: boolean
}) {
  const { pending, save } = useQuickSave()

  return (
    <button
      type="button"
      disabled={disabled || pending}
      aria-pressed={active}
      aria-label={active ? 'Desactivar produto' : 'Activar produto'}
      title={active ? 'Clicar para inactivar' : 'Clicar para activar'}
      className={cn(
        'hub-touch inline-flex min-w-[4.5rem] items-center justify-center rounded-full px-2.5 py-1 text-xs font-bold transition',
        active
          ? 'border border-cyan-500/30 bg-cyan-500/15 text-cyan-300 hover:bg-cyan-500/25'
          : 'border border-slate-700 bg-slate-900 text-slate-400 hover:border-slate-500 hover:text-slate-200',
        (disabled || pending) && 'opacity-60'
      )}
      onClick={() => save(productId, 'active', !active)}
    >
      {pending ? '…' : active ? 'Ativo' : 'Inativo'}
    </button>
  )
}
