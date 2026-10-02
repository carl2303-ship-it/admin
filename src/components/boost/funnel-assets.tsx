'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import {
  deleteEbookFunnelAsset,
  uploadEbookFunnelAsset,
} from '@/lib/boost/actions'
import type { BoostEbookFunnelAsset } from '@/lib/boost/types'
import { EBOOK_FUNNEL_ASSET_KINDS } from '@/lib/boost/types'
import { btnGhost, btnPrimary } from './ui'

export function FunnelAssetUploader({
  funnelId,
  language,
  assets,
  canWrite,
}: {
  funnelId: string
  language: string
  assets: BoostEbookFunnelAsset[]
  canWrite: boolean
}) {
  const router = useRouter()
  const [pendingKind, setPendingKind] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [, start] = useTransition()

  const byKind = new Map(assets.map((a) => [a.kind, a]))

  return (
    <div className="space-y-3 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
      <h4 className="font-bold text-zinc-800">
        Materiais — {language.toUpperCase()}
      </h4>
      <ul className="space-y-3">
        {EBOOK_FUNNEL_ASSET_KINDS.map(({ kind, label, accept }) => {
          const existing = byKind.get(kind)
          return (
            <li
              key={kind}
              className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-100 pb-3 last:border-0"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-zinc-800">{label}</p>
                {existing ? (
                  <a
                    href={existing.public_url}
                    target="_blank"
                    rel="noreferrer"
                    className="truncate text-xs text-sky-700 underline"
                  >
                    {existing.file_name || existing.storage_path}
                  </a>
                ) : (
                  <p className="text-xs text-zinc-400">Ainda sem ficheiro</p>
                )}
              </div>
              {canWrite ? (
                <div className="flex items-center gap-2">
                  <label
                    className={
                      pendingKind === kind
                        ? `${btnPrimary} cursor-pointer opacity-50`
                        : `${btnPrimary} cursor-pointer`
                    }
                  >
                    {pendingKind === kind ? 'A enviar…' : 'Upload'}
                    <input
                      type="file"
                      accept={accept}
                      className="hidden"
                      disabled={pendingKind !== null}
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (!file) return
                        const fd = new FormData()
                        fd.set('file', file)
                        fd.set('funnel_id', funnelId)
                        fd.set('language', language)
                        fd.set('kind', kind)
                        setPendingKind(kind)
                        start(async () => {
                          setError(null)
                          const result = await uploadEbookFunnelAsset(fd)
                          setPendingKind(null)
                          if (!result.ok) {
                            setError(result.error)
                            return
                          }
                          router.refresh()
                        })
                        e.target.value = ''
                      }}
                    />
                  </label>
                  {existing ? (
                    <button
                      type="button"
                      className={btnGhost}
                      disabled={pendingKind !== null}
                      onClick={() => {
                        start(async () => {
                          setError(null)
                          const result = await deleteEbookFunnelAsset(
                            existing.id,
                            funnelId
                          )
                          if (!result.ok) {
                            setError(result.error)
                            return
                          }
                          router.refresh()
                        })
                      }}
                    >
                      Remover
                    </button>
                  ) : null}
                </div>
              ) : null}
            </li>
          )
        })}
      </ul>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </div>
  )
}
