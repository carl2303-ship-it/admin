'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { saveProduct } from '@/lib/boost/actions'
import type { BoostBrand, BoostCategory, BoostProduct } from '@/lib/boost/types'
import { btnGhost, btnPrimary, fieldClass } from './ui'

export function ProductForm({
  product,
  categories,
  brands,
}: {
  product?: BoostProduct | null
  categories: BoostCategory[]
  brands: BoostBrand[]
}) {
  const router = useRouter()
  const [pending, start] = useTransition()
  const [error, setError] = useState<string | null>(null)

  return (
    <form
      className="space-y-4"
      action={(fd) => {
        start(async () => {
          setError(null)
          const result = await saveProduct(fd)
          if (!result.ok) {
            setError(result.error)
            return
          }
          router.push('/produtos/boost/produtos')
          router.refresh()
        })
      }}
    >
      {product?.id && <input type="hidden" name="id" value={product.id} />}
      <div className="grid gap-4 md:grid-cols-2">
        <label className="block space-y-1">
          <span className="text-xs font-bold uppercase text-zinc-500">Nome</span>
          <input
            name="name"
            required
            defaultValue={product?.name || ''}
            className={fieldClass}
          />
        </label>
        <label className="block space-y-1">
          <span className="text-xs font-bold uppercase text-zinc-500">Slug</span>
          <input
            name="slug"
            defaultValue={product?.slug || ''}
            className={fieldClass}
            placeholder="auto se vazio"
          />
        </label>
        <label className="block space-y-1">
          <span className="text-xs font-bold uppercase text-zinc-500">
            Categoria
          </span>
          <select
            name="category_id"
            defaultValue={product?.category_id || ''}
            className={fieldClass}
          >
            <option value="">—</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block space-y-1">
          <span className="text-xs font-bold uppercase text-zinc-500">Marca</span>
          <select
            name="brand_id"
            defaultValue={product?.brand_id || ''}
            className={fieldClass}
          >
            <option value="">—</option>
            {brands.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block space-y-1">
          <span className="text-xs font-bold uppercase text-zinc-500">Preço €</span>
          <input
            name="price"
            type="number"
            step="0.01"
            min="0"
            required
            defaultValue={product?.price ?? 0}
            className={fieldClass}
          />
        </label>
        <label className="block space-y-1">
          <span className="text-xs font-bold uppercase text-zinc-500">
            Preço compare
          </span>
          <input
            name="compare_at_price"
            type="number"
            step="0.01"
            min="0"
            defaultValue={product?.compare_at_price ?? ''}
            className={fieldClass}
          />
        </label>
        <label className="block space-y-1">
          <span className="text-xs font-bold uppercase text-zinc-500">Stock</span>
          <input
            name="stock"
            type="number"
            min="0"
            defaultValue={product?.stock ?? 0}
            className={fieldClass}
          />
        </label>
        <label className="block space-y-1">
          <span className="text-xs font-bold uppercase text-zinc-500">
            Image URL
          </span>
          <input
            name="image_url"
            defaultValue={product?.image_url || ''}
            className={fieldClass}
          />
        </label>
      </div>
      <label className="block space-y-1">
        <span className="text-xs font-bold uppercase text-zinc-500">
          Descrição curta
        </span>
        <input
          name="short_description"
          defaultValue={product?.short_description || ''}
          className={fieldClass}
        />
      </label>
      <label className="block space-y-1">
        <span className="text-xs font-bold uppercase text-zinc-500">
          Descrição (HTML)
        </span>
        <textarea
          name="description"
          rows={6}
          defaultValue={product?.description || ''}
          className={fieldClass}
        />
      </label>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="block space-y-1">
          <span className="text-xs font-bold uppercase text-zinc-500">
            Download URL
          </span>
          <input
            name="download_url"
            defaultValue={product?.download_url || ''}
            className={fieldClass}
          />
        </label>
        <label className="block space-y-1">
          <span className="text-xs font-bold uppercase text-zinc-500">
            Video URL
          </span>
          <input
            name="video_url"
            defaultValue={product?.video_url || ''}
            className={fieldClass}
          />
        </label>
      </div>
      <div className="flex flex-wrap gap-4 text-sm">
        <label className="inline-flex items-center gap-2">
          <input
            type="checkbox"
            name="active"
            defaultChecked={product?.active ?? true}
          />
          Ativo
        </label>
        <label className="inline-flex items-center gap-2">
          <input
            type="checkbox"
            name="is_featured"
            defaultChecked={product?.is_featured ?? false}
          />
          Destaque
        </label>
        <label className="inline-flex items-center gap-2">
          <input
            type="checkbox"
            name="is_digital"
            defaultChecked={product?.is_digital ?? false}
          />
          Digital
        </label>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex gap-2">
        <button type="submit" disabled={pending} className={btnPrimary}>
          {pending ? 'A guardar…' : 'Guardar'}
        </button>
        <button
          type="button"
          className={btnGhost}
          onClick={() => router.push('/produtos/boost/produtos')}
        >
          Cancelar
        </button>
      </div>
    </form>
  )
}
