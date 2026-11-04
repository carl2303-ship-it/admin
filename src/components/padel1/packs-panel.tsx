'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  deletePlatformPack,
  savePlatformPack,
  togglePlatformPack,
} from '@/lib/padel1/actions'
import type {
  Padel1PlatformModule,
  Padel1PlatformPack,
} from '@/lib/padel1/types'
import {
  btnDanger,
  btnGhost,
  btnPrimary,
  fieldClass,
  Panel,
  StatusPill,
} from './ui'

type PackForm = {
  code: string
  name: string
  tagline: string
  description: string
  priceMonthly: string
  priceAnnual: string
  comparePriceMonthly: string
  comparePriceAnnual: string
  moduleCodes: string[]
  isPopular: boolean
  landingFeatures: string
  sortOrder: string
}

const emptyForm = (sortOrder = 0): PackForm => ({
  code: '',
  name: '',
  tagline: '',
  description: '',
  priceMonthly: '',
  priceAnnual: '',
  comparePriceMonthly: '',
  comparePriceAnnual: '',
  moduleCodes: [],
  isPopular: false,
  landingFeatures: '',
  sortOrder: String(sortOrder),
})

function packToForm(p: Padel1PlatformPack): PackForm {
  return {
    code: p.code,
    name: p.name,
    tagline: p.tagline || '',
    description: p.description || '',
    priceMonthly: p.price_monthly?.toString() || '',
    priceAnnual: p.price_annual?.toString() || '',
    comparePriceMonthly: p.compare_price_monthly?.toString() || '',
    comparePriceAnnual: p.compare_price_annual?.toString() || '',
    moduleCodes: [...(p.module_codes || [])],
    isPopular: Boolean(p.is_popular),
    landingFeatures: (p.landing_features || []).join('\n'),
    sortOrder: String(p.sort_order ?? 0),
  }
}

function parseOptionalNumber(raw: string): number | null {
  const t = raw.trim()
  if (!t) return null
  const n = Number(t.replace(',', '.'))
  return Number.isFinite(n) ? n : null
}

function parseRequiredNumber(raw: string): number | null {
  const n = parseOptionalNumber(raw)
  return n
}

export function PacksPanel({
  packs,
  modules,
  canWrite,
}: {
  packs: Padel1PlatformPack[]
  modules: Padel1PlatformModule[]
  canWrite: boolean
}) {
  const router = useRouter()
  const [pending, start] = useTransition()
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<string | null>(null)
  const [form, setForm] = useState<PackForm>(emptyForm(packs.length + 1))

  const moduleOptions = useMemo(
    () =>
      [...modules].sort(
        (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0) || a.code.localeCompare(b.code)
      ),
    [modules]
  )

  const openCreate = () => {
    setEditing(null)
    setForm(emptyForm(packs.length + 1))
    setShowForm(true)
  }

  const openEdit = (p: Padel1PlatformPack) => {
    setEditing(p.code)
    setForm(packToForm(p))
    setShowForm(true)
  }

  const toggleModuleCode = (code: string) => {
    setForm((prev) => {
      const has = prev.moduleCodes.includes(code)
      return {
        ...prev,
        moduleCodes: has
          ? prev.moduleCodes.filter((c) => c !== code)
          : [...prev.moduleCodes, code],
      }
    })
  }

  const submit = () => {
    start(async () => {
      const priceMonthly = parseRequiredNumber(form.priceMonthly)
      const priceAnnual = parseRequiredNumber(form.priceAnnual)
      if (priceMonthly === null || priceAnnual === null) {
        window.alert('Preços mensal e anual são obrigatórios.')
        return
      }
      const r = await savePlatformPack({
        code: editing || form.code,
        name: form.name,
        tagline: form.tagline,
        description: form.description,
        priceMonthly,
        priceAnnual,
        comparePriceMonthly: parseOptionalNumber(form.comparePriceMonthly),
        comparePriceAnnual: parseOptionalNumber(form.comparePriceAnnual),
        moduleCodes: form.moduleCodes,
        landingFeatures: form.landingFeatures
          .split('\n')
          .map((s) => s.trim())
          .filter(Boolean),
        isPopular: form.isPopular,
        sortOrder: Number(form.sortOrder) || 0,
        isNew: !editing,
      })
      if (!r.ok) window.alert(r.error)
      else {
        setShowForm(false)
        setEditing(null)
        router.refresh()
      }
    })
  }

  return (
    <div className="space-y-4">
      {canWrite && (
        <button type="button" className={btnPrimary} onClick={openCreate}>
          Novo pack
        </button>
      )}

      {showForm && canWrite && (
        <Panel className="space-y-3 p-4">
          <p className="text-sm font-semibold text-white">
            {editing ? `Editar pack · ${editing}` : 'Novo pack'}
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            {!editing && (
              <label className="text-xs font-semibold text-slate-300">
                Código
                <input
                  className={`${fieldClass} mt-1`}
                  value={form.code}
                  placeholder="ex. light, total, starter"
                  onChange={(e) =>
                    setForm({ ...form, code: e.target.value.toLowerCase() })
                  }
                />
              </label>
            )}
            <label className="text-xs font-semibold text-slate-300">
              Nome
              <input
                className={`${fieldClass} mt-1`}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </label>
            <label className="text-xs font-semibold text-slate-300 sm:col-span-2">
              Tagline
              <input
                className={`${fieldClass} mt-1`}
                value={form.tagline}
                onChange={(e) => setForm({ ...form, tagline: e.target.value })}
              />
            </label>
            <label className="text-xs font-semibold text-slate-300 sm:col-span-2">
              Descrição
              <textarea
                className={`${fieldClass} mt-1`}
                rows={2}
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
              />
            </label>
            <label className="text-xs font-semibold text-slate-300">
              € / mês
              <input
                className={`${fieldClass} mt-1`}
                value={form.priceMonthly}
                onChange={(e) =>
                  setForm({ ...form, priceMonthly: e.target.value })
                }
              />
            </label>
            <label className="text-xs font-semibold text-slate-300">
              € / ano
              <input
                className={`${fieldClass} mt-1`}
                value={form.priceAnnual}
                onChange={(e) =>
                  setForm({ ...form, priceAnnual: e.target.value })
                }
              />
            </label>
            <label className="text-xs font-semibold text-slate-300">
              Compare € / mês
              <input
                className={`${fieldClass} mt-1`}
                value={form.comparePriceMonthly}
                onChange={(e) =>
                  setForm({ ...form, comparePriceMonthly: e.target.value })
                }
              />
            </label>
            <label className="text-xs font-semibold text-slate-300">
              Compare € / ano
              <input
                className={`${fieldClass} mt-1`}
                value={form.comparePriceAnnual}
                onChange={(e) =>
                  setForm({ ...form, comparePriceAnnual: e.target.value })
                }
              />
            </label>
            <label className="text-xs font-semibold text-slate-300">
              Ordem
              <input
                className={`${fieldClass} mt-1`}
                value={form.sortOrder}
                onChange={(e) =>
                  setForm({ ...form, sortOrder: e.target.value })
                }
              />
            </label>
            <label className="flex items-end gap-2 pb-2 text-xs font-semibold text-slate-300">
              <input
                type="checkbox"
                checked={form.isPopular}
                onChange={(e) =>
                  setForm({ ...form, isPopular: e.target.checked })
                }
              />
              Popular na landing
            </label>
            <fieldset className="sm:col-span-2">
              <legend className="text-xs font-semibold text-slate-300">
                Módulos incluídos
              </legend>
              <div className="mt-2 flex flex-wrap gap-2">
                {moduleOptions.map((m) => {
                  const on = form.moduleCodes.includes(m.code)
                  return (
                    <button
                      key={m.code}
                      type="button"
                      className={
                        on
                          ? 'rounded-lg border border-cyan-500/50 bg-cyan-500/15 px-2.5 py-1 text-xs font-semibold text-cyan-300'
                          : 'rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1 text-xs font-semibold text-slate-400'
                      }
                      onClick={() => toggleModuleCode(m.code)}
                    >
                      {m.name}
                      <span className="ml-1 opacity-60">({m.code})</span>
                    </button>
                  )
                })}
                {moduleOptions.length === 0 && (
                  <p className="text-xs text-slate-500">
                    Sem módulos no catálogo — cria em Módulos primeiro.
                  </p>
                )}
              </div>
            </fieldset>
            <label className="text-xs font-semibold text-slate-300 sm:col-span-2">
              Features landing (1 por linha)
              <textarea
                className={`${fieldClass} mt-1`}
                rows={4}
                value={form.landingFeatures}
                onChange={(e) =>
                  setForm({ ...form, landingFeatures: e.target.value })
                }
              />
            </label>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className={btnPrimary}
              disabled={pending}
              onClick={submit}
            >
              Guardar
            </button>
            <button
              type="button"
              className={btnGhost}
              onClick={() => {
                setShowForm(false)
                setEditing(null)
              }}
            >
              Cancelar
            </button>
          </div>
        </Panel>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        {packs.map((p) => (
          <Panel key={p.code} className="space-y-2 p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-semibold text-white">
                  {p.name}{' '}
                  {p.is_popular && (
                    <span className="text-xs font-bold text-cyan-400">
                      Popular
                    </span>
                  )}
                </p>
                <p className="text-xs text-slate-400">
                  {p.code}
                  {p.sort_order != null ? ` · ordem ${p.sort_order}` : ''}
                </p>
              </div>
              <StatusPill active={p.is_active} />
            </div>
            {p.tagline && (
              <p className="text-sm font-medium text-cyan-300/90">{p.tagline}</p>
            )}
            <p className="text-sm text-slate-400">{p.description}</p>
            <p className="text-xs text-slate-400">
              €{p.price_monthly ?? '—'} /mês · €{p.price_annual ?? '—'} /ano
              {(p.compare_price_monthly != null ||
                p.compare_price_annual != null) && (
                <>
                  {' '}
                  · compare €{p.compare_price_monthly ?? '—'} / €
                  {p.compare_price_annual ?? '—'}
                </>
              )}
            </p>
            <div className="flex flex-wrap gap-1">
              {(p.module_codes || []).map((c) => (
                <span
                  key={c}
                  className="rounded bg-slate-800 px-2 py-0.5 text-[11px] font-semibold text-slate-300"
                >
                  {c}
                </span>
              ))}
            </div>
            {(p.landing_features || []).length > 0 && (
              <ul className="list-inside list-disc text-xs text-slate-500">
                {(p.landing_features || []).slice(0, 4).map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
            )}

            {canWrite && (
              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  type="button"
                  className={btnGhost}
                  onClick={() => openEdit(p)}
                >
                  Editar
                </button>
                <button
                  type="button"
                  className={btnGhost}
                  disabled={pending}
                  onClick={() =>
                    start(async () => {
                      const r = await togglePlatformPack(p.code, !p.is_active)
                      if (!r.ok) window.alert(r.error)
                      router.refresh()
                    })
                  }
                >
                  {p.is_active ? 'Desactivar' : 'Activar'}
                </button>
                {p.code !== 'light' && p.code !== 'total' && (
                  <button
                    type="button"
                    className={btnDanger}
                    disabled={pending}
                    onClick={() =>
                      start(async () => {
                        if (
                          !window.confirm(
                            `Eliminar pack «${p.name}» (${p.code})? Esta acção não se pode desfazer.`
                          )
                        ) {
                          return
                        }
                        const r = await deletePlatformPack(p.code)
                        if (!r.ok) window.alert(r.error)
                        router.refresh()
                      })
                    }
                  >
                    Eliminar
                  </button>
                )}
              </div>
            )}
          </Panel>
        ))}
      </div>
    </div>
  )
}
