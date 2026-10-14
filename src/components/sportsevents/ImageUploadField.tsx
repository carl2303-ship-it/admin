'use client'

import { useRef, useState } from 'react'
import { ImagePlus, Loader2, Trash2 } from 'lucide-react'

type Props = {
  label?: string
  value: string
  onChange: (url: string) => void
  /** Pasta no storage: events | blog | cards | general | social */
  kind?: 'events' | 'blog' | 'cards' | 'general' | 'social'
  /** Subpasta (slug do evento/post/cartão) */
  slug?: string
  className?: string
  /** Endpoint alternativo (ex. /api/se/blog/upload). Default: media genérico. */
  uploadUrl?: string
  /** Campos extra no FormData do upload */
  extraFormFields?: Record<string, string>
  allowUrlFallback?: boolean
  previewAspect?: 'video' | 'square'
}

export function ImageUploadField({
  label = 'Imagem',
  value,
  onChange,
  kind = 'general',
  slug = 'draft',
  className = '',
  uploadUrl = '/api/se/media/upload',
  extraFormFields,
  allowUrlFallback = false,
  previewAspect = 'video',
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showUrl, setShowUrl] = useState(false)

  async function onFile(file: File | null) {
    if (!file) return
    setError(null)
    setUploading(true)
    try {
      const body = new FormData()
      body.append('file', file)
      body.append('kind', kind)
      body.append('slug', slug || 'draft')
      if (extraFormFields) {
        for (const [k, v] of Object.entries(extraFormFields)) {
          body.append(k, v)
        }
      }
      const res = await fetch(uploadUrl, { method: 'POST', body })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Erro no upload')
        return
      }
      onChange(String(data.url || ''))
    } catch {
      setError('Erro de rede no upload.')
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  const previewCls =
    previewAspect === 'square'
      ? 'h-28 w-28'
      : 'h-28 w-44'

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
          {label}
        </span>
      )}
      <div className="flex flex-wrap items-start gap-3">
        <div
          className={`relative overflow-hidden rounded-xl border border-slate-700 bg-slate-950 ${previewCls}`}
        >
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-[10px] text-slate-600">
              Sem imagem
            </div>
          )}
        </div>

        <div className="space-y-2 min-w-[180px] flex-1">
          <div className="flex flex-wrap gap-2">
            <label
              className={`inline-flex cursor-pointer items-center gap-2 rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-3 py-2 text-xs font-semibold text-cyan-300 hover:border-cyan-400/50 ${
                uploading ? 'opacity-60 pointer-events-none' : ''
              }`}
            >
              {uploading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <ImagePlus className="w-3.5 h-3.5" />
              )}
              {uploading ? 'A carregar…' : 'Carregar imagem'}
              <input
                ref={inputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                disabled={uploading}
                onChange={(e) => void onFile(e.target.files?.[0] || null)}
              />
            </label>
            {value && (
              <button
                type="button"
                onClick={() => onChange('')}
                className="inline-flex items-center gap-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs font-semibold text-rose-300 hover:border-rose-400/50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Remover
              </button>
            )}
          </div>
          <p className="text-[10px] text-slate-500">
            JPG, PNG, WebP ou GIF · máx. 10 MB — sem precisar de link
          </p>
          {allowUrlFallback && (
            <div>
              <button
                type="button"
                onClick={() => setShowUrl((v) => !v)}
                className="text-[10px] text-slate-500 hover:text-slate-300 underline-offset-2 hover:underline"
              >
                {showUrl ? 'Esconder URL' : 'Ou colar URL'}
              </button>
              {showUrl && (
                <input
                  className="mt-1.5 w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500/50"
                  value={value}
                  onChange={(e) => onChange(e.target.value)}
                  placeholder="https://…"
                />
              )}
            </div>
          )}
          {error && (
            <p className="text-[11px] text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg px-2 py-1.5">
              {error}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
