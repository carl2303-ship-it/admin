'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import {
  deleteEbookFunnelAsset,
  uploadEbookFunnelAsset,
} from '@/lib/boost/actions'
import type { BoostEbookFunnelAsset } from '@/lib/boost/types'
import {
  EBOOK_FUNNEL_ASSET_KINDS,
  canonicalFunnelAssetKind,
} from '@/lib/boost/types'
import { btnGhost, btnPrimary } from './ui'

function assetsForKind(
  assets: BoostEbookFunnelAsset[],
  kind: string
): BoostEbookFunnelAsset[] {
  return assets.filter((a) => {
    if (a.kind === kind) return true
    // Legado: mostrar cheat_sheet/audio etc. no slot thankyou_bonus / upsell
    return canonicalFunnelAssetKind(a.kind) === kind && a.kind !== kind
  })
}

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

  return (
    <div className="space-y-3 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
      <h4 className="font-bold text-zinc-800">
        Materiais — {language.toUpperCase()}
      </h4>
      <ul className="space-y-3">
        {EBOOK_FUNNEL_ASSET_KINDS.map(({ kind, label, accept, multiple, hint }) => {
          const existingList = assetsForKind(assets, kind)
          const existingSingle = multiple ? null : existingList[0] || null
          return (
            <li
              key={kind}
              className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-100 pb-3 last:border-0"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-zinc-800">{label}</p>
                {hint ? (
                  <p className="text-xs text-zinc-400">{hint}</p>
                ) : null}
                {multiple ? (
                  existingList.length ? (
                    <ul className="mt-1 space-y-1">
                      {existingList.map((ex) => (
                        <li key={ex.id} className="flex items-center gap-2">
                          <a
                            href={ex.public_url}
                            target="_blank"
                            rel="noreferrer"
                            className="truncate text-xs text-sky-700 underline"
                          >
                            {ex.file_name || ex.storage_path}
                            {ex.kind !== kind ? (
                              <span className="ml-1 text-zinc-400">
                                (legado: {ex.kind})
                              </span>
                            ) : null}
                          </a>
                          {canWrite ? (
                            <button
                              type="button"
                              className="text-xs text-zinc-500 underline"
                              disabled={pendingKind !== null}
                              onClick={() => {
                                start(async () => {
                                  setError(null)
                                  const result = await deleteEbookFunnelAsset(
                                    ex.id,
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
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-zinc-400">Ainda sem imagens</p>
                  )
                ) : existingSingle ? (
                  <a
                    href={existingSingle.public_url}
                    target="_blank"
                    rel="noreferrer"
                    className="truncate text-xs text-sky-700 underline"
                  >
                    {existingSingle.file_name || existingSingle.storage_path}
                    {existingSingle.kind !== kind ? (
                      <span className="ml-1 text-zinc-400">
                        (legado: {existingSingle.kind})
                      </span>
                    ) : null}
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
                      multiple={Boolean(multiple)}
                      className="hidden"
                      disabled={pendingKind !== null}
                      onChange={(e) => {
                        const files = Array.from(e.target.files || [])
                        if (!files.length) return
                        setPendingKind(kind)
                        start(async () => {
                          setError(null)
                          for (const file of files) {
                            const fd = new FormData()
                            fd.set('file', file)
                            fd.set('funnel_id', funnelId)
                            fd.set('language', language)
                            fd.set('kind', kind)
                            const result = await uploadEbookFunnelAsset(fd)
                            if (!result.ok) {
                              setError(result.error)
                              setPendingKind(null)
                              return
                            }
                          }
                          setPendingKind(null)
                          router.refresh()
                        })
                        e.target.value = ''
                      }}
                    />
                  </label>
                  {!multiple && existingSingle ? (
                    <button
                      type="button"
                      className={btnGhost}
                      disabled={pendingKind !== null}
                      onClick={() => {
                        start(async () => {
                          setError(null)
                          const result = await deleteEbookFunnelAsset(
                            existingSingle.id,
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
