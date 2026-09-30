'use client'

import { useState } from 'react'
import { btnGhost, fieldClass } from './ui'

export type ColorRow = { name: string; hex: string }

function parseColors(raw: unknown): ColorRow[] {
  if (!Array.isArray(raw)) return [{ name: '', hex: '#000000' }]
  const rows = raw
    .map((c) => {
      if (!c || typeof c !== 'object') return null
      const o = c as { name?: unknown; hex?: unknown }
      return {
        name: String(o.name || ''),
        hex: String(o.hex || '#000000'),
      }
    })
    .filter(Boolean) as ColorRow[]
  return rows.length > 0 ? rows : [{ name: '', hex: '#000000' }]
}

function parseSizes(raw: unknown): string[] {
  if (!Array.isArray(raw)) return ['']
  const rows = raw.map((s) => String(s || '')).filter((s) => s !== undefined)
  return rows.length > 0 ? rows : ['']
}

export function ColorSizeFields({
  defaultColors,
  defaultSizes,
}: {
  defaultColors?: unknown
  defaultSizes?: unknown
}) {
  const [colors, setColors] = useState<ColorRow[]>(() =>
    parseColors(defaultColors)
  )
  const [sizes, setSizes] = useState<string[]>(() => parseSizes(defaultSizes))

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <input type="hidden" name="colors_json" value={JSON.stringify(colors)} />
      <input type="hidden" name="sizes_json" value={JSON.stringify(sizes)} />

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase text-zinc-500">Cores</span>
          <button
            type="button"
            className={btnGhost}
            onClick={() =>
              setColors((prev) => [...prev, { name: '', hex: '#000000' }])
            }
          >
            + Cor
          </button>
        </div>
        <div className="space-y-2">
          {colors.map((c, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Nome (ex: Preto)"
                value={c.name}
                onChange={(e) => {
                  const next = [...colors]
                  next[i] = { ...next[i], name: e.target.value }
                  setColors(next)
                }}
                className={fieldClass}
              />
              <input
                type="color"
                value={c.hex || '#000000'}
                onChange={(e) => {
                  const next = [...colors]
                  next[i] = { ...next[i], hex: e.target.value }
                  setColors(next)
                }}
                className="h-10 w-14 rounded-lg border border-zinc-300"
              />
              <button
                type="button"
                className="rounded-lg bg-red-500 px-2 py-1 text-xs font-bold text-white"
                onClick={() => {
                  if (colors.length <= 1) {
                    setColors([{ name: '', hex: '#000000' }])
                    return
                  }
                  setColors(colors.filter((_, idx) => idx !== i))
                }}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase text-zinc-500">
            Tamanhos
          </span>
          <button
            type="button"
            className={btnGhost}
            onClick={() => setSizes((prev) => [...prev, ''])}
          >
            + Tamanho
          </button>
        </div>
        <div className="space-y-2">
          {sizes.map((s, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Tamanho (ex: M, 42)"
                value={s}
                onChange={(e) => {
                  const next = [...sizes]
                  next[i] = e.target.value
                  setSizes(next)
                }}
                className={fieldClass}
              />
              <button
                type="button"
                className="rounded-lg bg-red-500 px-2 py-1 text-xs font-bold text-white"
                onClick={() => {
                  if (sizes.length <= 1) {
                    setSizes([''])
                    return
                  }
                  setSizes(sizes.filter((_, idx) => idx !== i))
                }}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
