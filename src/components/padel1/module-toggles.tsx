'use client'

import { useEffect, useState, useTransition } from 'react'
import {
  applyClientPack,
  bulkEnableModules,
  loadClientModulesAction,
  setClientModule,
} from '@/lib/padel1/actions'
import type { Padel1ClientModule, Padel1PlatformModule } from '@/lib/padel1/types'
import { btnGhost, btnPrimary } from './ui'

export function ModuleToggles({
  entityType,
  entityId,
  entityName,
  canWrite,
}: {
  entityType: 'club' | 'organizer'
  entityId: string
  entityName?: string
  canWrite: boolean
}) {
  const [catalog, setCatalog] = useState<Padel1PlatformModule[]>([])
  const [clientMods, setClientMods] = useState<Record<string, Padel1ClientModule>>(
    {}
  )
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pending, start] = useTransition()

  const load = async () => {
    setLoading(true)
    setError(null)
    const res = await loadClientModulesAction({ entityType, entityId })
    if (!res.ok) {
      setError(res.error)
      setLoading(false)
      return
    }
    setCatalog(res.data.catalog)
    const map: Record<string, Padel1ClientModule> = {}
    for (const row of res.data.client) map[row.module_code] = row
    setClientMods(map)
    setLoading(false)
  }

  useEffect(() => {
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entityType, entityId])

  const enabled = (code: string) => clientMods[code]?.enabled === true

  if (loading) {
    return <p className="text-xs text-slate-400">A carregar módulos…</p>
  }

  return (
    <div className="space-y-3 border-t border-slate-800 pt-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold text-slate-200">Módulos activos</p>
        {canWrite && entityType === 'club' && (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={pending}
              className={btnGhost}
              onClick={() =>
                start(async () => {
                  if (!window.confirm('Aplicar Pack Light?')) return
                  const r = await applyClientPack({
                    entityType,
                    entityId,
                    packCode: 'light',
                  })
                  if (!r.ok) setError(r.error)
                  else await load()
                })
              }
            >
              Pack Light
            </button>
            <button
              type="button"
              disabled={pending}
              className={btnGhost}
              onClick={() =>
                start(async () => {
                  if (!window.confirm('Aplicar Pack Total?')) return
                  const r = await applyClientPack({
                    entityType,
                    entityId,
                    packCode: 'total',
                  })
                  if (!r.ok) setError(r.error)
                  else await load()
                })
              }
            >
              Pack Total
            </button>
            <button
              type="button"
              disabled={pending}
              className={btnPrimary}
              onClick={() =>
                start(async () => {
                  if (
                    !window.confirm(
                      `Activar todos os módulos para ${entityName || 'este clube'}?`
                    )
                  )
                    return
                  const r = await bulkEnableModules({ entityType, entityId })
                  if (!r.ok) setError(r.error)
                  else await load()
                })
              }
            >
              Activar todos
            </button>
          </div>
        )}
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
      <div className="grid gap-2 sm:grid-cols-2">
        {catalog.map((mod) => {
          const on = enabled(mod.code)
          const blocked = (mod.requires_modules || []).some((req) => !enabled(req))
          return (
            <div
              key={mod.code}
              className="flex items-center justify-between gap-2 rounded-lg border border-slate-800 px-3 py-2"
            >
              <div>
                <p className="text-sm font-semibold text-slate-200">{mod.name}</p>
                <p className="text-[11px] text-slate-400">{mod.code}</p>
                {blocked && (
                  <p className="text-[11px] text-amber-400">
                    Requer: {(mod.requires_modules || []).join(', ')}
                  </p>
                )}
              </div>
              {canWrite ? (
                <button
                  type="button"
                  disabled={pending || (!on && blocked)}
                  className={on ? btnPrimary : btnGhost}
                  onClick={() =>
                    start(async () => {
                      const r = await setClientModule({
                        entityType,
                        entityId,
                        moduleCode: mod.code,
                        enabled: !on,
                      })
                      if (!r.ok) setError(r.error)
                      else await load()
                    })
                  }
                >
                  {on ? 'On' : 'Off'}
                </button>
              ) : (
                <span className="text-xs font-bold text-slate-400">
                  {on ? 'On' : 'Off'}
                </span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
