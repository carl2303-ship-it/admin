'use client'

import { useState, useTransition } from 'react'
import { uploadBoostImage } from '@/lib/boost/actions'
import { btnGhost, fieldClass } from './ui'

export function ImageUploadField({
  name,
  label,
  defaultValue = '',
  folder = 'products',
}: {
  name: string
  label: string
  defaultValue?: string
  folder?: string
}) {
  const [url, setUrl] = useState(defaultValue)
  const [error, setError] = useState<string | null>(null)
  const [pending, start] = useTransition()

  return (
    <div className="space-y-2">
      <span className="text-xs font-bold uppercase text-zinc-500">{label}</span>
      <div className="flex flex-wrap items-center gap-2">
        <input
          name={name}
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className={fieldClass}
          placeholder="URL ou faz upload..."
        />
        <label
          className={
            pending
              ? `${btnGhost} cursor-pointer opacity-50`
              : `${btnGhost} cursor-pointer`
          }
        >
          {pending ? 'A enviar...' : 'Upload'}
          <input
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
            className="hidden"
            disabled={pending}
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (!file) return
              const fd = new FormData()
              fd.set('file', file)
              fd.set('folder', folder)
              start(async () => {
                setError(null)
                const result = await uploadBoostImage(fd)
                if (!result.ok) {
                  setError(result.error)
                  return
                }
                setUrl(result.url)
              })
              e.target.value = ''
            }}
          />
        </label>
      </div>
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={url}
          alt="Preview"
          className="h-24 w-24 rounded-lg border border-zinc-200 object-cover"
        />
      ) : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </div>
  )
}

export function AdditionalImagesField({
  name,
  defaultUrls = [],
  folder = 'products/additional',
}: {
  name: string
  defaultUrls?: string[]
  folder?: string
}) {
  const [urls, setUrls] = useState<string[]>(defaultUrls)
  const [manual, setManual] = useState(defaultUrls.join('\n'))
  const [error, setError] = useState<string | null>(null)
  const [pending, start] = useTransition()

  function sync(next: string[]) {
    setUrls(next)
    setManual(next.join('\n'))
  }

  return (
    <div className="space-y-2">
      <span className="text-xs font-bold uppercase text-zinc-500">
        Imagens adicionais
      </span>
      <textarea
        name={name}
        rows={3}
        value={manual}
        onChange={(e) => {
          setManual(e.target.value)
          setUrls(
            e.target.value
              .split('\n')
              .map((u) => u.trim())
              .filter(Boolean)
          )
        }}
        className={fieldClass}
        placeholder="Uma URL por linha"
      />
      <label
        className={
          pending
            ? `${btnGhost} inline-flex cursor-pointer opacity-50`
            : `${btnGhost} inline-flex cursor-pointer`
        }
      >
        {pending ? 'A enviar...' : 'Upload multi'}
        <input
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
          multiple
          className="hidden"
          disabled={pending}
          onChange={(e) => {
            const files = Array.from(e.target.files || [])
            if (files.length === 0) return
            start(async () => {
              setError(null)
              const uploaded: string[] = []
              for (const file of files) {
                const fd = new FormData()
                fd.set('file', file)
                fd.set('folder', folder)
                const result = await uploadBoostImage(fd)
                if (!result.ok) {
                  setError(result.error)
                  continue
                }
                uploaded.push(result.url)
              }
              if (uploaded.length) sync([...urls, ...uploaded])
            })
            e.target.value = ''
          }}
        />
      </label>
      {urls.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {urls.map((u) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={u}
              src={u}
              alt=""
              className="h-16 w-16 rounded-lg border border-zinc-200 object-cover"
            />
          ))}
        </div>
      ) : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </div>
  )
}
