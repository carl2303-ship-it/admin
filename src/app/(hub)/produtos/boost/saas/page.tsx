import { redirect } from 'next/navigation'
import { requireBoostModule, canWriteBoost, staffRole } from '@/lib/boost/auth'
import { listSaasLicenses, saasKpis } from '@/lib/boost/queries'
import { SaasCreateForm, SaasOrgCard } from '@/components/boost/saas-panels'
import {
  ConfigBanner,
  ErrorBanner,
  Panel,
} from '@/components/boost/ui'

function edgeConfigured(): { ok: boolean; message?: string } {
  const url = Boolean(process.env.BOOST_SUPABASE_URL?.trim())
  const anon = Boolean(process.env.BOOST_SUPABASE_ANON_KEY?.trim())
  const edgeAuth =
    Boolean(process.env.BOOST_EDGE_AUTH_EMAIL?.trim()) &&
    Boolean(process.env.BOOST_EDGE_AUTH_PASSWORD?.trim())
  const edgeUser = Boolean(process.env.BOOST_EDGE_USER_ID?.trim())

  if (!url || !anon) {
    return {
      ok: false,
      message:
        'Edge Boost não configurado: falta BOOST_SUPABASE_URL e/ou BOOST_SUPABASE_ANON_KEY. Sem isto não é possível gerar/enviar links de pagamento SaaS.',
    }
  }
  // stripe-checkout aceita anon; provision precisa de EDGE_* — avisamos se faltar
  if (!edgeAuth && !edgeUser) {
    return {
      ok: false,
      message:
        'Falta BOOST_EDGE_AUTH_EMAIL/PASSWORD ou BOOST_EDGE_USER_ID. Links Stripe podem funcionar com anon; provision/credenciais e alguns invokes autenticados falham.',
    }
  }
  return { ok: true }
}

export default async function BoostSaasPage() {
  const auth = await requireBoostModule()
  if (!auth.user) redirect('/login')
  if (auth.error && !auth.isBootstrap) {
    return <ErrorBanner message={auth.error} />
  }
  const write = canWriteBoost(staffRole(auth.staff, auth.isBootstrap))
  const result = await listSaasLicenses()

  if (!result.ok && result.missingConfig) {
    return <ConfigBanner message={result.error} />
  }
  if (!result.ok) return <ErrorBanner message={result.error} />

  const kpis = saasKpis(result.data)
  const edge = edgeConfigured()

  return (
    <div className="space-y-4">
      <h2 className="font-[family-name:var(--font-display)] text-xl font-bold">
        Licenças SaaS Tour
      </h2>
      <p className="text-sm text-zinc-500">
        Organizations com <code>source=boost</code>. Provision e links Stripe
        via Edge Functions existentes — não há lógica Stripe no hub. Cartões
        activos mostram início/fim do plano; renovação recorrente (sem Stripe
        auto-cobrança) envia link por email no fim do período (cron diário) ou
        via «Enviar link de pagamento».
      </p>

      {!edge.ok && edge.message ? (
        <div className="rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          <p className="font-bold">Configuração Edge incompleta</p>
          <p className="mt-1">{edge.message}</p>
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { label: 'Activas', value: kpis.active },
          { label: 'MRR €', value: kpis.mrr.toFixed(2) },
          { label: 'Em risco', value: kpis.atRisk },
        ].map((k) => (
          <Panel key={k.label} className="p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              {k.label}
            </p>
            <p className="mt-1 font-[family-name:var(--font-display)] text-2xl font-bold">
              {k.value}
            </p>
          </Panel>
        ))}
      </div>

      <SaasCreateForm canWrite={write} />

      {result.data.length === 0 ? (
        <Panel className="p-8 text-center text-zinc-500">
          Nenhuma licença Boost. Cria a primeira ou usa o admin legacy.
        </Panel>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {result.data.map((org) => (
            <SaasOrgCard key={org.id} org={org} canWrite={write} />
          ))}
        </div>
      )}
    </div>
  )
}
