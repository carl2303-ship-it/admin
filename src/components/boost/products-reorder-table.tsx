'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useTransition, type DragEvent } from 'react'
import {
  deleteProduct,
  duplicateProduct,
  quickUpdateProduct,
  reorderProducts,
} from '@/lib/boost/actions'
import type { BoostProduct } from '@/lib/boost/types'
import { ActionButton } from '@/components/boost/action-buttons'
import {
  ProductActiveToggle,
  ProductPriceInput,
  ProductStockInput,
} from '@/components/boost/product-inline-fields'
import { StatusPill, TableShell, Th, Td } from '@/components/boost/ui'
import { cn } from '@/lib/utils'

type Row = Pick<
  BoostProduct,
  | 'id'
  | 'name'
  | 'slug'
  | 'price'
  | 'stock'
  | 'active'
  | 'is_featured'
  | 'is_digital'
  | 'image_url'
  | 'display_order'
> & {
  category?: { name: string } | null
}

function isSoldOut(p: Row): boolean {
  return !p.is_digital && Number(p.stock) === 0
}

export function ProductsReorderTable({
  products,
  canWrite,
}: {
  products: Row[]
  canWrite: boolean
}) {
  const router = useRouter()
  const [rows, setRows] = useState(products)
  const [dragId, setDragId] = useState<string | null>(null)
  const [overId, setOverId] = useState<string | null>(null)
  const [pending, start] = useTransition()

  useEffect(() => {
    setRows(products)
  }, [products])

  function persistOrder(next: Row[]) {
    setRows(next)
    if (!canWrite) return
    start(async () => {
      const result = await reorderProducts(next.map((p) => p.id))
      if (!result.ok) {
        window.alert(result.error)
        setRows(products)
        return
      }
      router.refresh()
    })
  }

  function onDragStart(id: string) {
    if (!canWrite || pending) return
    setDragId(id)
  }

  function onDragOver(e: DragEvent, id: string) {
    if (!canWrite || !dragId || dragId === id) return
    e.preventDefault()
    setOverId(id)
  }

  function onDrop(targetId: string) {
    if (!canWrite || !dragId || dragId === targetId) {
      setDragId(null)
      setOverId(null)
      return
    }
    const from = rows.findIndex((r) => r.id === dragId)
    const to = rows.findIndex((r) => r.id === targetId)
    setDragId(null)
    setOverId(null)
    if (from < 0 || to < 0) return
    const next = rows.slice()
    const [moved] = next.splice(from, 1)
    next.splice(to, 0, moved)
    persistOrder(next)
  }

  return (
    <div className="space-y-2">
      {canWrite && (
        <p className="text-xs text-slate-400">
          Arrasta pela pega ⋮⋮ para definir a ordem na loja. Destaques ficam
          primeiro; físicos esgotados (stock 0) afundam para o fim. Ordem
          custom = <code className="text-slate-300">display_order</code>.
          {pending ? ' A guardar…' : null}
        </p>
      )}
      <TableShell>
        <thead>
          <tr>
            {canWrite && <Th> </Th>}
            <Th>Produto</Th>
            <Th>Categoria</Th>
            <Th>Preço</Th>
            <Th>Stock</Th>
            <Th>Estado</Th>
            <Th>Acções</Th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr>
              <td
                colSpan={canWrite ? 7 : 6}
                className="border-b border-zinc-50 px-4 py-8 text-center text-slate-400"
              >
                Nenhum produto
              </td>
            </tr>
          )}
          {rows.map((p) => (
            <tr
              key={p.id}
              draggable={canWrite && !pending}
              onDragStart={() => onDragStart(p.id)}
              onDragOver={(e) => onDragOver(e, p.id)}
              onDrop={() => onDrop(p.id)}
              onDragEnd={() => {
                setDragId(null)
                setOverId(null)
              }}
              className={cn(
                'hover:bg-slate-900/80',
                dragId === p.id && 'opacity-50',
                overId === p.id && dragId && 'bg-cyan-950/40',
                isSoldOut(p) && 'opacity-80'
              )}
            >
              {canWrite && (
                <Td>
                  <span
                    className="cursor-grab select-none text-slate-500 active:cursor-grabbing"
                    title="Arrastar para reordenar"
                    aria-hidden
                  >
                    ⋮⋮
                  </span>
                </Td>
              )}
              <Td>
                <div className="flex items-center gap-3">
                  {p.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={p.image_url}
                      alt=""
                      className="h-10 w-10 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-lg bg-slate-800" />
                  )}
                  <div>
                    <p className="font-semibold">{p.name}</p>
                    <p className="text-xs text-slate-500">
                      {p.slug}
                      {typeof p.display_order === 'number'
                        ? ` · #${p.display_order}`
                        : null}
                      {isSoldOut(p) ? ' · esgotado' : null}
                    </p>
                  </div>
                </div>
              </Td>
              <Td>{p.category?.name || '—'}</Td>
              <Td>
                {canWrite ? (
                  <ProductPriceInput productId={p.id} price={Number(p.price)} />
                ) : (
                  <span className="font-bold text-cyan-400">
                    €{Number(p.price).toFixed(2)}
                  </span>
                )}
              </Td>
              <Td>
                {canWrite ? (
                  <ProductStockInput productId={p.id} stock={p.stock ?? 0} />
                ) : (
                  (p.stock ?? 0)
                )}
              </Td>
              <Td>
                <div className="flex flex-col gap-1">
                  {canWrite ? (
                    <ProductActiveToggle productId={p.id} active={p.active} />
                  ) : (
                    <StatusPill active={p.active} />
                  )}
                  {p.is_featured && (
                    <span className="text-[10px] font-bold text-amber-400">
                      ★ destaque
                    </span>
                  )}
                </div>
              </Td>
              <Td>
                <div className="flex flex-wrap gap-1.5">
                  {canWrite && (
                    <>
                      <Link
                        href={`/produtos/boost/produtos/${p.id}`}
                        className="text-xs font-bold text-cyan-400 hover:underline"
                      >
                        Editar
                      </Link>
                      <ActionButton
                        label={p.is_featured ? '★' : '☆'}
                        action={quickUpdateProduct.bind(
                          null,
                          p.id,
                          'is_featured',
                          !p.is_featured
                        )}
                      />
                      <ActionButton
                        label="Duplicar"
                        action={duplicateProduct.bind(null, p.id)}
                      />
                      <ActionButton
                        label="Eliminar"
                        variant="danger"
                        confirm={`Eliminar "${p.name}"?`}
                        action={deleteProduct.bind(null, p.id)}
                      />
                    </>
                  )}
                </div>
              </Td>
            </tr>
          ))}
        </tbody>
      </TableShell>
    </div>
  )
}
