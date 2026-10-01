import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ConfigSectionNav, IntegrationTable } from '@/components/config/config-ui'
import { requireConfigOwner } from '@/lib/config/queries'
import { getPadel1ConfigStatus } from '@/lib/config/status'
import { ErrorBanner, Panel } from '@/components/boost/ui'

export default async function ConfigPadel1Page() {
  const gate = await requireConfigOwner()
  if (!gate.user) redirect('/login')
  if (!gate.allowed) return <ErrorBanner message={gate.error || 'Sem permissão'} />

  const status = getPadel1ConfigStatus()

  return (
    <div className="mx-auto max-w-5xl space-y-5 animate-fade-up">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-violet-600">
          Configuração · Padel1
        </p>
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight">
          Padel One
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-zinc-500">
          Estado das ligações que o hub usa para KPIs / bridge / futuro HQ.
          Stripe da plataforma e módulos de clube continuam no Manager até à
          Fase 3.
        </p>
      </div>

      <ConfigSectionNav active="padel1" />

      <IntegrationTable items={status.integrations} />

      <Panel className="p-5 text-sm text-zinc-600">
        <p className="font-semibold text-zinc-900">Próximos passos</p>
        <ul className="mt-2 list-inside list-disc space-y-1 text-xs">
          <li>
            Deep-link HQ de emergência:{' '}
            <Link
              href="/produtos/padel1"
              className="font-semibold text-sky-700 hover:underline"
            >
              /produtos/padel1
            </Link>
          </li>
          <li>
            Escrita de secrets Stripe plataforma no hub: Fase 3 (paridade HQ).
          </li>
          <li>
            Env <code>PADEL1_*</code> do admin → Netlify admin.sportsevents.app
            (não editável live neste slice).
          </li>
        </ul>
      </Panel>
    </div>
  )
}
