import { requireHubAccess } from '@/lib/auth/hub-auth'
import { redirect } from 'next/navigation'

export default async function ConteudoPage() {
  const auth = await requireHubAccess('content')
  if (!auth.user) redirect('/login')
  if (auth.error && !auth.isBootstrap) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
        {auth.error}
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 animate-fade-up">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold">
          Conteúdo & Social
        </h1>
        <p className="mt-2 text-sm text-zinc-500">
          Placeholder Fase 1. O calendário multi-marca e a generalização do
          pipeline Meta/AI do SportsEvents entram depois do MVP shell.
        </p>
      </div>
      <div className="rounded-2xl border border-dashed border-zinc-300 bg-white/60 p-8 text-sm text-zinc-600">
        <ul className="list-disc space-y-2 pl-5">
          <li>Reutilizar <code>content-automation</code> + Meta do SE</li>
          <li>Marcas: Boost / Padel1 / SportsEvents / Carlos Coelho Fotografia</li>
          <li>Fila de aprovação e biblioteca de media — pós Fase 1</li>
        </ul>
        <a
          href="/api/bridge/sportsevents"
          className="mt-6 inline-flex rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500"
        >
          Abrir blog/admin SE (interim)
        </a>
      </div>
    </div>
  )
}
