'use client'

import { FormEvent, useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  CheckCircle2,
  KeyRound,
  Save,
  Settings,
  Shield,
  UserPlus,
  Users,
} from 'lucide-react'

type StaffMember = {
  id: string
  email: string
  full_name: string
  role: string
  hub: string | null
  phone: string | null
  active: boolean
  created_at: string
}

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

export function DefinicoesPanel() {
  const [staff, setStaff] = useState<StaffMember[]>([])
  const [settings, setSettings] = useState<SettingRow[]>([])
  const [env, setEnv] = useState<Record<string, boolean>>({})
  const [isBootstrap, setIsBootstrap] = useState(false)
  const [serviceRoleConfigured, setServiceRoleConfigured] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [okMsg, setOkMsg] = useState<string | null>(null)

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('STAFF')
  const [hub, setHub] = useState('ALL')
  const [savingStaff, setSavingStaff] = useState(false)

  const [formValues, setFormValues] = useState<Record<string, string>>({})
  const [savingSettings, setSavingSettings] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [staffRes, settingsRes] = await Promise.all([
        fetch('/api/se/staff'),
        fetch('/api/se/settings'),
      ])
      const staffData = await staffRes.json()
      const settingsData = await settingsRes.json()

      if (!staffRes.ok) {
        setError(staffData.error || 'Erro ao carregar staff')
        setLoading(false)
        return
      }
      if (!settingsRes.ok) {
        setError(settingsData.error || 'Erro ao carregar definições')
        setLoading(false)
        return
      }

      setStaff(staffData.staff || [])
      setServiceRoleConfigured(Boolean(staffData.serviceRoleConfigured))
      setIsBootstrap(Boolean(staffData.isBootstrap || settingsData.isBootstrap))
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

  async function bootstrapMe() {
    setError(null)
    setOkMsg(null)
    const res = await fetch('/api/se/staff/bootstrap', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fullName: fullName || undefined }),
    })
    const data = await res.json()
    if (!res.ok) {
      setError(data.error || 'Bootstrap falhou')
      return
    }
    setOkMsg('Foste registado como ADMIN. Já podes criar mais staff.')
    await load()
  }

  async function createStaff(e: FormEvent) {
    e.preventDefault()
    setSavingStaff(true)
    setError(null)
    setOkMsg(null)
    try {
      const res = await fetch('/api/se/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName, email, password, role, hub }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Erro ao criar staff')
      } else {
        setOkMsg(`Login criado para ${data.staff.email}`)
        setFullName('')
        setEmail('')
        setPassword('')
        setRole('STAFF')
        setHub('ALL')
        await load()
      }
    } catch {
      setError('Erro de rede ao criar staff.')
    }
    setSavingStaff(false)
  }

  async function toggleActive(member: StaffMember) {
    setError(null)
    const res = await fetch('/api/se/staff', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: member.id, active: !member.active }),
    })
    const data = await res.json()
    if (!res.ok) {
      setError(data.error || 'Erro ao atualizar')
      return
    }
    await load()
  }

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

  return (
    <div className="min-h-screen bg-navy text-app-white font-sans flex flex-col">
      <header className="bg-navy/90 border-b border-white/10 px-6 py-4 flex flex-wrap justify-between items-center gap-4">
        <div className="flex items-center gap-3">
                    <div>
            <h1 className="text-xl font-black tracking-tight flex items-center gap-2 font-[family-name:var(--font-display)]">
              <Settings className="w-5 h-5 text-cyan" />
              Definições
            </h1>
            <p className="text-xs text-app-white/55">
              Staff, logins e chaves (Stripe, site)
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

      <main className="flex-1 p-6 max-w-5xl mx-auto w-full space-y-8">
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

            {isBootstrap && (
              <section className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5 space-y-3">
                <div className="flex items-start gap-2">
                  <Shield className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <h2 className="text-sm font-black text-amber-200">
                      Primeiro administrador
                    </h2>
                    <p className="text-xs text-amber-200/70 mt-1">
                      Ainda não há staff na base de dados. Regista a tua conta
                      atual como ADMIN para poderes criar logins e guardar
                      chaves.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={bootstrapMe}
                  className="rounded-xl bg-amber-400 text-slate-950 font-bold text-xs px-4 py-2.5"
                >
                  Registar-me como ADMIN
                </button>
              </section>
            )}

            <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5 space-y-5">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-cyan-400" />
                <h2 className="text-sm font-black">Equipa Staff</h2>
              </div>

              {!serviceRoleConfigured && (
                <p className="text-[11px] text-amber-400/90 bg-slate-950 border border-amber-500/20 rounded-xl px-3 py-2">
                  Para criar logins precisas de{' '}
                  <code className="text-amber-300">SUPABASE_SERVICE_ROLE_KEY</code>{' '}
                  no servidor (.env.local / Netlify). Sem ela só vês a lista.
                </p>
              )}

              <div className="space-y-2">
                {staff.length === 0 ? (
                  <p className="text-xs text-slate-500">Nenhum membro ainda.</p>
                ) : (
                  staff.map((m) => (
                    <div
                      key={m.id}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-950 px-4 py-3"
                    >
                      <div>
                        <div className="text-sm font-semibold text-white">
                          {m.full_name}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {m.email} · {m.role}
                          {m.hub ? ` · ${m.hub}` : ''}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            m.active
                              ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10'
                              : 'text-slate-500 border-slate-700'
                          }`}
                        >
                          {m.active ? 'Ativo' : 'Inativo'}
                        </span>
                        <button
                          type="button"
                          onClick={() => toggleActive(m)}
                          className="text-[11px] font-semibold text-slate-400 hover:text-cyan-400"
                        >
                          {m.active ? 'Desativar' : 'Reativar'}
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <form
                onSubmit={createStaff}
                className="border-t border-slate-800 pt-5 space-y-4"
              >
                <div className="flex items-center gap-2 text-xs font-bold text-cyan-400 uppercase tracking-wider">
                  <UserPlus className="w-3.5 h-3.5" />
                  Adicionar pessoa + login
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className="space-y-1 block text-xs">
                    <span className="text-[10px] uppercase text-slate-500 font-bold">
                      Nome completo
                    </span>
                    <input
                      required
                      className={inputCls}
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                    />
                  </label>
                  <label className="space-y-1 block text-xs">
                    <span className="text-[10px] uppercase text-slate-500 font-bold">
                      Email (login)
                    </span>
                    <input
                      required
                      type="email"
                      className={inputCls}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </label>
                  <label className="space-y-1 block text-xs">
                    <span className="text-[10px] uppercase text-slate-500 font-bold">
                      Password inicial
                    </span>
                    <input
                      required
                      type="password"
                      minLength={8}
                      className={inputCls}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="mín. 8 caracteres"
                    />
                  </label>
                  <label className="space-y-1 block text-xs">
                    <span className="text-[10px] uppercase text-slate-500 font-bold">
                      Role
                    </span>
                    <select
                      className={inputCls}
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                    >
                      <option value="ADMIN">ADMIN</option>
                      <option value="STAFF">STAFF</option>
                      <option value="OPERACOES">OPERACOES</option>
                      <option value="COMERCIAL">COMERCIAL</option>
                    </select>
                  </label>
                  <label className="space-y-1 block text-xs sm:col-span-2">
                    <span className="text-[10px] uppercase text-slate-500 font-bold">
                      Hub
                    </span>
                    <select
                      className={inputCls}
                      value={hub}
                      onChange={(e) => setHub(e.target.value)}
                    >
                      <option value="ALL">Todos</option>
                      <option value="ALG">Algarve</option>
                      <option value="MAR">Marbella</option>
                      <option value="BCN">Barcelona</option>
                    </select>
                  </label>
                </div>
                <button
                  type="submit"
                  disabled={savingStaff || !serviceRoleConfigured}
                  className="inline-flex items-center gap-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 font-bold text-xs px-4 py-2.5"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  {savingStaff ? 'A criar...' : 'Criar login Auth'}
                </button>
              </form>
            </section>

            <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5 space-y-5">
              <div className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-amber-400" />
                <h2 className="text-sm font-black">Chaves & integrações</h2>
              </div>

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

              <p className="text-[11px] text-slate-500 leading-relaxed">
                Os badges acima só olham para <strong className="text-slate-400">variáveis de ambiente</strong> (Netlify / .env).
                Em falta no local é normal se as chaves estão só no formulário abaixo (tabela <code className="text-slate-400">app_settings</code>).
                O <strong className="text-slate-400">Service role</strong> não se guarda aqui — tem de estar no Netlify; no localhost fica “Só via formulário” até copiares{' '}
                <code className="text-slate-400">SUPABASE_SERVICE_ROLE_KEY</code> para o{' '}
                <code className="text-slate-400">.env.local</code>.
              </p>

              <div className="rounded-xl border border-slate-800 bg-slate-950/80 px-3 py-2 text-[11px] text-slate-400 space-y-1">
                <div className="text-[10px] uppercase text-slate-500 font-bold">
                  Estado na base de dados (formulário)
                </div>
                <ul className="grid sm:grid-cols-2 gap-1">
                  {settings.map((s) => (
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
                            : '(definido)'
                          : env[s.key]
                            ? '(só env)'
                            : '(vazio)'}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <p className="text-[11px] text-slate-500">
                Prioridade: variável de ambiente → valor guardado abaixo.
              </p>

              <form onSubmit={saveSettings} className="space-y-3">
                {settings.map((s) => (
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
