'use client'

import { FormEvent, Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Lock } from 'lucide-react'

function LoginFormInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const nextPath = searchParams.get('next') || '/dashboard'
  const authError = searchParams.get('error')

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(
    authError ? 'Falha no callback de autenticação.' : null
  )
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const supabase = createClient()
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })

    setLoading(false)

    if (signInError) {
      setError(
        signInError.message === 'Invalid login credentials'
          ? 'Email ou password incorrectos.'
          : signInError.message
      )
      return
    }

    const safeNext = nextPath.startsWith('/') ? nextPath : '/dashboard'
    router.replace(safeNext)
    router.refresh()
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-zinc-200/80 bg-white/70 px-6 py-4 backdrop-blur">
        <div className="mx-auto flex max-w-md items-center justify-between">
          <div>
            <p className="font-[family-name:var(--font-display)] text-lg font-bold tracking-tight">
              PADEL <span className="text-emerald-600">HUB</span>
            </p>
            <p className="text-[10px] uppercase tracking-[0.16em] text-zinc-500">
              Backoffice global
            </p>
          </div>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center p-6">
        <div className="animate-fade-up w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-8 shadow-lg shadow-zinc-900/5">
          <div className="mb-6 flex items-center gap-3">
            <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-2.5 text-emerald-600">
              <Lock className="h-5 w-5" />
            </div>
            <div>
              <h1 className="font-[family-name:var(--font-display)] text-xl font-bold">
                Entrar
              </h1>
              <p className="text-xs text-zinc-500">
                Contas da equipa global (hub_staff)
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="email" className="text-xs font-semibold text-zinc-600">
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@sportsevents.app"
                className="w-full rounded-xl border border-zinc-300 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-emerald-500"
              />
            </div>
            <div className="space-y-1.5">
              <label
                htmlFor="password"
                className="text-xs font-semibold text-zinc-600"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-zinc-300 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-emerald-500"
              />
            </div>

            {error && (
              <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-emerald-600 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-500 disabled:opacity-50"
            >
              {loading ? 'A autenticar…' : 'Entrar no Hub'}
            </button>
          </form>

          <p className="mt-6 border-t border-zinc-100 pt-4 text-[11px] leading-relaxed text-zinc-500">
            Não há registo público. Seed de{' '}
            <code className="rounded bg-zinc-100 px-1">hub_staff</code> no
            Supabase do hub após criar o user Auth.
          </p>
        </div>
      </main>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center text-sm text-zinc-500">
          A carregar…
        </div>
      }
    >
      <LoginFormInner />
    </Suspense>
  )
}
