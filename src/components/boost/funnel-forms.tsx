'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import {
  createEbookFunnel,
  updateEbookFunnel,
  type ActionResult,
} from '@/lib/boost/actions'
import type { BoostEbookFunnel } from '@/lib/boost/types'
import { EBOOK_FUNNEL_LANGUAGES } from '@/lib/boost/types'
import { btnGhost, btnPrimary, fieldClass } from './ui'

function centsToEurosInput(cents: number) {
  return (cents / 100).toFixed(2)
}

export function FunnelCreateForm() {
  const router = useRouter()
  const [pending, start] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [langs, setLangs] = useState<string[]>(['pt'])

  function toggleLang(code: string) {
    setLangs((prev) =>
      prev.includes(code)
        ? prev.filter((l) => l !== code)
        : [...prev, code].sort()
    )
  }

  return (
    <form
      className="space-y-3 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm"
      action={(fd) => {
        fd.set('languages', langs.join(','))
        start(async () => {
          setError(null)
          const result = (await createEbookFunnel(fd)) as ActionResult & {
            id?: string
          }
          if (!result.ok) {
            setError(result.error)
            return
          }
          router.push(
            result.id
              ? `/produtos/boost/funis/${result.id}`
              : '/produtos/boost/funis'
          )
          router.refresh()
        })
      }}
    >
      <h3 className="font-[family-name:var(--font-display)] text-lg font-bold">
        Novo funil ebook
      </h3>
      <p className="text-sm text-zinc-500">
        Cria o funil com preços e idiomas. Os productType Stripe são gerados
        automaticamente (<code>ebook_&lt;slug&gt;</code> /{' '}
        <code>upsell_&lt;slug&gt;</code>).
      </p>
      <div className="grid gap-3 md:grid-cols-2">
        <label className="block space-y-1 md:col-span-2">
          <span className="text-xs font-bold uppercase text-zinc-500">
            Título
          </span>
          <input name="title" required className={fieldClass} />
        </label>
        <label className="block space-y-1">
          <span className="text-xs font-bold uppercase text-zinc-500">
            Slug (URL)
          </span>
          <input
            name="slug"
            placeholder="auto a partir do título"
            className={fieldClass}
          />
        </label>
        <label className="block space-y-1">
          <span className="text-xs font-bold uppercase text-zinc-500">
            Preço ebook (€)
          </span>
          <input
            name="ebook_price"
            type="number"
            step="0.01"
            min="0.01"
            required
            defaultValue="39.00"
            className={fieldClass}
          />
        </label>
        <label className="block space-y-1">
          <span className="text-xs font-bold uppercase text-zinc-500">
            Preço upsell (€)
          </span>
          <input
            name="upsell_price"
            type="number"
            step="0.01"
            min="0.01"
            required
            defaultValue="49.00"
            className={fieldClass}
          />
        </label>
        <label className="block space-y-1 md:col-span-2">
          <span className="text-xs font-bold uppercase text-zinc-500">
            Headline landing
          </span>
          <input name="headline" className={fieldClass} />
        </label>
        <label className="block space-y-1 md:col-span-2">
          <span className="text-xs font-bold uppercase text-zinc-500">
            Subheadline
          </span>
          <textarea name="subheadline" rows={2} className={fieldClass} />
        </label>
        <label className="block space-y-1">
          <span className="text-xs font-bold uppercase text-zinc-500">
            Texto CTA
          </span>
          <input
            name="cta_label"
            defaultValue="Comprar agora"
            className={fieldClass}
          />
        </label>
        <label className="block space-y-1">
          <span className="text-xs font-bold uppercase text-zinc-500">
            Nome Stripe (ebook)
          </span>
          <input
            name="stripe_ebook_name"
            placeholder="Igual ao título se vazio"
            className={fieldClass}
          />
        </label>
        <label className="block space-y-1 md:col-span-2">
          <span className="text-xs font-bold uppercase text-zinc-500">
            Nome Stripe (upsell)
          </span>
          <input name="stripe_upsell_name" className={fieldClass} />
        </label>
      </div>
      <div>
        <p className="mb-2 text-xs font-bold uppercase text-zinc-500">
          Idiomas
        </p>
        <div className="flex flex-wrap gap-2">
          {EBOOK_FUNNEL_LANGUAGES.map((code) => (
            <label
              key={code}
              className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 px-2.5 py-1.5 text-sm"
            >
              <input
                type="checkbox"
                checked={langs.includes(code)}
                onChange={() => toggleLang(code)}
              />
              {code.toUpperCase()}
            </label>
          ))}
        </div>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button type="submit" disabled={pending} className={btnPrimary}>
        {pending ? 'A criar…' : 'Criar funil'}
      </button>
    </form>
  )
}

export function FunnelEditForm({ funnel }: { funnel: BoostEbookFunnel }) {
  const router = useRouter()
  const [pending, start] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [langs, setLangs] = useState<string[]>(
    funnel.languages?.length ? funnel.languages : ['pt']
  )

  function toggleLang(code: string) {
    setLangs((prev) =>
      prev.includes(code)
        ? prev.filter((l) => l !== code)
        : [...prev, code].sort()
    )
  }

  return (
    <form
      className="space-y-3 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm"
      action={(fd) => {
        fd.set('languages', langs.join(','))
        start(async () => {
          setError(null)
          const result = await updateEbookFunnel(fd)
          if (!result.ok) {
            setError(result.error)
            return
          }
          router.refresh()
        })
      }}
    >
      <input type="hidden" name="id" value={funnel.id} />
      <h3 className="font-[family-name:var(--font-display)] text-lg font-bold">
        Editar funil
      </h3>
      <div className="grid gap-3 md:grid-cols-2">
        <label className="block space-y-1 md:col-span-2">
          <span className="text-xs font-bold uppercase text-zinc-500">
            Título
          </span>
          <input
            name="title"
            required
            defaultValue={funnel.title}
            className={fieldClass}
          />
        </label>
        <label className="block space-y-1">
          <span className="text-xs font-bold uppercase text-zinc-500">
            Preço ebook (€)
          </span>
          <input
            name="ebook_price"
            type="number"
            step="0.01"
            min="0.01"
            required
            defaultValue={centsToEurosInput(funnel.ebook_price_cents)}
            className={fieldClass}
          />
        </label>
        <label className="block space-y-1">
          <span className="text-xs font-bold uppercase text-zinc-500">
            Preço upsell (€)
          </span>
          <input
            name="upsell_price"
            type="number"
            step="0.01"
            min="0.01"
            required
            defaultValue={centsToEurosInput(funnel.upsell_price_cents)}
            className={fieldClass}
          />
        </label>
        <label className="block space-y-1 md:col-span-2">
          <span className="text-xs font-bold uppercase text-zinc-500">
            Headline
          </span>
          <input
            name="headline"
            defaultValue={funnel.headline}
            className={fieldClass}
          />
        </label>
        <label className="block space-y-1 md:col-span-2">
          <span className="text-xs font-bold uppercase text-zinc-500">
            Subheadline
          </span>
          <textarea
            name="subheadline"
            rows={2}
            defaultValue={funnel.subheadline}
            className={fieldClass}
          />
        </label>
        <label className="block space-y-1">
          <span className="text-xs font-bold uppercase text-zinc-500">CTA</span>
          <input
            name="cta_label"
            defaultValue={funnel.cta_label}
            className={fieldClass}
          />
        </label>
        <label className="block space-y-1">
          <span className="text-xs font-bold uppercase text-zinc-500">
            Estado
          </span>
          <select
            name="status"
            defaultValue={funnel.status}
            className={fieldClass}
          >
            <option value="draft">Rascunho</option>
            <option value="active">Activo</option>
            <option value="archived">Arquivado</option>
          </select>
        </label>
        <label className="block space-y-1">
          <span className="text-xs font-bold uppercase text-zinc-500">
            Nome Stripe ebook
          </span>
          <input
            name="stripe_ebook_name"
            defaultValue={funnel.stripe_ebook_name}
            className={fieldClass}
          />
        </label>
        <label className="block space-y-1">
          <span className="text-xs font-bold uppercase text-zinc-500">
            Nome Stripe upsell
          </span>
          <input
            name="stripe_upsell_name"
            defaultValue={funnel.stripe_upsell_name}
            className={fieldClass}
          />
        </label>
      </div>
      <div>
        <p className="mb-2 text-xs font-bold uppercase text-zinc-500">
          Idiomas
        </p>
        <div className="flex flex-wrap gap-2">
          {EBOOK_FUNNEL_LANGUAGES.map((code) => (
            <label
              key={code}
              className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 px-2.5 py-1.5 text-sm"
            >
              <input
                type="checkbox"
                checked={langs.includes(code)}
                onChange={() => toggleLang(code)}
              />
              {code.toUpperCase()}
            </label>
          ))}
        </div>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex gap-2">
        <button type="submit" disabled={pending} className={btnPrimary}>
          {pending ? '…' : 'Guardar'}
        </button>
        <button
          type="button"
          className={btnGhost}
          onClick={() => router.push('/produtos/boost/funis')}
        >
          Voltar à lista
        </button>
      </div>
    </form>
  )
}
