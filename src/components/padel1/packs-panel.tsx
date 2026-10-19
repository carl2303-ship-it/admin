'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { togglePlatformPack, updatePlatformPack } from '@/lib/padel1/actions'
import type { Padel1PlatformPack } from '@/lib/padel1/types'
import {
  btnGhost,
  btnPrimary,
  fieldClass,
  Panel,
  StatusPill,
} from './ui'

export function PacksPanel({
  packs,
  canWrite,
}: {
  packs: Padel1PlatformPack[]
  canWrite: boolean
}) {
  const router = useRouter()
  const [pending, start] = useTransition()
  const [editCode, setEditCode] = useState<string | null>(null)
  const [form, setForm] = useState({
    name: '',
    priceMonthly: '',
    priceAnnual: '',
    comparePriceMonthly: '',
    moduleCodes: '',
    isPopular: false,
    landingFeatures: '',
  })

  const openEdit = (p: Padel1PlatformPack) => {
    setEditCode(p.code)
    setForm({
      name: p.name,
      priceMonthly: p.price_monthly?.toString() || '',
      priceAnnual: p.price_annual?.toString() || '',
      comparePriceMonthly: p.compare_price_monthly?.toString() || '',
      moduleCodes: (p.module_codes || []).join(','),
      isPopular: p.is_popular,
      landingFeatures: (p.landing_features || []).join('\n'),
    })
  }

  return (
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
              <p className="text-xs text-slate-400">{p.code}</p>
            </div>
            <StatusPill active={p.is_active} />
          </div>
          <p className="text-sm text-slate-400">{p.description}</p>
          <p className="text-xs text-slate-400">
            €{p.price_monthly ?? '—'} /mês · €{p.price_annual ?? '—'} /ano
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

          {editCode === p.code && canWrite && (
            <div className="space-y-2 border-t border-slate-800 pt-3">
              <input
                className={fieldClass}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Nome"
              />
              <div className="grid grid-cols-3 gap-2">
                <input
                  className={fieldClass}
                  value={form.priceMonthly}
                  onChange={(e) =>
                    setForm({ ...form, priceMonthly: e.target.value })
                  }
                  placeholder="€/mês"
                />
                <input
                  className={fieldClass}
                  value={form.priceAnnual}
                  onChange={(e) =>
                    setForm({ ...form, priceAnnual: e.target.value })
                  }
                  placeholder="€/ano"
                />
                <input
                  className={fieldClass}
                  value={form.comparePriceMonthly}
                  onChange={(e) =>
                    setForm({ ...form, comparePriceMonthly: e.target.value })
                  }
                  placeholder="Compare €/mês"
                />
              </div>
              <input
                className={fieldClass}
                value={form.moduleCodes}
                onChange={(e) =>
                  setForm({ ...form, moduleCodes: e.target.value })
                }
                placeholder="module_codes csv"
              />
              <label className="flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  checked={form.isPopular}
                  onChange={(e) =>
                    setForm({ ...form, isPopular: e.target.checked })
                  }
                />
                Popular
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  className={btnPrimary}
                  disabled={pending}
                  onClick={() =>
                    start(async () => {
                      const r = await updatePlatformPack({
                        code: p.code,
                        name: form.name,
                        priceMonthly: form.priceMonthly
                          ? Number(form.priceMonthly)
                          : null,
                        priceAnnual: form.priceAnnual
                          ? Number(form.priceAnnual)
                          : null,
                        comparePriceMonthly: form.comparePriceMonthly
                          ? Number(form.comparePriceMonthly)
                          : null,
                        moduleCodes: form.moduleCodes
                          .split(',')
                          .map((s) => s.trim())
                          .filter(Boolean),
                        isPopular: form.isPopular,
                        landingFeatures: form.landingFeatures
                          .split('\n')
                          .map((s) => s.trim())
                          .filter(Boolean),
                      })
                      if (!r.ok) window.alert(r.error)
                      else {
                        setEditCode(null)
                        router.refresh()
                      }
                    })
                  }
                >
                  Guardar
                </button>
                <button
                  type="button"
                  className={btnGhost}
                  onClick={() => setEditCode(null)}
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}

          {canWrite && editCode !== p.code && (
            <div className="flex gap-2">
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
            </div>
          )}
        </Panel>
      ))}
    </div>
  )
}
