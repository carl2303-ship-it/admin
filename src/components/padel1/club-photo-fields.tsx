'use client'

import { useRef, useState, useTransition } from 'react'
import { Image, Upload } from 'lucide-react'
import { uploadPadel1ClubPhoto } from '@/lib/padel1/actions'
import type { Padel1ClubForm } from '@/lib/padel1/types'
import { btnGhost } from './ui'

type PhotoField = 'logo_url' | 'photo_url_1' | 'photo_url_2'

export function ClubPhotoFields({
  form,
  setForm,
  disabled,
}: {
  form: Padel1ClubForm
  setForm: (f: Padel1ClubForm) => void
  disabled?: boolean
}) {
  const [pending, start] = useTransition()
  const [uploading, setUploading] = useState<PhotoField | null>(null)
  const logoRef = useRef<HTMLInputElement>(null)
  const photo1Ref = useRef<HTMLInputElement>(null)
  const photo2Ref = useRef<HTMLInputElement>(null)

  const upload = (file: File, field: PhotoField) => {
    setUploading(field)
    const fd = new FormData()
    fd.set('file', file)
    start(async () => {
      const r = await uploadPadel1ClubPhoto(fd)
      setUploading(null)
      if (!r.ok) {
        window.alert(r.error)
        return
      }
      setForm({ ...form, [field]: r.url })
    })
  }

  const slot = (
    field: PhotoField,
    label: string,
    inputRef: React.RefObject<HTMLInputElement | null>,
    icon: 'logo' | 'photo'
  ) => {
    const url = form[field]
    const busy = pending && uploading === field
    return (
      <div className="space-y-1">
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          disabled={disabled || pending}
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) upload(f, field)
            e.target.value = ''
          }}
        />
        {url ? (
          <div className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={url}
              alt=""
              className={
                field === 'logo_url'
                  ? 'h-12 w-12 rounded-lg border border-zinc-200 object-cover'
                  : 'h-20 max-w-[140px] rounded-lg border border-zinc-200 object-cover'
              }
            />
            <button
              type="button"
              className="text-xs font-semibold text-red-600 hover:underline"
              disabled={disabled || pending}
              onClick={() => setForm({ ...form, [field]: '' })}
            >
              Remover
            </button>
          </div>
        ) : (
          <button
            type="button"
            className={btnGhost}
            disabled={disabled || busy}
            onClick={() => inputRef.current?.click()}
          >
            {icon === 'logo' ? (
              <Upload className="mr-1 inline h-3.5 w-3.5" />
            ) : (
              <Image className="mr-1 inline h-3.5 w-3.5" />
            )}
            {busy ? 'A carregar…' : label}
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="sm:col-span-2 space-y-3 rounded-xl border border-zinc-200 bg-zinc-50/80 p-3">
      <p className="text-xs font-bold uppercase tracking-wide text-zinc-500">
        Logo e fotos (upload club-photos)
      </p>
      <div className="flex flex-wrap gap-6">
        <div>{slot('logo_url', 'Carregar logo', logoRef, 'logo')}</div>
        <div>{slot('photo_url_1', 'Foto 1', photo1Ref, 'photo')}</div>
        <div>{slot('photo_url_2', 'Foto 2', photo2Ref, 'photo')}</div>
      </div>
      <p className="text-[11px] text-zinc-500">
        Mesmo fluxo do HQ: ficheiro → bucket{' '}
        <code className="rounded bg-white px-1">club-photos/hq/…</code>
      </p>
    </div>
  )
}
