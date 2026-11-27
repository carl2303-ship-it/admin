'use client'

import { useState, useTransition } from 'react'
import {
  addProductToPadel1Marketplace,
  removeProductFromPadel1Marketplace,
} from '@/lib/boost/actions'
import { btnDanger, btnGhost, btnPrimary } from './ui'
import { cn } from '@/lib/utils'

export function MarketplacePadel1Toggle({
  productId,
  initiallyListed,
  initialError,
  compact = false,
}: {
  productId: string
  initiallyListed: boolean
  /** Env/table missing — show once, still allow retry after migration. */
  initialError?: string | null
  /** Row action on the products list (short label). */
  compact?: boolean
}) {
  const [listed, setListed] = useState(initiallyListed)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(initialError ?? null)
  const [pending, start] = useTransition()

  function toggle() {
    start(async () => {
      setError(null)
      setMessage(null)
      const result = listed
        ? await removeProductFromPadel1Marketplace(productId)
        : await addProductToPadel1Marketplace(productId)
      if (!result.ok) {
        setError(result.error)
        return
      }
      setListed(!listed)
      setMessage(result.message || (listed ? 'Removido' : 'Adicionado'))
    })
  }

  if (compact) {
    return (
      <div className="flex flex-col items-start gap-0.5">
        <button
          type="button"
          disabled={pending}
          onClick={toggle}
          title={
            listed
              ? 'Remover este produto da lista Padel1'
              : 'Adicionar este produto à lista Padel1'
          }
          className={cn(
            listed ? btnGhost : btnPrimary,
            'px-2 py-1 text-[11px] leading-tight'
          )}
        >
          {pending ? '…' : listed ? 'Remover Padel1' : '→ Padel1'}
        </button>
        {error && (
          <span className="max-w-[11rem] text-[10px] leading-snug text-amber-200/90">
            {error}
          </span>
        )}
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-cyan-500/40 bg-cyan-500/10 px-4 py-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-cyan-100">
            Marketplace Padel1
          </p>
          <p className="mt-0.5 text-xs text-slate-300">
            {listed
              ? 'Este produto está na lista oficial da Padel1.'
              : 'Publica este produto na lista do marketplace com um clique.'}
          </p>
        </div>
        <button
          type="button"
          disabled={pending}
          onClick={toggle}
          className={listed ? btnDanger : btnPrimary}
        >
          {pending
            ? 'A sincronizar…'
            : listed
              ? 'Remover da Padel1'
              : 'Adicionar à Padel1'}
        </button>
      </div>
      {message && (
        <p className="mt-2 text-xs font-medium text-cyan-300">{message}</p>
      )}
      {error && (
        <p className="mt-2 text-xs text-amber-200/90">{error}</p>
      )}
    </div>
  )
}
