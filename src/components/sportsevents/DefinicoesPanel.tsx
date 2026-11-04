'use client'

import { FormEvent, useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  CheckCircle2,
  KeyRound,
  Save,
  Settings,
} from 'lucide-react'

type SettingRow = {
  key: string
  label: string | null
  is_secret: boolean
  value: string
  masked: string | null
  has_value: boolean
}

const inputCls =
  'w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500/50'

/**
 * Definições SE no hub — só chaves Stripe / settings.
 * Staff legado (staff_members / sportsevents.app/admin) removido (HUB-50);
 * equipa do hub = /equipa (hub_staff).
 */
export function DefinicoesPanel({
  mode = 'full',
}: {
  /** `stripe` = só chaves Stripe (Configuração simplificada). */
  mode?: 'full' | 'stripe'
}) {
  const stripeOnly = mode === 'stripe'
  const [settings, setSettings] = useState<SettingRow[]>([])
  const [env, setEnv] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [okMsg, setOkMsg] = useState<string | null>(null)
  const [formValues, setFormValues] = useState<Record<string, string>>({})
  const [savingSettings, setSavingSettings] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const settingsRes = await fetch('/api/se/settings')
      const settingsData = await settingsRes.json()

      if (!settingsRes.ok) {
        setError(settingsData.error || 'Erro ao carregar definições')
        setLoading(false)
        return
      }

      setSettings(settingsData.settings || [])
      setEnv(settingsData.env || {})

      const vals: Record<string, string> = {}
      for (const s of settingsData.settings || []) {
        vals[s.key] = s.is_secret ? '' : s.value || ''
      }
      setFormValues(vals)
    } catch {
      setError('Erro de rede ao carregar definições.')
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  async function saveSettings(e: FormEvent) {
    e.preventDefault()
    setSavingSettings(true)
    setError(null)
    setOkMsg(null)
    try {
      const res = await fetch('/api/se/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ values: formValues }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Erro ao guardar')
      } else {
        setOkMsg('Definições guardadas.')
        await load()
      }
    } catch {
      setError('Erro de rede ao guardar definições.')
    }
    setSavingSettings(false)
  }

  const visibleSettings = stripeOnly
    ? settings.filter(
        (s) =>
          /stripe/i.test(s.key) ||
          /stripe/i.test(s.label || '') ||
          s.key.toLowerCase().includes('sk_') ||
          s.key.toLowerCase().includes('pk_')
      )
    : settings

  return (
    <div
      className={
        stripeOnly
          ? 'bg-slate-950 text-white font-sans'
          : 'min-h-screen bg-navy text-app-white font-sans flex flex-col'
      }
    >
      {!stripeOnly && (
        <header className="bg-navy/90 border-b border-white/10 px-6 py-4 flex flex-wrap justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-xl font-black tracking-tight flex items-center gap-2 font-[family-name:var(--font-display)]">
                <Settings className="w-5 h-5 text-cyan" />
                Definições
              </h1>
              <p className="text-xs text-app-white/55">
                Chaves Stripe / site — equipa em{' '}
                <Link href="/equipa" className="text-cyan-400 hover:underline">
                  /equipa
                </Link>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/produtos/sportsevents"
              className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-cyan-400"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Backoffice
            </Link>
          </div>
        </header>
      )}

      <main
        className={
          stripeOnly
            ? 'p-5 w-full space-y-6'
            : 'flex-1 p-6 max-w-5xl mx-auto w-full space-y-8'
        }
      >
        {loading ? (
          <p className="text-sm text-slate-500">A carregar...</p>
        ) : (
          <>
            {error && (
              <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                {error}
              </p>
            )}
            {okMsg && (
              <p className="text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                {okMsg}
              </p>
            )}

            <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5 space-y-5">
              <div className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-amber-400" />
                <h2 className="text-sm font-black">
                  {stripeOnly ? 'Chaves Stripe' : 'Chaves & integrações'}
                </h2>
              </div>

              {!stripeOnly && (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 text-[10px]">
                  {[
                    ['Stripe secret (env)', env.stripe_secret_key],
                    ['Stripe publishable (env)', env.stripe_publishable_key],
                    ['Stripe webhook (env)', env.stripe_webhook_secret],
                    ['Site URL (env)', env.site_url],
                    ['Service role (env)', env.service_role],
                  ].map(([label, ok]) => (
                    <div
                      key={String(label)}
                      className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-2"
                    >
                      <div className="text-slate-500">{label}</div>
                      <div
                        className={
                          ok ? 'text-emerald-400 font-bold' : 'text-slate-600'
                        }
                      >
                        {ok ? 'No servidor' : 'Só via formulário'}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {stripeOnly ? (
                <p className="text-sm text-slate-400">
                  Estado de cada chave (OK / em falta). Cola um valor novo só se
                  precisares de mudar — deixa vazio para manter.
                </p>
              ) : (
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Os badges acima só olham para{' '}
                  <strong className="text-slate-400">variáveis de ambiente</strong>{' '}
                  (Netlify / .env). Equipa do hub em{' '}
                  <Link href="/equipa" className="text-cyan-400 hover:underline">
                    /equipa
                  </Link>
                  .
                </p>
              )}

              <div className="rounded-xl border border-slate-800 bg-slate-950/80 px-3 py-2 text-[11px] text-slate-400 space-y-1">
                <div className="text-[10px] uppercase text-slate-500 font-bold">
                  {stripeOnly ? 'Estado' : 'Estado na base de dados (formulário)'}
                </div>
                <ul className="grid sm:grid-cols-2 gap-1">
                  {visibleSettings.map((s) => (
                    <li key={s.key} className="flex items-center gap-2">
                      <span
                        className={
                          s.has_value || env[s.key]
                            ? 'text-emerald-400'
                            : 'text-amber-400'
                        }
                      >
                        {s.has_value || env[s.key] ? '●' : '○'}
                      </span>
                      <span>{s.label || s.key}</span>
                      <span className="text-slate-600">
                        {s.has_value
                          ? s.masked
                            ? `(${s.masked})`
                            : '(OK)'
                          : env[s.key]
                            ? '(OK)'
                            : '(em falta)'}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <form onSubmit={saveSettings} className="space-y-3">
                {visibleSettings.map((s) => (
                  <label key={s.key} className="block space-y-1 text-xs">
                    <span className="text-[10px] uppercase text-slate-500 font-bold">
                      {s.label || s.key}
                      {s.is_secret && s.has_value && s.masked
                        ? ` · atual: ${s.masked}`
                        : ''}
                    </span>
                    <input
                      className={inputCls}
                      type={s.is_secret ? 'password' : 'text'}
                      placeholder={
                        s.is_secret
                          ? 'Deixa vazio para manter a chave atual'
                          : undefined
                      }
                      value={formValues[s.key] ?? ''}
                      onChange={(e) =>
                        setFormValues((prev) => ({
                          ...prev,
                          [s.key]: e.target.value,
                        }))
                      }
                      autoComplete="off"
                    />
                  </label>
                ))}
                <button
                  type="submit"
                  disabled={savingSettings}
                  className="inline-flex items-center gap-2 rounded-xl bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-slate-950 font-bold text-xs px-4 py-2.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  {savingSettings ? 'A guardar...' : 'Guardar chaves'}
                </button>
              </form>
            </section>
          </>
        )}
      </main>
    </div>
  )
}
