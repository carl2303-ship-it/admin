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

const TARGET_OPTIONS = ['club', 'organizer'] as const

type ModuleForm = {
  code: string
  name: string
  description: string
  priceMonthly: string
  priceAnnual: string
  targetTypes: string[]
  requiresModules: string[]
  landingFeatures: string
  playerAppMode: string
  sortOrder: string
}

function emptyForm(sortOrder: number): ModuleForm {
  return {
    code: 'manager',
    name: '',
    description: '',
    priceMonthly: '',
    priceAnnual: '',
    targetTypes: ['club'],
    requiresModules: [],
    landingFeatures: '',
    playerAppMode: 'full',
    sortOrder: String(sortOrder),
  }
}

function moduleToForm(m: Padel1PlatformModule): ModuleForm {
  return {
    code: m.code,
    name: m.name,
    description: m.description || '',
    priceMonthly: m.price_monthly?.toString() || '',
    priceAnnual: m.price_annual?.toString() || '',
    targetTypes: [...(m.target_types || [])],
    requiresModules: [...(m.requires_modules || [])],
    landingFeatures: (m.landing_features || []).join('\n'),
    playerAppMode: m.player_app_mode || '',
    sortOrder: String(m.sort_order ?? 0),
  }
}

function parseOptionalNumber(raw: string): number | null {
  const t = raw.trim()
  if (!t) return null
  const n = Number(t.replace(',', '.'))
  return Number.isFinite(n) ? n : null
}

function toggleInList(list: string[], value: string): string[] {
  return list.includes(value)
    ? list.filter((v) => v !== value)
    : [...list, value]
}

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
  const [form, setForm] = useState<ModuleForm>(emptyForm(modules.length + 1))

  const usedCodes = new Set(modules.map((m) => m.code))
  const createCodes = MODULE_CODES.filter((c) => !usedCodes.has(c))

  const openCreate = () => {
    setEditing(null)
    setForm({
      ...emptyForm(modules.length + 1),
      code: createCodes[0] || MODULE_CODES[0],
    })
    setShowForm(true)
  }

  const openEdit = (m: Padel1PlatformModule) => {
    setEditing(m.code)
    setForm(moduleToForm(m))
    setShowForm(true)
  }

  const submit = () => {
    start(async () => {
      const r = await savePlatformModule({
        code: form.code,
        name: form.name,
        description: form.description,
        priceMonthly: parseOptionalNumber(form.priceMonthly),
        priceAnnual: parseOptionalNumber(form.priceAnnual),
        targetTypes: form.targetTypes,
        requiresModules: form.requiresModules,
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
        setEditing(null)
        router.refresh()
      }
    })
  }

  return (
    <div className="space-y-4">
      {canWrite && (
        <button
          type="button"
          className={btnPrimary}
          disabled={createCodes.length === 0}
          title={
            createCodes.length === 0
              ? 'Todos os códigos de módulo já existem'
              : undefined
          }
          onClick={openCreate}
        >
          Novo módulo
        </button>
      )}

      {showForm && canWrite && (
        <Panel className="space-y-3 p-4">
          <p className="text-sm font-semibold text-white">
            {editing ? `Editar módulo · ${editing}` : 'Novo módulo'}
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            <label className="text-xs font-semibold text-slate-300">
              Code
              <select
                className={`${fieldClass} mt-1`}
                value={form.code}
                disabled={Boolean(editing)}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
              >
                {(editing ? MODULE_CODES : createCodes).map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
                {editing &&
                  !MODULE_CODES.includes(
                    form.code as (typeof MODULE_CODES)[number]
                  ) && <option value={form.code}>{form.code}</option>}
              </select>
            </label>
            <label className="text-xs font-semibold text-slate-300">
              Nome
              <input
                className={`${fieldClass} mt-1`}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
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
            <fieldset className="sm:col-span-2">
              <legend className="text-xs font-semibold text-slate-300">
                Target types
              </legend>
              <div className="mt-2 flex flex-wrap gap-3">
                {TARGET_OPTIONS.map((t) => (
                  <label
                    key={t}
                    className="flex items-center gap-2 text-xs text-slate-300"
                  >
                    <input
                      type="checkbox"
                      checked={form.targetTypes.includes(t)}
                      onChange={() =>
                        setForm({
                          ...form,
                          targetTypes: toggleInList(form.targetTypes, t),
                        })
                      }
                    />
                    {t}
                  </label>
                ))}
              </div>
            </fieldset>
            <fieldset className="sm:col-span-2">
              <legend className="text-xs font-semibold text-slate-300">
                Requer módulos
              </legend>
              <div className="mt-2 flex flex-wrap gap-2">
                {MODULE_CODES.filter((c) => c !== form.code).map((c) => {
                  const on = form.requiresModules.includes(c)
                  return (
                    <button
                      key={c}
                      type="button"
                      className={
                        on
                          ? 'rounded-lg border border-cyan-500/50 bg-cyan-500/15 px-2.5 py-1 text-xs font-semibold text-cyan-300'
                          : 'rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1 text-xs font-semibold text-slate-400'
                      }
                      onClick={() =>
                        setForm({
                          ...form,
                          requiresModules: toggleInList(
                            form.requiresModules,
                            c
                          ),
                        })
                      }
                    >
                      {c}
                    </button>
                  )
                })}
              </div>
            </fieldset>
            <label className="text-xs font-semibold text-slate-300">
              player_app_mode
              <select
                className={`${fieldClass} mt-1`}
                value={form.playerAppMode}
                onChange={(e) =>
                  setForm({ ...form, playerAppMode: e.target.value })
                }
              >
                <option value="">(nenhum)</option>
                <option value="lite">lite</option>
                <option value="full">full</option>
              </select>
            </label>
            <label className="text-xs font-semibold text-slate-300">
              sort_order
              <input
                className={`${fieldClass} mt-1`}
                value={form.sortOrder}
                onChange={(e) =>
                  setForm({ ...form, sortOrder: e.target.value })
                }
              />
            </label>
            <label className="text-xs font-semibold text-slate-300 sm:col-span-2">
              landing_features (1 por linha)
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
          <div className="flex gap-2">
            <button
              type="button"
              disabled={pending}
              className={btnPrimary}
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
        {modules.map((m) => (
          <Panel key={m.code} className="space-y-2 p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-semibold text-white">{m.name}</p>
                <p className="text-xs text-slate-400">
                  {m.code}
                  {m.sort_order != null ? ` · ordem ${m.sort_order}` : ''}
                  {m.player_app_mode ? ` · app ${m.player_app_mode}` : ''}
                </p>
              </div>
              <StatusPill active={m.is_active} />
            </div>
            <p className="text-sm text-slate-400">{m.description}</p>
            <p className="text-xs text-slate-400">
              €{m.price_monthly ?? '—'} /mês · €{m.price_annual ?? '—'} /ano ·{' '}
              {(m.target_types || []).join(', ') || '—'}
            </p>
            {(m.requires_modules || []).length > 0 && (
              <p className="text-xs text-amber-300/80">
                Requer: {(m.requires_modules || []).join(', ')}
              </p>
            )}
            {(m.landing_features || []).length > 0 && (
              <ul className="list-inside list-disc text-xs text-slate-500">
                {(m.landing_features || []).slice(0, 4).map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
            )}
            {canWrite && (
              <div className="flex gap-2 pt-1">
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
                      const r = await togglePlatformModule(
                        m.code,
                        !m.is_active
                      )
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
