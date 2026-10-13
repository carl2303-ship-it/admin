'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  savePlatformModule,
  togglePlatformModule,
} from '@/lib/padel1/actions'
import type { Padel1PlatformModule } from '@/lib/padel1/types'
import { MODULE_CODES } from '@/lib/padel1/types'
import {
  btnGhost,
  btnPrimary,
  fieldClass,
  Panel,
  StatusPill,
} from './ui'

export function ModulesPanel({
  modules,
  canWrite,
}: {
  modules: Padel1PlatformModule[]
  canWrite: boolean
}) {
  const router = useRouter()
  const [pending, start] = useTransition()
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<string | null>(null)
  const [form, setForm] = useState({
    code: 'manager',
    name: '',
    description: '',
    priceMonthly: '',
    priceAnnual: '',
    targetTypes: 'club',
    requiresModules: '',
    landingFeatures: '',
    playerAppMode: 'full',
    sortOrder: '0',
  })

  const openEdit = (m: Padel1PlatformModule) => {
    setEditing(m.code)
    setShowForm(true)
    setForm({
      code: m.code,
      name: m.name,
      description: m.description || '',
      priceMonthly: m.price_monthly?.toString() || '',
      priceAnnual: m.price_annual?.toString() || '',
      targetTypes: (m.target_types || []).join(','),
      requiresModules: (m.requires_modules || []).join(','),
      landingFeatures: (m.landing_features || []).join('\n'),
      playerAppMode: m.player_app_mode || 'full',
      sortOrder: String(m.sort_order ?? 0),
    })
  }

  return (
    <div className="space-y-4">
      {canWrite && (
        <button
          type="button"
          className={btnPrimary}
          onClick={() => {
            setEditing(null)
            setShowForm(true)
            setForm({
              code: 'manager',
              name: '',
              description: '',
              priceMonthly: '',
              priceAnnual: '',
              targetTypes: 'club',
              requiresModules: '',
              landingFeatures: '',
              playerAppMode: 'full',
              sortOrder: String(modules.length),
            })
          }}
        >
          Novo módulo
        </button>
      )}

      {showForm && canWrite && (
        <Panel className="space-y-3 p-4">
          <div className="grid gap-2 sm:grid-cols-2">
            <label className="text-xs font-semibold">
              Code
              <select
                className={`${fieldClass} mt-1`}
                value={form.code}
                disabled={Boolean(editing)}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
              >
                {MODULE_CODES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-xs font-semibold">
              Nome
              <input
                className={`${fieldClass} mt-1`}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </label>
            <label className="text-xs font-semibold sm:col-span-2">
              Descrição
              <input
                className={`${fieldClass} mt-1`}
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
              />
            </label>
            <label className="text-xs font-semibold">
              € / mês
              <input
                className={`${fieldClass} mt-1`}
                value={form.priceMonthly}
                onChange={(e) =>
                  setForm({ ...form, priceMonthly: e.target.value })
                }
              />
            </label>
            <label className="text-xs font-semibold">
              € / ano
              <input
                className={`${fieldClass} mt-1`}
                value={form.priceAnnual}
                onChange={(e) =>
                  setForm({ ...form, priceAnnual: e.target.value })
                }
              />
            </label>
            <label className="text-xs font-semibold">
              target_types (csv)
              <input
                className={`${fieldClass} mt-1`}
                value={form.targetTypes}
                onChange={(e) =>
                  setForm({ ...form, targetTypes: e.target.value })
                }
              />
            </label>
            <label className="text-xs font-semibold">
              requires_modules (csv)
              <input
                className={`${fieldClass} mt-1`}
                value={form.requiresModules}
                onChange={(e) =>
                  setForm({ ...form, requiresModules: e.target.value })
                }
              />
            </label>
            <label className="text-xs font-semibold">
              player_app_mode
              <select
                className={`${fieldClass} mt-1`}
                value={form.playerAppMode}
                onChange={(e) =>
                  setForm({ ...form, playerAppMode: e.target.value })
                }
              >
                <option value="lite">lite</option>
                <option value="full">full</option>
              </select>
            </label>
            <label className="text-xs font-semibold">
              sort_order
              <input
                className={`${fieldClass} mt-1`}
                value={form.sortOrder}
                onChange={(e) =>
                  setForm({ ...form, sortOrder: e.target.value })
                }
              />
            </label>
            <label className="text-xs font-semibold sm:col-span-2">
              landing_features (1 por linha)
              <textarea
                className={`${fieldClass} mt-1`}
                rows={3}
                value={form.landingFeatures}
                onChange={(e) =>
                  setForm({ ...form, landingFeatures: e.target.value })
                }
              />
            </label>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={pending}
              className={btnPrimary}
              onClick={() =>
                start(async () => {
                  const r = await savePlatformModule({
                    code: form.code,
                    name: form.name,
                    description: form.description,
                    priceMonthly: form.priceMonthly
                      ? Number(form.priceMonthly)
                      : null,
                    priceAnnual: form.priceAnnual
                      ? Number(form.priceAnnual)
                      : null,
                    targetTypes: form.targetTypes
                      .split(',')
                      .map((s) => s.trim())
                      .filter(Boolean),
                    requiresModules: form.requiresModules
                      .split(',')
                      .map((s) => s.trim())
                      .filter(Boolean),
                    landingFeatures: form.landingFeatures
                      .split('\n')
                      .map((s) => s.trim())
                      .filter(Boolean),
                    playerAppMode: form.playerAppMode,
                    sortOrder: Number(form.sortOrder) || 0,
                    isNew: !editing,
                  })
                  if (!r.ok) window.alert(r.error)
                  else {
                    setShowForm(false)
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
              onClick={() => setShowForm(false)}
            >
              Cancelar
            </button>
          </div>
        </Panel>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        {modules.map((m) => (
          <Panel key={m.code} className="space-y-2 p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-semibold text-zinc-900">{m.name}</p>
                <p className="text-xs text-zinc-500">{m.code}</p>
              </div>
              <StatusPill active={m.is_active} />
            </div>
            <p className="text-sm text-zinc-600">{m.description}</p>
            <p className="text-xs text-zinc-500">
              €{m.price_monthly ?? '—'} /mês · €{m.price_annual ?? '—'} /ano ·{' '}
              {(m.target_types || []).join(', ')}
            </p>
            {canWrite && (
              <div className="flex gap-2">
                <button
                  type="button"
                  className={btnGhost}
                  onClick={() => openEdit(m)}
                >
                  Editar
                </button>
                <button
                  type="button"
                  className={btnGhost}
                  disabled={pending}
                  onClick={() =>
                    start(async () => {
                      const r = await togglePlatformModule(m.code, !m.is_active)
                      if (!r.ok) window.alert(r.error)
                      router.refresh()
                    })
                  }
                >
                  {m.is_active ? 'Desactivar' : 'Activar'}
                </button>
              </div>
            )}
          </Panel>
        ))}
      </div>
    </div>
  )
}
