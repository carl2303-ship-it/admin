'use client'

import { useState, useTransition } from 'react'
import {
  addProductToPadel1Marketplace,
  removeProductFromPadel1Marketplace,
} from '@/lib/boost/actions'
import { btnGhost, btnPrimary } from './ui'

export function MarketplacePadel1Toggle({
  productId,
  initiallyListed,
  initialError,
}: {
  productId: string
  initiallyListed: boolean
  /** Env/table missing — show once, still allow retry after migration. */
  initialError?: string | null
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

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-100">Marketplace Padel1</p>
          <p className="mt-0.5 text-xs text-slate-400">
            {listed
              ? 'Este produto está na lista oficial da Padel1.'
              : 'Publica este produto na lista do marketplace (source=store).'}
          </p>
        </div>
        <button
          type="button"
          disabled={pending}
          onClick={toggle}
          className={listed ? btnGhost : btnPrimary}
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
