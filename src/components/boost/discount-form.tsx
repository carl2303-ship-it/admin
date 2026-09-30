'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { saveDiscount } from '@/lib/boost/actions'
import type { BoostDiscount, BoostProduct } from '@/lib/boost/types'
import { btnGhost, btnPrimary, fieldClass } from './ui'

export function DiscountForm({
  discount,
  products,
}: {
  discount?: BoostDiscount | null
  products: Pick<BoostProduct, 'id' | 'name' | 'active'>[]
}) {
  const router = useRouter()
  const [pending, start] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [appliesTo, setAppliesTo] = useState(
    discount?.applies_to || 'all'
  )
  const [selected, setSelected] = useState<string[]>(
    Array.isArray(discount?.product_ids) ? discount!.product_ids! : []
  )

  const activeProducts = products.filter((p) => p.active !== false)

  return (
    <form
      className="space-y-3 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm"
      action={(fd) => {
        start(async () => {
          setError(null)
          if (appliesTo === 'specific_products' && selected.length === 0) {
            setError('Selecione pelo menos um produto')
            return
          }
          fd.set('applies_to', appliesTo)
          fd.set('product_ids_json', JSON.stringify(selected))
          const result = await saveDiscount(fd)
          if (!result.ok) {
            setError(result.error)
            return
          }
          router.push('/produtos/boost/descontos')
          router.refresh()
        })
      }}
    >
      <h3 className="font-[family-name:var(--font-display)] text-lg font-bold">
        {discount ? 'Editar código' : 'Novo código'}
      </h3>
      {discount?.id && <input type="hidden" name="id" value={discount.id} />}
      <div className="grid gap-3 md:grid-cols-2">
        <label className="block space-y-1">
          <span className="text-xs font-bold uppercase text-zinc-500">
            Código
          </span>
          <input
            name="code"
            required
            defaultValue={discount?.code || ''}
            className={fieldClass}
          />
        </label>
        <label className="block space-y-1">
          <span className="text-xs font-bold uppercase text-zinc-500">Tipo</span>
          <select
            name="type"
            defaultValue={discount?.type || 'percentage'}
            className={fieldClass}
          >
            <option value="percentage">Percentagem</option>
            <option value="fixed">Valor fixo (€)</option>
          </select>
        </label>
        <label className="block space-y-1">
          <span className="text-xs font-bold uppercase text-zinc-500">
            Valor (% ou €)
          </span>
          <input
            name="value"
            type="number"
            step="0.01"
            min="0"
            required
            defaultValue={discount?.value ?? 10}
            className={fieldClass}
          />
        </label>
        <label className="block space-y-1">
          <span className="text-xs font-bold uppercase text-zinc-500">
            Descrição
          </span>
          <input
            name="description"
            defaultValue={discount?.description || ''}
            className={fieldClass}
          />
        </label>
        <label className="block space-y-1">
          <span className="text-xs font-bold uppercase text-zinc-500">
            Mín. compra
          </span>
          <input
            name="min_purchase"
            type="number"
            step="0.01"
            min="0"
            defaultValue={discount?.min_purchase ?? 0}
            className={fieldClass}
          />
        </label>
        <label className="block space-y-1">
          <span className="text-xs font-bold uppercase text-zinc-500">
            Máx. usos
          </span>
          <input
            name="max_uses"
            type="number"
            min="0"
            defaultValue={discount?.max_uses ?? ''}
            className={fieldClass}
          />
        </label>
        <label className="block space-y-1">
          <span className="text-xs font-bold uppercase text-zinc-500">
            Aplica-se a
          </span>
          <select
            name="applies_to_ui"
            value={appliesTo}
            onChange={(e) => setAppliesTo(e.target.value)}
            className={fieldClass}
          >
            <option value="all">Todo o site</option>
            <option value="category">Categoria</option>
            <option value="specific_products">Produtos específicos</option>
          </select>
        </label>
        <label className="block space-y-1">
          <span className="text-xs font-bold uppercase text-zinc-500">
            Válido de
          </span>
          <input
            name="valid_from"
            type="datetime-local"
            defaultValue={
              discount?.valid_from
                ? new Date(discount.valid_from).toISOString().slice(0, 16)
                : ''
            }
            className={fieldClass}
          />
        </label>
        <label className="block space-y-1">
          <span className="text-xs font-bold uppercase text-zinc-500">
            Válido até
          </span>
          <input
            name="valid_until"
            type="datetime-local"
            defaultValue={
              discount?.valid_until
                ? new Date(discount.valid_until).toISOString().slice(0, 16)
                : ''
            }
            className={fieldClass}
          />
        </label>
        <label className="inline-flex items-center gap-2 text-sm md:col-span-2">
          <input
            type="checkbox"
            name="active"
            defaultChecked={discount?.active ?? true}
          />
          Ativo
        </label>
      </div>

      {appliesTo === 'category' && (
        <label className="block space-y-1">
          <span className="text-xs font-bold uppercase text-zinc-500">
            Categoria
          </span>
          <select
            name="category"
            defaultValue={discount?.category || ''}
            className={fieldClass}
            required
          >
            <option value="">— seleccionar —</option>
            <option value="protetor">Protetores Nomashock</option>
            <option value="4on">Produtos 4ON</option>
            <option value="nutricao">Nutrição 4Endurance</option>
            <option value="vestuario">Vestuário Portugal</option>
            <option value="digital">Produtos Digitais</option>
            <option value="estagio">Estágios</option>
          </select>
        </label>
      )}

      {appliesTo === 'specific_products' && (
        <div className="max-h-56 space-y-1 overflow-y-auto rounded-xl border border-zinc-200 p-3">
          <p className="mb-2 text-xs font-bold uppercase text-zinc-500">
            Produtos ({selected.length} seleccionados)
          </p>
          {activeProducts.length === 0 ? (
            <p className="text-sm text-zinc-500">Nenhum produto activo</p>
          ) : (
            activeProducts.map((p) => {
              const checked = selected.includes(p.id)
              return (
                <label
                  key={p.id}
                  className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-zinc-50"
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => {
                      setSelected((prev) =>
                        checked
                          ? prev.filter((id) => id !== p.id)
                          : [...prev, p.id]
                      )
                    }}
                  />
                  {p.name}
                </label>
              )
            })
          )}
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex gap-2">
        <button type="submit" disabled={pending} className={btnPrimary}>
          {pending ? '…' : 'Guardar'}
        </button>
        <button
          type="button"
          className={btnGhost}
          onClick={() => router.push('/produtos/boost/descontos')}
        >
          Limpar / cancelar
        </button>
      </div>
    </form>
  )
}
